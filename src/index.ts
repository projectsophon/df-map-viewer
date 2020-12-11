import { CanvasRenderer } from './CanvasRenderer';
import { Contract, ContractsAPIEvent } from './Contract';
import { JsonStorageManager } from './LocalStorageManager';
import {
  PlanetHelper,
  VoyageContractData,
  PlanetVoyageIdMap,
  QueuedArrival,
} from './PlanetHelper';
import { Viewport } from './Viewport';
import { Planet } from './GlobalTypes';
import { ReplayTimer } from './Timer';
import { getAllTwitters } from './Twitter';
import { getPlayerColor } from './Cosmetic';

import { Event } from '@ethersproject/contracts';
import { users, speedMultiplier, selectedPlanet, blockInformation } from './components/stores.js';
// @ts-ignore
import App from './components/app.svelte';

const firstReplayBlock = 12314145;
const lastReplayBlock = 12491275;

// const homeCoords = { x: 0, y: 0 };
const homeCoords = {
  x: 3000,
  y: 3983
};
const widthInWorldUnits = 250;
const endTimeSeconds = 1609372800;

const isReplay = true;

const timer = new ReplayTimer();

speedMultiplier.subscribe((multiplier) => timer.setSpeedMultiplier(multiplier));

async function start(startBlockNumber: number) {
  const canvas = document.querySelector('canvas');

  if (!canvas) {
    console.error('Need a canvas');
    return;
  }

  const ctx = canvas.getContext('2d');

  if (ctx) {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    ctx.font = `18px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText('Loading the contract & map data. This will take awhile.', canvas.width / 2, canvas.height / 2);
  }

  const contractsAPI = await Contract.create(isReplay);
  // These technically never change after contract initialize, so we don't refetch them on scrub
  const contractConstants = await contractsAPI.getConstants(startBlockNumber);

  const perlinThresholds = [
    contractConstants.PERLIN_THRESHOLD_1,
    contractConstants.PERLIN_THRESHOLD_2,
  ];

  const chunkStore = new JsonStorageManager('/map.json', perlinThresholds);

  // Wait on these once so we don't have to reload on each scrub
  let [
    _mapLoaded,
    twitters,
  ] = await Promise.all([
    chunkStore.loadIntoMemory(),
    getAllTwitters(),
  ]);

  async function* historicEvents(blockNumber: number) {
    let chunk = 1000;
    let lastEndChunk = blockNumber;
    let idx = 0;
    let eventLogs: Event[] = [];

    while (true) {
      if (idx >= eventLogs.length) {
        let nextEndChunk = lastEndChunk + chunk;
        eventLogs = eventLogs.concat(await contractsAPI.getLogs(lastEndChunk, nextEndChunk));
        lastEndChunk = nextEndChunk;
      }

      let nextEvent = eventLogs[idx];
      if (nextEvent) {
        idx++;
        let block = await nextEvent.getBlock()
        yield {
          raw: nextEvent,
          event: nextEvent.event,
          args: nextEvent.args || [],
          timestamp: block.timestamp
        }
      }
    }
  }

  const [
    worldRadius,
    allArrivals = [] as QueuedArrival[],
    planets = new Map(),
  ] = await Promise.all([
    contractsAPI.getWorldRadius(startBlockNumber),
    Promise.resolve(),
    // contractsAPI.getAllArrivals(),
    Promise.resolve(),
    // contractsAPI.getPlanets(),
  ]);

  console.log('world radius', worldRadius);

  const arrivals: VoyageContractData = {};
  const planetVoyageIdMap: PlanetVoyageIdMap = {};

  planets.forEach((planet, locId) => {
    if (planets.has(locId)) {
      planetVoyageIdMap[locId] = [];
    }
  });

  for (const arrival of allArrivals) {
    planetVoyageIdMap[arrival.toPlanet].push(arrival.eventId);
    arrivals[arrival.eventId] = arrival;
  }

  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  const planetHelper = new PlanetHelper(
    planets,
    chunkStore,
    arrivals,
    planetVoyageIdMap,
    contractConstants,
    endTimeSeconds,
    timer,
  );

  const viewport = new Viewport(
    planetHelper,
    homeCoords,
    widthInWorldUnits,
    canvas.width,
    canvas.height,
    canvas
  );

  const renderer = new CanvasRenderer(
    canvas,
    worldRadius,
    perlinThresholds,
    planetHelper,
    viewport,
    timer,
  );

  contractsAPI.on(ContractsAPIEvent.PlanetUpdate, (planet: Planet, arrivals: QueuedArrival[]) => {
    planetHelper.refreshPlanetAndArrivals(planet, arrivals);
  });

  contractsAPI.on(ContractsAPIEvent.PlayerInit, (player, homePlanet) => {
    const { address } = player;
    const twitter = twitters[address];
    const color = getPlayerColor(address);
    // @ts-ignore
    users.update(users => users.concat({ address, twitter, homePlanet, color }))
  });

  contractsAPI.on(ContractsAPIEvent.RadiusUpdated, async (newRadius: number) => {
    // TODO: Maybe this should go in Viewport
    renderer.worldRadius = newRadius;
  });

  selectedPlanet.subscribe((planet) => viewport.centerPlanet(planet));

  for await (const { raw, event, args, timestamp } of historicEvents(startBlockNumber)) {
    await timer.waitForBlockNumber(timestamp);
    // We want to know the time of each block, instead of the timer that is running
    // This is a blockchain timestamp, which is in seconds
    blockInformation.set({ number: raw.blockNumber, date: new Date(timestamp * 1000) });
    contractsAPI.emit.apply(contractsAPI, [event, ...args, raw]);
  }
}

start(firstReplayBlock).then(console.log).catch(console.log);

const svelteApp = new App({
  target: document.getElementById("ui"),
});
