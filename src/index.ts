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
// @ts-ignore
import multileveldown from '/vendor/multileveldown-browser.js';
// @ts-ignore
import LevelRangeEmitter from '/vendor/level-range-emitter-browser.js';
import WebSocket from 'simple-websocket/simplewebsocket.min';
import { ReplayTimer } from './Timer';

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

  const chunkStore = new JsonStorageManager('/map.json')

  const contractsAPI = await Contract.create();

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
    contractConstants,
    worldRadius,
    allArrivals = [] as QueuedArrival[],
    planets = new Map(),
  ] = await Promise.all([
    chunkStore.loadIntoMemory(),
    contractsAPI.getConstants(),
    contractsAPI.getWorldRadius(),
    // contractsAPI.getAllArrivals(),
    // contractsAPI.getPlanets(),
  ]);

  console.log('world radius', worldRadius);

  const perlinThresholds = [
    contractConstants.PERLIN_THRESHOLD_1,
    contractConstants.PERLIN_THRESHOLD_2,
  ];

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

  contractsAPI.on(ContractsAPIEvent.PlanetUpdate, async (planet: Planet, arrivals: QueuedArrival[]) => {
    planetHelper.refreshPlanetAndArrivals(planet, arrivals);
    console.log(planetHelper.getLocationOfPlanet(planet.locationId));
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

  for (const evt of eventLogs) {
    // console.log(await evt.getBlock());
    console.log('waiting to process:', evt);
    await timer.waitForBlockNumber(evt.blockNumber);
    console.log('now processing:', evt);
    const args = evt.args || [];
    contractsAPI.coreContract.emit.apply(contractsAPI.coreContract, [evt.event, ...args, evt]);
  }
}

start().then(console.log).catch(console.log);
