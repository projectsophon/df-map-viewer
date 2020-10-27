import { CanvasRenderer } from './CanvasRenderer';
import { emptyAddress, address, Contract } from './Contract';
import { LocalStorageManager } from './LocalStorageManager';
import {
  PlanetHelper,
  VoyageContractData,
  PlanetVoyageIdMap,
} from './PlanetHelper';
import { Viewport } from './Viewport';

async function start() {
  const canvas = document.querySelector('canvas');

  if (!canvas) {
    console.error('Need a canvas');
    return;
  }

  const homeCoords = { x: 0, y: 0 };
  const widthInWorldUnits = 250;
  const endTimeSeconds = 1609372800;
  // TODO: Use mine for testing
  const myAddress = emptyAddress;

  const chunkStore = await LocalStorageManager.create(myAddress);

  // initialize dependencies according to a DAG

  // first we initialize the ContractsAPI and get the user's eth account, and load contract constants + state
  const contractsAPI = await Contract.create();

  // get data from the contract
  const contractConstants = await contractsAPI.getConstants();
  const perlinThresholds = [
    contractConstants.PERLIN_THRESHOLD_1,
    contractConstants.PERLIN_THRESHOLD_2,
  ];
  // const players = await contractsAPI.getPlayers();
  const worldRadius = await contractsAPI.getWorldRadius();

  const arrivals: VoyageContractData = {};
  const planetVoyageIdMap: PlanetVoyageIdMap = {};
  const allArrivals = await contractsAPI.getAllArrivals();
  // fetch planets after allArrivals, since an arrival to a new planet might be sent
  // while we are fetching
  const planets = await contractsAPI.getPlanets();
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
    viewport
  );
}

start().then(console.log).catch(console.log);
