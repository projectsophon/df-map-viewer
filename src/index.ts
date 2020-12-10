import { CanvasRenderer } from './CanvasRenderer';
import { Contract, ContractsAPIEvent } from './Contract';
import { JsonStorageManager, LocalStorageManager, toExploredChunk } from './LocalStorageManager';
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

import App from './components/app.svelte';
import { users, speedMultiplier, selectedPlanet } from './components/stores.js';
import { getPlayerColor } from './Cosmetic';

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

  // const homeCoords = { x: 0, y: 0 };
  const homeCoords = {
    x: 3000,
    y: 3983
  };
  const widthInWorldUnits = 250;
  const endTimeSeconds = 1609372800;

  const contractsAPI = await Contract.create();
  const contractConstants = await contractsAPI.getConstants();

  const perlinThresholds = [
    contractConstants.PERLIN_THRESHOLD_1,
    contractConstants.PERLIN_THRESHOLD_2,
  ];

  const chunkStore = new JsonStorageManager('/map.json', perlinThresholds);

  const eventLogs = await contractsAPI.coreContract.queryFilter(
    {
      address: contractsAPI.coreContract.address,
    },
    12314144,
    12314144 + 20000
  );
  console.log(eventLogs);

  const [
    _mapLoaded,
    worldRadius,
    twitters,
    allArrivals = [] as QueuedArrival[],
    planets = new Map(),
  ] = await Promise.all([
    chunkStore.loadIntoMemory(),
    contractsAPI.getWorldRadius(),
    getAllTwitters(),
    // contractsAPI.getAllArrivals(),
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

  const timer = new ReplayTimer();

  const planetHelper = new PlanetHelper(
    planets,
    chunkStore,
    arrivals,
    planetVoyageIdMap,
    contractConstants,
    endTimeSeconds,
    timer,
  );

  contractsAPI.on(ContractsAPIEvent.PlanetUpdate, (planet: Planet, arrivals: QueuedArrival[]) => {
    planetHelper.refreshPlanetAndArrivals(planet, arrivals);
    console.log(planetHelper.getLocationOfPlanet(planet.locationId));
  });

  contractsAPI.on(ContractsAPIEvent.PlayerInit, (player, homePlanet) => {
    console.log(player, homePlanet);
    const { address } = player;
    const twitter = twitters[address];
    const color = getPlayerColor(address);
    // @ts-ignore
    users.update(users => users.concat({ address, twitter, homePlanet, color }))
  });

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

  speedMultiplier.subscribe((multiplier) => timer.setSpeedMultiplier(multiplier));
  selectedPlanet.subscribe((planet) => viewport.centerPlanet(planet));

  for (const evt of eventLogs) {
    let block = await evt.getBlock()
    console.log('waiting to process %o at %d', evt, block.timestamp);
    await timer.waitForBlockNumber(block.timestamp);
    console.log('now processing:', evt);
    const args = evt.args || [];
    contractsAPI.coreContract.emit.apply(contractsAPI.coreContract, [evt.event, ...args, evt]);
  }
}

start().then(console.log).catch(console.log);

const svelteApp = new App({
  target: document.getElementById("ui"),
});
