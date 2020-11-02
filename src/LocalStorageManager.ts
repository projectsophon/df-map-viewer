import {
  ChunkFootprint,
  ExploredChunkData,
  LocationId,
  Location,
  WorldCoords,
} from './GlobalTypes';
import _, { Cancelable } from 'lodash';
import type { LevelUp } from 'levelup'

const MAX_CHUNK_SIZE = 256;

enum DBActionType {
  UPDATE = 'put',
  DELETE = 'del',
}

interface DBAction {
  type: DBActionType;
  key: string;
  value?: ExploredChunkData;
}

export interface ChunkStore {
  hasMinedChunk: (chunkFootprint: ChunkFootprint) => boolean;
}

// (capital) alphanumeric character
// a "bucket" index deterministically generated from chunkX and chunkY
export type LSMBucket = string;

export interface LSMLoc {
  x: number;
  y: number;
  h: LocationId;
  p: number; // perlin
}

export interface LSMChunkData {
  x: number; // left
  y: number; // bottom
  s: number; // side length
  l: LSMLoc[];
  p: number; // approximate avg perlin value. used for rendering
}

export const toExploredChunk = (chunk: LSMChunkData) => {
  const planetLocs: Location[] = [];
  for (const lsmLoc of chunk.l) {
    planetLocs.push({
      coords: { x: lsmLoc.x, y: lsmLoc.y },
      hash: lsmLoc.h,
      perlin: lsmLoc.p,
    });
  }
  const ret: ExploredChunkData = {
    chunkFootprint: {
      bottomLeft: { x: chunk.x, y: chunk.y },
      sideLength: chunk.s,
    },
    planetLocations: planetLocs,
    perlin: chunk.p,
  };
  return ret;
};

export const toLSMChunk = (chunk: ExploredChunkData) => {
  const lsmLocs: LSMLoc[] = [];
  const { chunkFootprint: chunkLocation } = chunk;
  for (const location of chunk.planetLocations) {
    lsmLocs.push({
      x: location.coords.x,
      y: location.coords.y,
      h: location.hash,
      p: location.perlin,
    });
  }
  const ret: LSMChunkData = {
    x: chunkLocation.bottomLeft.x,
    y: chunkLocation.bottomLeft.y,
    s: chunkLocation.sideLength,
    l: lsmLocs,
    p: chunk.perlin,
  };
  return ret;
};

export const getChunkOfSideLength = (
  coords: WorldCoords,
  sideLength: number
) => {
  const oldBottomLeftX = coords.x;
  const oldBottomLeftY = coords.y;
  const ret: ChunkFootprint = {
    sideLength,
    bottomLeft: {
      x: Math.floor(oldBottomLeftX / sideLength) * sideLength,
      y: Math.floor(oldBottomLeftY / sideLength) * sideLength,
    },
  };
  return ret;
};

export const getBucket: (chunk: ChunkFootprint) => LSMBucket = (chunk) => {
  const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum =
    (Math.floor(chunk.bottomLeft.x / chunk.sideLength) +
      Math.floor(chunk.bottomLeft.y / chunk.sideLength)) %
    alphanumeric.length;
  if (sum < 0) sum += alphanumeric.length;
  return alphanumeric[sum];
};

export const getChunkKey = (chunkLoc: ChunkFootprint) => {
  const ret =
    `${getBucket(chunkLoc)},` +
    `${chunkLoc.sideLength},` +
    `${chunkLoc.bottomLeft.x},` +
    `${chunkLoc.bottomLeft.y}`;
  return ret;
};

export const getSiblingLocations = (chunkLoc: ChunkFootprint) => {
  const doubleSideLen = 2 * chunkLoc.sideLength;
  const newBottomLeftX =
    Math.floor(chunkLoc.bottomLeft.x / doubleSideLen) * doubleSideLen;
  const newBottomLeftY =
    Math.floor(chunkLoc.bottomLeft.y / doubleSideLen) * doubleSideLen;
  const newBottomLeft = { x: newBottomLeftX, y: newBottomLeftY };
  const siblingLocs: ChunkFootprint[] = [];
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const x = newBottomLeft.x + i * chunkLoc.sideLength;
      const y = newBottomLeft.y + j * chunkLoc.sideLength;
      if (x === chunkLoc.bottomLeft.x && y === chunkLoc.bottomLeft.y) {
        continue;
      }
      siblingLocs.push({
        bottomLeft: { x, y },
        sideLength: chunkLoc.sideLength,
      });
    }
  }
  const ret: [ChunkFootprint, ChunkFootprint, ChunkFootprint] = [
    siblingLocs[0],
    siblingLocs[1],
    siblingLocs[2],
  ];
  return ret; // necessary for typescript type inference
};

export const addToChunkMap = (
  map: Map<string, ExploredChunkData>,
  chunk: ExploredChunkData,
  includePlanets = true,
  onAdd?: (ExploredChunkData) => void,
  onRemove?: (ExploredChunkData) => void,
  maxChunkSize?: number
) => {
  let sideLength = chunk.chunkFootprint.sideLength;
  let chunkToAdd: ExploredChunkData = {
    chunkFootprint: {
      bottomLeft: chunk.chunkFootprint.bottomLeft,
      sideLength,
    },
    planetLocations: includePlanets ? [...chunk.planetLocations] : [],
    perlin: chunk.perlin,
  };
  while (!maxChunkSize || sideLength < maxChunkSize) {
    const siblingLocs = getSiblingLocations(chunkToAdd.chunkFootprint);
    let siblingsMined = true;
    for (const siblingLoc of siblingLocs) {
      if (!map.get(getChunkKey(siblingLoc))) {
        siblingsMined = false;
        break;
      }
    }
    if (!siblingsMined) break;
    sideLength *= 2;
    let planetLocations: Location[] = chunkToAdd.planetLocations;
    let newPerlin = chunkToAdd.perlin / 4;
    for (const siblingLoc of siblingLocs) {
      const siblingKey = getChunkKey(siblingLoc);
      const sibling = map.get(siblingKey);
      if (onRemove !== undefined) {
        onRemove(sibling);
      } else {
        map.delete(siblingKey);
      }
      if (sibling) {
        if (includePlanets) {
          planetLocations = planetLocations.concat(sibling.planetLocations);
        }
        newPerlin += sibling.perlin / 4;
      }
    }
    const chunkFootprint = getChunkOfSideLength(
      chunkToAdd.chunkFootprint.bottomLeft,
      sideLength
    );
    chunkToAdd = {
      chunkFootprint,
      planetLocations,
      perlin: Math.floor(newPerlin * 1000) / 1000,
    };
  }
  if (onAdd !== undefined) {
    onAdd(chunkToAdd);
  } else {
    map.set(getChunkKey(chunkToAdd.chunkFootprint), chunkToAdd);
  }
};



export class LocalStorageManager implements ChunkStore {
  private db: LevelUp;
  private cached: DBAction[];
  private throttledSaveChunkCacheToDisk: (() => Promise<void>) & Cancelable;
  private nUpdatesLastTwoMins = 0; // we save every 5s, unless this goes above 50
  private chunkMap: Map<string, ExploredChunkData>;

  constructor(db: LevelUp) {
    this.db = db;
    this.cached = [];
    this.throttledSaveChunkCacheToDisk = _.throttle(
      this.saveChunkCacheToDisk,
      2000 // TODO
    );
    this.chunkMap = new Map<string, ExploredChunkData>();
  }

  destroy(): void {
    // no-op; we don't actually destroy the instance, we leave the db connection open in case we need it in the future
  }

  private async bulkSetKeyInCollection(updateChunkTxs: DBAction[]): Promise<void> {
    const chunks = updateChunkTxs.map((chunk) => {
      if (chunk.value) {
        return { ...chunk, value: toLSMChunk(chunk.value) }
      } else {
        return chunk;
      }
    });
    await new Promise((resolve, reject) => {
      this.db.batch(chunks as any, (err) => {
        if (err) {
          return reject(err);
        }

        resolve()
      });
    });
  }

  async loadIntoMemory(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.createReadStream()
        .on('data', ({ key, value: chunk }) => {
          this.updateChunk(toExploredChunk(chunk), true);
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('end', (data) => {
          resolve();
        });
    });
  }

  private async saveChunkCacheToDisk() {
    const toSave = [...this.cached]; // make a copy
    this.cached = [];
    await this.bulkSetKeyInCollection(toSave);
  }

  public hasMinedChunk(chunkLoc: ChunkFootprint): boolean {
    let sideLength = chunkLoc.sideLength;
    while (sideLength <= MAX_CHUNK_SIZE) {
      const testChunkLoc = getChunkOfSideLength(
        chunkLoc.bottomLeft,
        sideLength
      );
      if (this.getChunkById(getChunkKey(testChunkLoc))) {
        return true;
      }
      sideLength *= 2;
    }
    return !!this.chunkMap.get(getChunkKey(chunkLoc));
  }

  private getChunkById(chunkId: string): ExploredChunkData | null {
    return this.chunkMap.get(chunkId) || null;
  }

  // if the chunk was loaded from storage, then we don't need to recommit it
  // unless it can be promoted (which shouldn't ever happen, but we handle
  // just in case)
  public updateChunk(e: ExploredChunkData, loadedFromStorage = false): void {
    if (this.hasMinedChunk(e.chunkFootprint)) {
      return;
    }
    const tx: DBAction[] = [];

    // if this is a mega-chunk, delete all smaller chunks inside of it
    const minedSubChunks = this.getMinedSubChunks(e);
    for (const subChunk of minedSubChunks) {
      tx.push({
        type: DBActionType.DELETE,
        key: getChunkKey(subChunk.chunkFootprint),
      });
    }

    addToChunkMap(
      this.chunkMap,
      e,
      true,
      (chunk) => {
        tx.push({
          type: DBActionType.UPDATE,
          key: getChunkKey(chunk.chunkFootprint),
          value: chunk,
        });
      },
      (chunk) => {
        tx.push({
          type: DBActionType.DELETE,
          key: getChunkKey(chunk.chunkFootprint),
        });
      },
      MAX_CHUNK_SIZE
    );

    // modify in-memory store
    for (const action of tx) {
      if (action.type === DBActionType.UPDATE && action.value) {
        this.chunkMap.set(action.key, action.value);
      } else if (action.type === DBActionType.DELETE) {
        this.chunkMap.delete(action.key);
      }
    }

    // can stop here, if we're just loading into in-memory store from storage
    if (loadedFromStorage) {
      return;
    }

    this.cached = [...this.cached, ...tx];

    // save chunks every 5s if we're just starting up, or 30s once we're moving
    this.recomputeSaveThrottleAfterUpdate();

    this.throttledSaveChunkCacheToDisk();
  }

  private getMinedSubChunks(e: ExploredChunkData): ExploredChunkData[] {
    // returns all the mined chunks with smaller sidelength strictly contained in e
    const ret: ExploredChunkData[] = [];
    for (
      let clearingSideLen = 16;
      clearingSideLen < e.chunkFootprint.sideLength;
      clearingSideLen *= 2
    ) {
      for (let x = 0; x < e.chunkFootprint.sideLength; x += clearingSideLen) {
        for (let y = 0; y < e.chunkFootprint.sideLength; y += clearingSideLen) {
          const queryChunk: ChunkFootprint = {
            bottomLeft: {
              x: e.chunkFootprint.bottomLeft.x + x,
              y: e.chunkFootprint.bottomLeft.y + y,
            },
            sideLength: clearingSideLen,
          };
          const queryChunkKey = getChunkKey(queryChunk);
          const exploredChunk = this.getChunkById(queryChunkKey);
          if (exploredChunk) {
            ret.push(exploredChunk);
          }
        }
      }
    }
    return ret;
  }

  private recomputeSaveThrottleAfterUpdate() {
    this.nUpdatesLastTwoMins += 1;
    if (this.nUpdatesLastTwoMins === 50) {
      this.throttledSaveChunkCacheToDisk.cancel();
      this.throttledSaveChunkCacheToDisk = _.throttle(
        this.saveChunkCacheToDisk,
        30000
      );
    }
    setTimeout(() => {
      this.nUpdatesLastTwoMins -= 1;
      if (this.nUpdatesLastTwoMins === 49) {
        this.throttledSaveChunkCacheToDisk.cancel();
        this.throttledSaveChunkCacheToDisk = _.throttle(
          this.saveChunkCacheToDisk,
          5000
        );
      }
    }, 120000);
  }

  public allChunks(): Iterable<ExploredChunkData> {
    return this.chunkMap.values();
  }
}
