import {
  Planet,
  LocationId,
  PlanetLevel,
  WorldCoords,
  Location,
  SpaceType,
  PlanetResource,
  ExploredChunkData,
} from './GlobalTypes';
import {
  ContractConstants,
  EthAddress,
  emptyAddress,
  contractPrecision,
} from './Contract';
import {
  ChunkStore
} from './LocalStorageManager';
import bigInt from 'big-integer';
import { Timer } from './Timer';

export const hasOwner = (planet: Planet) => {
  // planet.owner should never be null
  return planet.owner !== emptyAddress;
};

const getCoordsString = (coords: WorldCoords): CoordsString => {
  return `${coords.x},${coords.y}`;
};

export const getPlanetRank = (planet: Planet | null): number => {
  if (!planet) return 0;
  return planet.upgradeState.reduce((a, b) => a + b);
};

export const getBytesFromHex = (
  hexStr: string,
  startByte: number,
  endByte: number
) => {
  const byteString = hexStr.substring(2 * startByte, 2 * endByte);
  return bigInt(`0x${byteString}`);
};

export type Bonus = [boolean, boolean, boolean, boolean, boolean];
export const bonusFromHex = (hex: LocationId): Bonus => {
  const bonuses = Array(5).fill(false) as Bonus;

  for (let i = 0; i < bonuses.length; i++) {
    bonuses[i] = getBytesFromHex(hex, 9 + i, 10 + i).lesser(16);
  }

  return bonuses;
};

export type PlanetMap = Map<LocationId, Planet>;

export type QueuedArrival = {
  eventId: string;
  player: EthAddress;
  fromPlanet: LocationId;
  toPlanet: LocationId;
  energyArriving: number;
  silverMoved: number;
  departureTime: number;
  arrivalTime: number;
};
export interface ArrivalWithTimer {
  arrivalData: QueuedArrival;
  timer: number;
}
export interface VoyageMap {
  [arrivalId: string]: ArrivalWithTimer;
}

export interface PlanetVoyageIdMap {
  [planetId: string]: string[]; // to arrivalIDs
}

export interface PlanetLocationMap {
  [planetId: string]: Location;
}

type CoordsString = string;
type MemoizedCoordHashes = Map<CoordsString, Location>;

// ONLY USED FOR PLANETHELPER CONSTRUCTOR
export interface VoyageContractData {
  [arrivalId: string]: QueuedArrival;
}

function radiusMap() {
  const radii = new Map();
  // radii.set(PlanetType.LittleAsteroid, 1);
  radii.set(PlanetLevel.Asteroid, 1);
  radii.set(PlanetLevel.BrownDwarf, 3);
  radii.set(PlanetLevel.RedDwarf, 9);
  radii.set(PlanetLevel.WhiteDwarf, 27);
  radii.set(PlanetLevel.YellowStar, 54);
  radii.set(PlanetLevel.BlueStar, 72);
  radii.set(PlanetLevel.Giant, 81);
  radii.set(PlanetLevel.Supergiant, 90);
  // radii.set(PlanetType.SuperGiant] = 75);
  // radii.set(PlanetType.HyperGiant] = 100);
  return radii;
}

export class PlanetHelper {
  private readonly radiusMap: Map<PlanetLevel, number>;
  private readonly planets: PlanetMap;
  private readonly arrivals: VoyageMap;
  private readonly planetArrivalIds: PlanetVoyageIdMap;
  private readonly planetLocationMap: PlanetLocationMap;
  private readonly contractConstants: ContractConstants;
  private readonly coordsToLocation: MemoizedCoordHashes;

  private readonly endTimeSeconds: number;

  // TODO: Should this be tied to PlanetHelper?
  private chunkStore: ChunkStore;

  private timer: Timer;

  constructor(
    planets: PlanetMap,
    chunkStore: ChunkStore,
    unprocessedArrivals: VoyageContractData,
    unprocessedPlanetArrivalIds: PlanetVoyageIdMap,
    contractConstants: ContractConstants,
    endTimeSeconds: number,
    timer: Timer,
  ) {
    this.timer = timer;
    this.chunkStore = chunkStore;
    this.radiusMap = radiusMap();
    this.planets = planets;
    this.contractConstants = contractConstants;
    this.coordsToLocation = new Map();
    this.planetLocationMap = {};
    const planetArrivalIds: PlanetVoyageIdMap = {};
    const arrivals: VoyageMap = {};
    this.endTimeSeconds = endTimeSeconds;

    planets.forEach((_planet, planetId) => {
      const planet = planets.get(planetId);
      if (planet) {
        const arrivalsForPlanet = unprocessedPlanetArrivalIds[planetId]
          .map((arrivalId) => unprocessedArrivals[arrivalId] || null)
          .filter((x) => !!x);
        const arrivalsWithTimers = this.processArrivalsForPlanet(
          planet.locationId,
          arrivalsForPlanet
        );
        planetArrivalIds[planetId] = arrivalsWithTimers.map(
          (arrival) => arrival.arrivalData.eventId
        );
        for (const arrivalWithTimer of arrivalsWithTimers) {
          const arrivalId = arrivalWithTimer.arrivalData.eventId;
          arrivals[arrivalId] = arrivalWithTimer;
        }
        this.updateScore(planetId as LocationId);
      }
    });

    const allChunks = chunkStore.allChunks();
    for (const chunk of allChunks) {
      for (const planetLocation of chunk.planetLocations) {
        this.addPlanetLocation(planetLocation);
      }
    }

    this.arrivals = arrivals;
    this.planetArrivalIds = planetArrivalIds;

    // set interval to update all planets every 120s
    // TODO: add to Timer
    setInterval(() => {
      this.planets.forEach((planet) => {
        if (planet && hasOwner(planet)) {
          this.updatePlanetToTime(planet, this.timer.now());
        }
      });
    }, 120000);
  }

  public getExploredChunks(): Iterable<ExploredChunkData> {
    return this.chunkStore.allChunks();
  }
  public getExploredNebula(): Iterable<ExploredChunkData> {
    return this.chunkStore.getNebulaChunks();
  }
  public getExploredSpace(): Iterable<ExploredChunkData> {
    return this.chunkStore.getSpaceChunks();
  }
  public getExploredDeepSpace(): Iterable<ExploredChunkData> {
    return this.chunkStore.getDeepSpaceChunks();
  }

  public getRadiusOfPlanetLevel(planetRarity: PlanetLevel): number {
    return this.radiusMap.get(planetRarity) || 1;
  }

  // get planet by ID - must be in contract or known chunks
  public getPlanetWithId(planetId: LocationId): Planet | null {
    const planet = this.planets.get(planetId);
    if (planet) {
      this.updatePlanetIfStale(planet);
      return planet;
    }
    const loc = this.getLocationOfPlanet(planetId);
    if (!loc) return null;
    return this.getPlanetWithLocation(loc);
  }

  // returns null if this planet is neither in contract nor in known chunks
  // fast query that doesn't update planet if stale
  public getPlanetLevel(planetId: LocationId): PlanetLevel | null {
    const planet = this.planets.get(planetId);
    if (planet) {
      return planet.planetLevel;
    }
    return null;
  }

  // returns null if this planet is neither in contract nor in known chunks
  // fast query that doesn't update planet if stale
  public getPlanetDetailLevel(planetId: LocationId): number | null {
    const planet = this.planets.get(planetId);
    if (planet) {
      let detailLevel = planet.planetLevel;
      if (hasOwner(planet)) {
        detailLevel += 1;
      }
      return detailLevel;
    } else {
      return null;
    }
  }

  public refreshPlanetAndArrivals(
    planet: Planet,
    arrivals: QueuedArrival[]
  ): void {
    // does not modify unconfirmed departures or upgrades
    // that is handled by onTxConfirm
    this.planets.set(planet.locationId, planet);
    this.clearOldArrivals(planet);
    const updatedAwts = this.processArrivalsForPlanet(
      planet.locationId,
      arrivals
    );
    for (const awt of updatedAwts) {
      const arrivalId = awt.arrivalData.eventId;
      this.arrivals[arrivalId] = awt;
      this.planetArrivalIds[planet.locationId].push(arrivalId);
    }
    this.updateScore(planet.locationId);
  }

  // returns an empty planet if planet is not in contract
  // returns null if this isn't a planet, according to hash and coords
  public getPlanetWithCoords(coords: WorldCoords): Planet | null {
    const str = getCoordsString(coords);

    const location = this.coordsToLocation.get(str);
    if (!location) {
      return null;
    }

    return this.getPlanetWithLocation(location);
  }

  // returns an empty planet if planet is not in contract
  // returns null if this isn't a planet, according to hash and coords
  // returns null if the planet level is less than `onlyIfDetailLevel`
  public getPlanetWithLocation(location: Location, onlyIfDetailLevel: number = 0): Planet | null {
    const planet = this.planets.get(location.hash);
    if (planet) {
      // TODO: Account for owner detail level
      if (planet.planetLevel < onlyIfDetailLevel) {
        return null;
      }

      this.updatePlanetIfStale(planet);
      return planet;
    }

    // return a default unowned planet
    const defaultPlanet = this.defaultPlanetFromLocation(location);
    this.planets.set(location.hash, defaultPlanet);

    return defaultPlanet;
  }

  public addPlanetLocation(planetLocation: Location): void {
    this.planetLocationMap[planetLocation.hash] = planetLocation;
    const str = getCoordsString(planetLocation.coords);
    if (!this.coordsToLocation.has(str)) {
      this.coordsToLocation.set(str, planetLocation);
    }

    if (!this.planets.get(planetLocation.hash)) {
      this.planets.set(
        planetLocation.hash,
        this.defaultPlanetFromLocation(planetLocation)
      );
    }
  }

  public getLocationOfPlanet(planetId: LocationId): Location | null {
    return this.planetLocationMap[planetId] || null;
  }

  // NOT PERFORMANT - for scripting only
  public getAllPlanets(): Iterable<Planet> {
    return this.planets.values();
  }

  public getAllOwnedPlanets(): Planet[] {
    return [...this.planets.values()].filter(hasOwner);
  }

  public getAllVoyages(): QueuedArrival[] {
    // there are not many voyages
    return Object.values(this.arrivals).map((awt) => awt.arrivalData);
  }

  private arrive(
    fromPlanet: Planet,
    toPlanet: Planet,
    arrival: QueuedArrival
  ): void {
    // this function optimistically simulates an arrival

    // update toPlanet energy and silver right before arrival
    this.updatePlanetToTime(toPlanet, arrival.arrivalTime * 1000);

    // apply energy

    const { energyArriving: shipsMoved } = arrival;

    if (arrival.player !== toPlanet.owner) {
      // attacking enemy - includes emptyAddress

      if (
        toPlanet.energy >
        Math.floor((shipsMoved * contractPrecision * 100) / toPlanet.defense) /
        contractPrecision
      ) {
        // attack reduces target planet's garrison but doesn't conquer it
        toPlanet.energy -=
          Math.floor(
            (shipsMoved * contractPrecision * 100) / toPlanet.defense
          ) / contractPrecision;
      } else {
        // conquers planet
        toPlanet.owner = arrival.player;
        toPlanet.energy =
          shipsMoved -
          Math.floor(
            (toPlanet.energy * contractPrecision * toPlanet.defense) / 100
          ) /
          contractPrecision;
        this.updateScore(toPlanet.locationId);
      }
    } else {
      // moving between my own planets
      toPlanet.energy += shipsMoved;
    }

    // apply silver
    if (toPlanet.silver + arrival.silverMoved > toPlanet.silverCap) {
      toPlanet.silver = toPlanet.silverCap;
    } else {
      toPlanet.silver += arrival.silverMoved;
    }
  }

  private processArrivalsForPlanet(
    planetId: LocationId,
    arrivals: QueuedArrival[]
  ): ArrivalWithTimer[] {
    // process the QueuedArrival[] for a single planet
    const arrivalsWithTimers: ArrivalWithTimer[] = [];

    // sort arrivals by timestamp
    arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const nowInSeconds = this.timer.now() / 1000;
    for (const arrival of arrivals) {
      try {
        const arriveDiff = nowInSeconds - arrival.arrivalTime;
        const fromPlanet = this.planets.get(arrival.fromPlanet);
        const toPlanet = this.planets.get(arrival.toPlanet);
        if (arriveDiff > 0 && fromPlanet && toPlanet) {
          // if arrival happened in the past, run this arrival
          this.arrive(fromPlanet, toPlanet, arrival);
        } else {
          // otherwise, set a timer to do this arrival in the future
          // and append it to arrivalsWithTimers
          const applyFutureArrival = this.timer.setTimeout(() => {
            const fromPlanet = this.planets.get(arrival.fromPlanet);
            const toPlanet = this.planets.get(arrival.toPlanet);
            if (fromPlanet && toPlanet)
              this.arrive(fromPlanet, toPlanet, arrival);
          }, Math.abs(arriveDiff) * 1000);

          const arrivalWithTimer = {
            arrivalData: arrival,
            timer: applyFutureArrival,
          };
          arrivalsWithTimers.push(arrivalWithTimer);
        }
      } catch (e) {
        console.error(
          `error occurred processing arrival for updated planet ${planetId}: ${e}`
        );
      }
    }
    return arrivalsWithTimers;
  }

  private clearOldArrivals(planet: Planet): void {
    const planetId = planet.locationId;
    // clear old timeouts
    if (this.planetArrivalIds[planetId]) {
      // clear if the planet already had stored arrivals
      for (const arrivalId of this.planetArrivalIds[planetId]) {
        const arrivalWithTimer = this.arrivals[arrivalId];
        if (arrivalWithTimer) {
          this.timer.clearTimeout(arrivalWithTimer.timer);
        } else {
          console.error(`arrival with id ${arrivalId} wasn't found`);
        }
        delete this.arrivals[arrivalId];
      }
    }
    this.planetArrivalIds[planetId] = [];
  }

  private updatePlanetToTime(planet: Planet, atTimeMillis: number): void {
    const safeEndMillis = Math.min(atTimeMillis, this.endTimeSeconds * 1000);
    if (safeEndMillis < planet.lastUpdated * 1000) {
      // console.error('tried to update planet to a past time');
      return;
    }
    planet.silver = this.getSilverOverTime(
      planet,
      planet.lastUpdated * 1000,
      safeEndMillis
    );
    planet.energy = this.getEnergyAtTime(planet, safeEndMillis);
    planet.lastUpdated = safeEndMillis / 1000;
  }

  public planetLevelFromHexPerlin(
    hex: LocationId,
    perlin: number
  ): PlanetLevel {
    const { planetLevelThresholds: planetLevelFreq } = this.contractConstants;

    const spaceType = this.spaceTypeFromPerlin(perlin);

    const levelBigInt = getBytesFromHex(hex, 4, 7);

    let ret = PlanetLevel.MIN;

    for (let type = PlanetLevel.MAX; type >= PlanetLevel.MIN; type--) {
      if (levelBigInt < bigInt(planetLevelFreq[type])) {
        ret = type;
        break;
      }
    }

    if (spaceType === SpaceType.NEBULA && ret > PlanetLevel.WhiteDwarf) {
      ret = PlanetLevel.WhiteDwarf;
    }
    if (spaceType === SpaceType.SPACE && ret > PlanetLevel.YellowStar) {
      ret = PlanetLevel.YellowStar;
    }

    return ret;
  }

  spaceTypeFromPerlin(perlin: number): SpaceType {
    if (perlin < this.contractConstants.PERLIN_THRESHOLD_1) {
      return SpaceType.NEBULA;
    } else if (perlin < this.contractConstants.PERLIN_THRESHOLD_2) {
      return SpaceType.SPACE;
    } else {
      return SpaceType.DEEP_SPACE;
    }
  }

  private getSilverNeeded(planet: Planet): number {
    const totalLevel = planet.upgradeState.reduce((a, b) => a + b);
    return (totalLevel + 1) * 0.2 * planet.silverCap;
  }

  private planetCanUpgrade(planet: Planet): boolean {
    const totalRank = planet.upgradeState.reduce((a, b) => a + b);
    if (planet.spaceType === SpaceType.NEBULA && totalRank >= 3) return false;
    if (planet.spaceType === SpaceType.SPACE && totalRank >= 4) return false;
    if (planet.spaceType === SpaceType.DEEP_SPACE && totalRank >= 5)
      return false;
    return (
      planet.planetLevel !== 0 &&
      planet.planetResource !== PlanetResource.SILVER &&
      planet.silver >= this.getSilverNeeded(planet)
    );
  }

  private planetResourceFromHexPerlin(
    hex: LocationId,
    perlin: number
  ): PlanetResource {
    // level must be sufficient - too low level planets have 0 silver growth
    const planetLevel = this.planetLevelFromHexPerlin(hex, perlin);
    const silverGrowth = this.contractConstants.defaultSilverGrowth[
      planetLevel
    ];

    // silverbyte must be under 256/rarity
    const silverRarity1 = this.contractConstants.SILVER_RARITY_1;
    const silverRarity2 = this.contractConstants.SILVER_RARITY_2;
    const silverRarity3 = this.contractConstants.SILVER_RARITY_3;
    const silverByte = Number(getBytesFromHex(hex, 8, 9));

    if (silverGrowth > 0) {
      const spaceType = this.spaceTypeFromPerlin(perlin);
      if (spaceType === SpaceType.NEBULA && silverByte * silverRarity1 < 256) {
        return PlanetResource.SILVER;
      }
      if (spaceType === SpaceType.SPACE && silverByte * silverRarity2 < 256) {
        return PlanetResource.SILVER;
      }
      if (
        spaceType === SpaceType.DEEP_SPACE &&
        silverByte * silverRarity3 < 256
      ) {
        return PlanetResource.SILVER;
      }
    }
    return PlanetResource.NONE;
  }

  // imitates contract newPlanet
  private defaultPlanetFromLocation(location: Location): Planet {
    const { perlin } = location;
    const hex = location.hash;
    const planetLevel = this.planetLevelFromHexPerlin(hex, perlin);
    const planetResource = this.planetResourceFromHexPerlin(hex, perlin);
    const spaceType = this.spaceTypeFromPerlin(perlin);
    const isSilverMine = planetResource === PlanetResource.SILVER;

    const [
      energyCapBonus,
      energyGroBonus,
      rangeBonus,
      speedBonus,
      defBonus,
    ] = bonusFromHex(hex);

    let energyCap = this.contractConstants.defaultPopulationCap[planetLevel];
    let energyGro = this.contractConstants.defaultPopulationGrowth[planetLevel];
    let range = this.contractConstants.defaultRange[planetLevel];
    let speed = this.contractConstants.defaultSpeed[planetLevel];
    let defense = this.contractConstants.defaultDefense[planetLevel];
    let silCap = this.contractConstants.defaultSilverCap[planetLevel];
    energyCap *= energyCapBonus ? 2 : 1;
    energyGro *= energyGroBonus ? 2 : 1;
    range *= rangeBonus ? 2 : 1;
    speed *= speedBonus ? 2 : 1;
    defense *= defBonus ? 2 : 1;

    let silGro = 0;

    if (isSilverMine) {
      silGro = this.contractConstants.defaultSilverGrowth[planetLevel];
      silCap *= 2;

      energyCap /= 2;
      energyGro /= 2;
      defense /= 2;
    }

    if (spaceType === SpaceType.DEEP_SPACE) {
      range *= 1.5;
      speed *= 1.5;
      energyCap *= 1.5;
      energyGro *= 1.5;
      silCap *= 1.5;
      silGro *= 1.5;

      defense *= 0.25;
    } else if (spaceType === SpaceType.SPACE) {
      range *= 1.25;
      speed *= 1.25;
      energyCap *= 1.25;
      energyGro *= 1.25;
      silCap *= 1.25;
      silGro *= 1.25;

      defense *= 0.5;
    }

    let barbarians =
      (energyCap *
        this.contractConstants.defaultBarbarianPercentage[planetLevel]) /
      100;
    // increase barbarians
    if (spaceType === SpaceType.DEEP_SPACE) barbarians *= 4;
    else if (spaceType === SpaceType.SPACE) barbarians *= 2;

    const silver = isSilverMine ? silCap / 2 : 0;

    speed *= this.contractConstants.TIME_FACTOR_HUNDREDTHS / 100;
    energyGro *= this.contractConstants.TIME_FACTOR_HUNDREDTHS / 100;
    silGro *= this.contractConstants.TIME_FACTOR_HUNDREDTHS / 100;

    return {
      locationId: hex,
      perlin,
      spaceType,
      owner: emptyAddress,
      hatLevel: 0,

      planetLevel,
      planetResource, // None or Silver

      energyCap: energyCap,
      energyGrowth: energyGro,

      silverCap: silCap,
      silverGrowth: silGro,

      range,
      speed,
      defense,

      energy: barbarians,
      silver,

      lastUpdated: Math.floor(this.timer.now() / 1000),

      upgradeState: [0, 0, 0],

      silverSpent: 0,

      pulledFromContract: false,
    };
  }

  private updatePlanetIfStale(planet: Planet): void {
    // Only attempt to update planets pull from contract because default planets don't update
    if (!planet.pulledFromContract) {
      return;
    }
    const now = this.timer.now();
    if (now / 1000 - planet.lastUpdated > 1) {
      this.updatePlanetToTime(planet, now);
    }
  }

  private getEnergyAtTime(planet: Planet, atTimeMillis: number): number {
    if (planet.energy === 0) {
      return 0;
    }
    if (!hasOwner(planet)) {
      return planet.energy;
    }
    const timeElapsed = atTimeMillis / 1000 - planet.lastUpdated;
    const denominator =
      Math.exp((-4 * planet.energyGrowth * timeElapsed) / planet.energyCap) *
      (planet.energyCap / planet.energy - 1) +
      1;
    return planet.energyCap / denominator;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getEnergyCurveAtPercent(planet: Planet, percent: number): number {
    // returns timestamp (seconds) that planet will reach percent% of energycap
    // time may be in the past
    const p1 = (percent / 100) * planet.energyCap;
    const c = planet.energyCap;
    const p0 = planet.energy;
    const g = planet.energyGrowth;
    const t0 = planet.lastUpdated;

    const t1 = (c / (4 * g)) * Math.log((p1 * (c - p0)) / (p0 * (c - p1))) + t0;

    return t1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getSilverCurveAtPercent(
    planet: Planet,
    percent: number
  ): number | null {
    // returns timestamp (seconds) that planet will reach percent% of silcap
    // if doesn't produce silver, returns null
    // if already over percent% of silcap, returns null
    if (
      planet.silverGrowth === 0 ||
      planet.planetResource === PlanetResource.NONE
    ) {
      return null;
    }
    const silverTarget = (percent / 100) * planet.silverCap;
    const silverDiff = silverTarget - planet.silver;
    if (silverDiff <= 0) {
      return null;
    }
    let timeToTarget = 0;
    timeToTarget += silverDiff / planet.silverGrowth;
    return planet.lastUpdated + timeToTarget;
  }

  private getSilverOverTime(
    planet: Planet,
    startTimeMillis: number,
    endTimeMillis: number
  ): number {
    if (!hasOwner(planet)) {
      return planet.silver;
    }

    if (planet.silver > planet.silverCap) {
      return planet.silverCap;
    }
    const timeElapsed = endTimeMillis / 1000 - startTimeMillis / 1000;

    return Math.min(
      timeElapsed * planet.silverGrowth + planet.silver,
      planet.silverCap
    );
  }

  private calculateSilverSpent(planet: Planet): number {
    const upgradeCosts = [20, 40, 60, 80, 100];
    let totalUpgrades = 0;
    for (let i = 0; i < planet.upgradeState.length; i++) {
      totalUpgrades += planet.upgradeState[i];
    }
    let totalUpgradeCostPercent = 0;
    for (let i = 0; i < totalUpgrades; i++) {
      totalUpgradeCostPercent += upgradeCosts[i];
    }
    return (totalUpgradeCostPercent / 100) * planet.silverCap;
  }

  private updateScore(planetId: LocationId) {
    const planet = this.planets.get(planetId);
    if (!planet) {
      return;
    }
    planet.silverSpent = this.calculateSilverSpent(planet);
  }
}
