import { EthAddress } from './Contract';

export interface WorldCoords {
  x: number;
  y: number;
}

export interface CanvasCoords {
  x: number;
  y: number;
}

export type LocationId = string & {
  __value__: never;
}; // this is expected to be 64 chars, lowercase hex. see src/utils/CheckedTypeUtils.ts for constructor

export interface Location {
  coords: WorldCoords;
  hash: LocationId;
  perlin: number;
}

export interface ChunkFootprint {
  bottomLeft: WorldCoords;
  sideLength: number;
}

export class ExploredChunkData {
  chunkFootprint: ChunkFootprint;
  planetLocations: Location[];
  perlin: number; // approximate avg perlin value. used for rendering
}

// Planet stuff
export enum SpaceType {
  NEBULA,
  SPACE,
  DEEP_SPACE,
}

export enum PlanetLevel {
  Asteroid,
  BrownDwarf,
  RedDwarf,
  WhiteDwarf,
  YellowStar,
  BlueStar,
  Giant,
  Supergiant,
  MAX = PlanetLevel.Supergiant,
  MIN = PlanetLevel.Asteroid,
}

export enum PlanetResource {
  NONE,
  SILVER,
}

export type UpgradeState = [number, number, number];

export interface Planet {
  locationId: LocationId;
  perlin: number;
  spaceType: SpaceType;
  owner: EthAddress; // should never be null; all unclaimed planets should have 0 address
  hatLevel: number;

  planetLevel: PlanetLevel;
  planetResource: PlanetResource;

  energyCap: number;
  energyGrowth: number;

  silverCap: number;
  silverGrowth: number;

  range: number;
  defense: number;
  speed: number;

  energy: number;
  silver: number;

  // metadata stuff
  isInitialized?: boolean; // TODO consider making these non-optional
  createdAt?: number;
  lastUpdated: number;
  upgradeState: UpgradeState;

  // unconfirmedDepartures: UnconfirmedMove[];
  // unconfirmedUpgrades: UnconfirmedUpgrade[];
  // unconfirmedBuyHats: UnconfirmedBuyHat[];
  silverSpent: number;

  pulledFromContract: boolean;
}
