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
import { Planet, PlanetLevel } from './GlobalTypes';
import { ReplayTimer } from './Timer';
import { getAllTwitters } from './Twitter';
import { getPlayerColor } from './Cosmetic';
import { HistoricEvents } from './HistoricEvents';
import {
  users,
  speedMultiplier,
  selectedPlanet,
  blockInformation,
  seekTo,
  centerCoords,
  widthInWorldUnits,
  playing,
} from './components/stores.js';
// @ts-ignore
import App from './components/app.svelte';

import {
  isReplay,
  firstReplayBlock,
  endTimeSeconds,
} from './constants'

async function start() {
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

  let startupCoords;
  centerCoords.subscribe((coords) => {
    startupCoords = coords;
  });

  let startupWidthInWorldUnits;
  widthInWorldUnits.subscribe((width) => {
    startupWidthInWorldUnits = width;
  })

  let currentSpeed = 1;

  let blocktimesResp = await fetch('/blocktimes.json')
  let blocktimes = new Map(await blocktimesResp.json());

  const contractsAPI = await Contract.create(isReplay);
  // These technically never change after contract initialize, so we don't refetch them on scrub
  const contractConstants = await contractsAPI.getConstants(firstReplayBlock);

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

  contractsAPI.on(ContractsAPIEvent.PlayerInit, (player, homePlanet) => {
    const { address } = player;
    const twitter = twitters[address];
    const color = getPlayerColor(address);
    // @ts-ignore
    users.update(users => users.concat({ address, twitter, homePlanet, color }))
  });

  let rebootWithBlockNumber;
  let historicEvents;

  seekTo.subscribe(({ init, seeking, blockNumber }) => {
    if (seeking) {
      historicEvents?.destroy();
    }
    if (init || seeking) {
      rebootWithBlockNumber = blockNumber
      historicEvents = new HistoricEvents(rebootWithBlockNumber, contractsAPI, blocktimes, 3000);
    }
  });

  while (true) {
    if (rebootWithBlockNumber) {
      try {
        await reboot(rebootWithBlockNumber, canvas);
        console.log('destroyed previous replay');
      } catch (err) {
        console.error('err with previous replay', err);
      }
    }
  }

  async function reboot(startBlockNumber: number, canvas: HTMLCanvasElement) {
    let startBlockTime;
    if (blocktimes.has(startBlockNumber)) {
      startBlockTime = blocktimes.get(startBlockNumber);
    } else {
      const block = await contractsAPI.getBlock(startBlockNumber);
      startBlockTime = block.timestamp * 1000;
    }

    blockInformation.set({ number: startBlockNumber, date: new Date(startBlockTime) });

    const [
      worldRadius,
      allArrivals,
      planets,
      players,
    ] = await Promise.all([
      contractsAPI.getWorldRadius(startBlockNumber),
      contractsAPI.getAllArrivals(startBlockNumber),
      contractsAPI.getPlanets(startBlockNumber),
      contractsAPI.getPlayers(startBlockNumber),
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

    const timer = new ReplayTimer(startBlockTime, currentSpeed);
    let speedMultiplierUnsub = speedMultiplier.subscribe((multiplier) => {
      currentSpeed = multiplier;
      timer.setSpeedMultiplier(multiplier)
    });

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
      startupCoords,
      startupWidthInWorldUnits,
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

    contractsAPI.on(ContractsAPIEvent.RadiusUpdated, async (newRadius: number) => {
      // TODO: Maybe this should go in Viewport
      renderer.worldRadius = newRadius;
    });

    let selectedPlanetUnsub = selectedPlanet.subscribe((planet) => viewport.centerPlanet(planet));
    let playingUnsub = playing.subscribe((isPlaying) => {
      if (isPlaying) {
        timer.start();
      } else {
        timer.stop();
      }
    });

    // @ts-ignore
    users.update((_users) => {
      return Object.values(players).map((player) => {
        const { address } = player;
        const twitter = twitters[address];
        const color = getPlayerColor(address);
        // Their oldest level 0 planet is the best we can guess
        let planets = planetHelper.getPlanetsByOwner(address);
        let homePlanet;
        if (planets.length !== 0) {
          homePlanet = planets.reduce((oldest, planet) => {
            if (planet.planetLevel === PlanetLevel.MIN && planet.createdAt && oldest.createdAt) {
              return planet.createdAt < oldest.createdAt ? planet : oldest
            } else {
              return oldest
            }
          })
        }
        return { address, twitter, homePlanet, color }
      });
    });

    seekTo.update((prev) => ({ ...prev, init: false, seeking: false }));

    for await (const { timestamp, blockNumber, events } of historicEvents) {
      if (!timestamp) {
        console.log('no timestamp for block %d - whyyyy?', blockNumber);
        continue;
      }
      timer.registerBlock(timestamp, () => {
        for (let { raw, event, args } of events) {
          contractsAPI.emit.apply(contractsAPI, [event, ...args, raw])
        }
        // We want to know the time of each block, instead of the timer that is running
        blockInformation.set({ number: blockNumber, date: new Date(timestamp) });
      });
    }

    // Stash the viewport stuff for when we reboot
    centerCoords.set(viewport.centerWorldCoords);
    widthInWorldUnits.set(viewport.widthInWorldUnits);

    // Then destory everything
    renderer.destroy();
    viewport.destroy();
    planetHelper.destroy();
    timer.destroy();
    selectedPlanetUnsub();
    speedMultiplierUnsub();
    playingUnsub();
  }
}

start()
  .then(() => console.log('successfully booted replay'))
  .catch((err) => console.error('error with replay', err));

const svelteApp = new App({
  target: document.getElementById("ui"),
});
