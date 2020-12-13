import events from 'events';
import _ from 'lodash';
import bigInt from 'big-integer';
import {
  Contract as CoreContract,
  utils,
  Event,
  BigNumber as EthersBN,
  providers
} from 'ethers';
import { EthereumAccountManager } from './EthereumAccountManager';
import {
  QueuedArrival
} from './PlanetHelper';
import {
  Planet,
  LocationId,
  SpaceType,
} from './GlobalTypes';

export type Upgrade = {
  energyCapMultiplier: number;
  energyGroMultiplier: number;
  rangeMultiplier: number;
  speedMultiplier: number;
  defMultiplier: number;
};

export type UpgradeBranch = [Upgrade, Upgrade, Upgrade, Upgrade];
export type UpgradesInfo = [UpgradeBranch, UpgradeBranch, UpgradeBranch];

export interface ContractConstants {
  TIME_FACTOR_HUNDREDTHS: number;
  PERLIN_THRESHOLD_1: number;
  PERLIN_THRESHOLD_2: number;
  PLANET_RARITY: number;

  SILVER_RARITY_1: number;
  SILVER_RARITY_2: number;
  SILVER_RARITY_3: number;

  defaultPopulationCap: number[];
  defaultPopulationGrowth: number[];

  defaultSilverCap: number[];
  defaultSilverGrowth: number[];

  defaultRange: number[];
  defaultSpeed: number[];
  defaultDefense: number[];
  defaultBarbarianPercentage: number[];

  planetLevelThresholds: number[];
  planetCumulativeRarities: number[];

  upgrades: UpgradesInfo;
}

// TODO: Make sure the ContractEvent and ContractsAPIEvent don't collide
export enum ContractEvent {
  PlayerInitialized = 'PlayerInitialized',
  ArrivalQueued = 'ArrivalQueued',
  PlanetUpgraded = 'PlanetUpgraded',
  BoughtHat = 'BoughtHat',
}

export enum ContractsAPIEvent {
  PlayerInit = 'PlayerInit',
  PlanetUpdate = 'PlanetUpdate',
  TxInitialized = 'TxInitialized',
  TxInitFailed = 'TxInitFailed',
  TxSubmitted = 'TxSubmitted',
  TxConfirmed = 'TxConfirmed',
  RadiusUpdated = 'RadiusUpdated',
}

export const contractPrecision = 1000;

export const contractAddress = '0xa8688cCF5E407C1C782CF0c19b3Ab2cE477Fd739';

export type EthAddress = string & {
  __value__: never;
}; // this is expected to be 40 chars, lowercase hex. see src/utils/CheckedTypeUtils.ts for constructor

export const address: (str: string) => EthAddress = (str) => {
  let ret = str.toLowerCase();
  if (ret.slice(0, 2) === '0x') {
    ret = ret.slice(2);
  }
  for (const c of ret) {
    if ('0123456789abcdef'.indexOf(c) === -1)
      throw new Error('not a valid address');
  }
  if (ret.length !== 40) throw new Error('not a valid address');
  return `0x${ret}` as EthAddress;
};

export const emptyAddress = address('0000000000000000000000000000000000000000');

export type RawDefaults = {
  0: string;
  label?: string;

  1: EthersBN;
  populationCap?: EthersBN;

  2: EthersBN;
  populationGrowth?: EthersBN;

  3: EthersBN;
  range?: EthersBN;

  4: EthersBN;
  speed?: EthersBN;

  5: EthersBN;
  defense?: EthersBN;

  6: EthersBN;
  silverGrowth?: EthersBN;

  7: EthersBN;
  silverCap?: EthersBN;

  8: EthersBN;
  barbarianPercentage?: EthersBN;
}[];

export type RawArrivalData = {
  0: EthersBN;
  id?: EthersBN;

  1: string;
  player?: string;

  2: EthersBN;
  fromPlanet?: EthersBN;

  3: EthersBN;
  toPlanet?: EthersBN;

  4: EthersBN;
  popArriving?: EthersBN;

  5: EthersBN;
  silverMoved?: EthersBN;

  6: EthersBN;
  departureTime?: EthersBN;

  7: EthersBN;
  arrivalTime?: EthersBN;
};

export interface RawPlanetData {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerical index, not string
  0: string;
  owner?: string;

  1: EthersBN;
  range?: EthersBN;

  2: EthersBN;
  speed?: EthersBN;

  3: EthersBN;
  defense?: EthersBN;

  4: EthersBN;
  population?: EthersBN;

  5: EthersBN;
  populationCap?: EthersBN;

  6: EthersBN;
  populationGrowth?: EthersBN;

  7: number;
  planetResource?: number;

  8: EthersBN;
  silverCap?: EthersBN;

  9: EthersBN;
  silverGrowth?: EthersBN;

  10: EthersBN;
  silver?: EthersBN;

  11: EthersBN;
  planetLevel?: EthersBN;
}

export interface RawPlanetExtendedInfo {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerical index, not string
  0: boolean;
  isInitialized?: boolean;

  1: EthersBN;
  createdAt?: EthersBN;

  2: EthersBN;
  lastUpdated?: EthersBN;

  3: EthersBN;
  perlin?: EthersBN;

  4: number;
  spaceType?: number;

  5: EthersBN;
  upgradeState0?: EthersBN;

  6: EthersBN;
  upgradeState1?: EthersBN;

  7: EthersBN;
  upgradeState2?: EthersBN;

  8: EthersBN;
  hatLevel?: EthersBN;

  // 9 is delegatedPlayers, but we don't get this array
}

export type RawUpgrade = {
  0: EthersBN;
  popCapMultiplier?: EthersBN;

  1: EthersBN;
  popGroMultiplier?: EthersBN;

  2: EthersBN;
  rangeMultiplier?: EthersBN;

  3: EthersBN;
  speedMultiplier?: EthersBN;

  4: EthersBN;
  defMultiplier?: EthersBN;
};

export type RawUpgradesInfo = [
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade],
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade],
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade]
];

export const locationIdToBigNumber: (location: LocationId) => EthersBN = (
  location
) => {
  return EthersBN.from('0x' + location);
};

export const locationIdToDecStr: (locationId: LocationId) => string = (
  locationId
) => {
  return bigInt(locationId, 16).toString(10);
};

const LOCATION_ID_UB = bigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

export const locationIdFromDecStr: (location: string) => LocationId = (
  location
) => {
  const locationBI = bigInt(location);
  if (locationBI.geq(LOCATION_ID_UB)) throw new Error('not a valid location');
  let ret = locationBI.toString(16);
  while (ret.length < 64) ret = '0' + ret;
  return ret as LocationId;
};

export interface Player {
  address: EthAddress;
  twitter?: string;
}

export class PlayerMap {
  [playerId: string]: Player;
}

export type PlanetMap = Map<LocationId, Planet>;

export const aggregateBulkGetter = async <T>(
  total: number,
  querySize: number,
  getterFn: (startIdx: number, endIdx: number) => Promise<T[]>,
  printProgress = false
) => {
  const promises: Promise<T[]>[] = [];
  let soFar = 0;
  for (let i = 0; i < total / querySize; i += 1) {
    const start = i * querySize;
    const end = Math.min((i + 1) * querySize, total);
    promises.push(
      new Promise<T[]>(async (resolve) => {
        let res: T[] = [];
        let tries = 0;
        while (res.length === 0) {
          // retry with exponential backoff if request fails
          await new Promise<void>((resolve) => {
            setTimeout(resolve, Math.min(15, 2 ** tries - 1) * 1000);
          });
          res = await getterFn(start, end)
            .then((res) => {
              soFar += querySize;
              console.log(`retrieved ${start}-${end}.`);
              return res;
            })
            .catch(() => {
              console.error(
                `error occurred querying ${start}-${end}. retrying...`
              );
              return [];
            });
          tries += 1;
        }
        resolve(res);
      })
    );
  }
  const unflattenedResults = await Promise.all(promises);
  return _.flatten(unflattenedResults);
};

export class Contract extends events.EventEmitter {
  coreContract: CoreContract;

  private constructor(coreContract: CoreContract) {
    super();

    this.coreContract = coreContract;
  }

  static async create(isReplay = false): Promise<Contract> {
    const ethConnection = new EthereumAccountManager()
    const coreContract: CoreContract = await ethConnection.loadCoreContract();

    const contract: Contract = new Contract(coreContract);
    contract.setupEventListeners();

    if (!isReplay) {
      contract.attachCoreContractListeners()
    }

    ethConnection.on('ChangedRPCEndpoint', async () => {
      contract.coreContract = await ethConnection.loadCoreContract();
    });

    return contract;
  }

  destroy(): void {
    this.removeEventListeners();
    // TODO: Remove coreContractListeners
  }

  private attachCoreContractListeners(): void {
    // TODO: re-emitter instead
    this.coreContract
      .on(ContractEvent.PlayerInitialized, (player, locRaw, evt: Event) => {
        this.emit(ContractEvent.PlayerInitialized, player, locRaw, evt)
      })
      .on(ContractEvent.ArrivalQueued, (arrivalId: EthersBN, evt: Event) => {
        this.emit(ContractEvent.ArrivalQueued, arrivalId, evt)
      })
      .on(ContractEvent.PlanetUpgraded, (location, evt: Event) => {
        this.emit(ContractEvent.PlanetUpgraded, location, evt)
      })
      .on(ContractEvent.BoughtHat, (location, evt: Event) => {
        this.emit(ContractEvent.BoughtHat, location, evt)
      })
  }

  private setupEventListeners(): void {
    // These are attaching event handlers to ourselves
    // for events re-emitted by the `coreContract` or replayer
    this
      .on(ContractEvent.PlayerInitialized, async (player, locRaw, evt: Event) => {
        const newPlayer: Player = { address: address(player) };

        const newPlanet: Planet = await this.getPlanet(locRaw, evt.blockNumber);
        const arrivals = await this.getArrivalsForPlanet(newPlanet, evt.blockNumber);
        this.emit(ContractsAPIEvent.PlayerInit, newPlayer, newPlanet);
        this.emit(ContractsAPIEvent.PlanetUpdate, newPlanet, arrivals);
        let newRadius = await this.getWorldRadius(evt.blockNumber);
        this.emit(ContractsAPIEvent.RadiusUpdated, newRadius);
      })
      .on(
        ContractEvent.ArrivalQueued,
        async (arrivalId: EthersBN, evt: Event) => {
          const arrival: QueuedArrival | null = await this.getArrival(
            arrivalId.toNumber(),
            evt.blockNumber
          );
          if (!arrival) {
            console.error('arrival is null');
            return;
          }
          const fromPlanet: Planet = await this.getPlanet(
            locationIdToBigNumber(arrival.fromPlanet),
            evt.blockNumber
          );
          const toPlanet: Planet = await this.getPlanet(
            locationIdToBigNumber(arrival.toPlanet),
            evt.blockNumber
          );
          const toArrivals = await this.getArrivalsForPlanet(toPlanet, evt.blockNumber);
          this.emit(ContractsAPIEvent.PlanetUpdate, toPlanet, toArrivals);
          const fromArrivals = await this.getArrivalsForPlanet(fromPlanet, evt.blockNumber);
          this.emit(ContractsAPIEvent.PlanetUpdate, fromPlanet, fromArrivals);
          let newRadius = await this.getWorldRadius(evt.blockNumber);
          this.emit(ContractsAPIEvent.RadiusUpdated, newRadius);
        }
      )
      .on(ContractEvent.PlanetUpgraded, async (location, evt: Event) => {
        const planet = await this.getPlanet(location, evt.blockNumber);
        const arrivals = await this.getArrivalsForPlanet(planet, evt.blockNumber);
        this.emit(ContractsAPIEvent.PlanetUpdate, planet, arrivals);
      })
      .on(ContractEvent.BoughtHat, async (location, evt: Event) => {
        const planet = await this.getPlanet(location, evt.blockNumber);
        const arrivals = await this.getArrivalsForPlanet(planet, evt.blockNumber);
        this.emit(ContractsAPIEvent.PlanetUpdate, planet, arrivals);
      });
  }

  removeEventListeners(): void {
    // Remove the re-emitted contract events
    this.removeAllListeners(ContractEvent.PlayerInitialized);
    this.removeAllListeners(ContractEvent.ArrivalQueued);
    this.removeAllListeners(ContractEvent.PlanetUpgraded);
    this.removeAllListeners(ContractEvent.BoughtHat);
  }

  public getContractAddress(): EthAddress {
    return address(this.coreContract.address);
  }

  async getConstants(blockTag: number): Promise<ContractConstants> {
    console.log('getting constants');

    const contract = this.coreContract;
    const res = await Promise.all([
      contract.callStatic.TIME_FACTOR_HUNDREDTHS({ blockTag }),
      contract.callStatic.PERLIN_THRESHOLD_1({ blockTag }),
      contract.callStatic.PERLIN_THRESHOLD_2({ blockTag }),
      contract.callStatic.PLANET_RARITY({ blockTag }),
      contract.callStatic.SILVER_RARITY_1({ blockTag }),
      contract.callStatic.SILVER_RARITY_2({ blockTag }),
      contract.callStatic.SILVER_RARITY_3({ blockTag }),
      contract.callStatic.getUpgrades({ blockTag }),
    ]);
    const TIME_FACTOR_HUNDREDTHS = res[0].toNumber();
    const PERLIN_THRESHOLD_1 = res[1].toNumber();
    const PERLIN_THRESHOLD_2 = res[2].toNumber();
    const PLANET_RARITY = res[3].toNumber();
    const SILVER_RARITY_1 = res[4].toNumber();
    const SILVER_RARITY_2 = res[5].toNumber();
    const SILVER_RARITY_3 = res[6].toNumber();

    const rawUpgrades = res[7];
    const upgrades: UpgradesInfo = this.rawUpgradesInfoToUpgradesInfo(
      rawUpgrades
    );

    const rawDefaults: RawDefaults = await contract.callStatic.getDefaultStats({ blockTag });

    return {
      TIME_FACTOR_HUNDREDTHS,
      PERLIN_THRESHOLD_1,
      PERLIN_THRESHOLD_2,
      PLANET_RARITY,

      SILVER_RARITY_1,
      SILVER_RARITY_2,
      SILVER_RARITY_3,

      defaultPopulationCap: rawDefaults.map(
        (x) => x[1].toNumber() / contractPrecision
      ),
      defaultPopulationGrowth: rawDefaults.map(
        (x) => x[2].toNumber() / contractPrecision
      ),
      defaultRange: rawDefaults.map((x) => x[3].toNumber()),
      defaultSpeed: rawDefaults.map((x) => x[4].toNumber()),
      defaultDefense: rawDefaults.map((x) => x[5].toNumber()),
      defaultSilverGrowth: rawDefaults.map(
        (x) => x[6].toNumber() / contractPrecision
      ),
      defaultSilverCap: rawDefaults.map(
        (x) => x[7].toNumber() / contractPrecision
      ),
      defaultBarbarianPercentage: rawDefaults.map((x) => x[8].toNumber()),

      planetLevelThresholds: (
        await contract.callStatic.getPlanetLevelThresholds({ blockTag })
      ).map((x: EthersBN) => x.toNumber()),
      planetCumulativeRarities: (
        await contract.callStatic.getPlanetCumulativeRarities({ blockTag })
      ).map((x: EthersBN) => x.toNumber()),

      upgrades,
    };
  }

  async zkChecksDisabled(): Promise<boolean> {
    return this.coreContract.DISABLE_ZK_CHECK();
  }

  async getPlayers(blockTag: number): Promise<PlayerMap> {
    console.log('getting players');
    const nPlayers: number = await this.coreContract.callStatic.getNPlayers({ blockTag });

    const playerIds = await aggregateBulkGetter<EthAddress>(
      nPlayers,
      200,
      async (start, end) =>
        (await this.coreContract.callStatic.bulkGetPlayers(start, end, { blockTag })).map(address)
    );

    const playerMap: PlayerMap = {};
    for (const playerId of playerIds) {
      playerMap[address(playerId)] = { address: address(playerId) };
    }
    return playerMap;
  }

  async getWorldRadius(blockTag: number): Promise<number> {
    const radius = (await this.coreContract.worldRadius({ blockTag })).toNumber();
    return radius;
  }

  async getContractBalance(): Promise<number> {
    const rawBalance = await this.coreContract.getBalance();
    const myBalance = utils.formatEther(rawBalance);
    const numBalance = parseFloat(myBalance);
    return numBalance;
  }

  async getArrival(arrivalId: number, blockTag: number): Promise<QueuedArrival | null> {
    const contract = this.coreContract;
    const rawArrival: RawArrivalData = await contract.callStatic.planetArrivals(arrivalId, { blockTag });
    return this.rawArrivalToObject(rawArrival);
  }

  async getArrivalsForPlanet(planet: Planet, blockTag: number): Promise<QueuedArrival[]> {
    const contract = this.coreContract;

    const events = (
      await contract.callStatic.getPlanetArrivals(locationIdToDecStr(planet.locationId), { blockTag })
    ).map(this.rawArrivalToObject);

    return events;
  }

  async getAllArrivals(blockTag: number): Promise<QueuedArrival[]> {
    console.log('getting arrivals');
    const nPlanets: number = await this.coreContract.callStatic.getNPlanets({ blockTag });

    const arrivalsUnflattened = await aggregateBulkGetter<QueuedArrival[]>(
      nPlanets,
      1000,
      async (start, end) => {
        return (
          await this.coreContract.callStatic.bulkGetPlanetArrivals(start, end, { blockTag })
        ).map((arrivals: RawArrivalData[]) =>
          arrivals.map(this.rawArrivalToObject)
        );
      },
      true
    );

    return _.flatten(arrivalsUnflattened);
  }

  async getPlanets(blockTag: number): Promise<PlanetMap> {
    console.log('getting planets');
    const nPlanets: number = await this.coreContract.callStatic.getNPlanets({ blockTag });

    const planetIds = await aggregateBulkGetter<BigInteger>(
      nPlanets,
      2000,
      async (start, end) => await this.coreContract.callStatic.bulkGetPlanetIds(start, end, { blockTag }),
      true
    );

    const rawPlanetsExtendedInfo = await aggregateBulkGetter<
      RawPlanetExtendedInfo
    >(
      nPlanets,
      1000,
      async (start, end) =>
        await this.coreContract.callStatic.bulkGetPlanetsExtendedInfo(start, end, { blockTag }),
      true
    );

    const rawPlanets = await aggregateBulkGetter<RawPlanetData>(
      nPlanets,
      1000,
      async (start, end) => await this.coreContract.callStatic.bulkGetPlanets(start, end, { blockTag }),
      true
    );

    const planets: PlanetMap = new Map();
    for (let i = 0; i < nPlanets; i += 1) {
      if (!!rawPlanets[i] && !!rawPlanetsExtendedInfo[i]) {
        const planet = this.rawPlanetToObject(
          planetIds[i].toString(),
          rawPlanets[i],
          rawPlanetsExtendedInfo[i]
        );
        planets.set(planet.locationId, planet);
      }
    }
    return planets;
  }

  private async getPlanet(rawLoc: EthersBN, blockTag: number): Promise<Planet> {
    const rawPlanet = await this.coreContract.callStatic.planets(rawLoc, { blockTag });
    const rawPlanetExtendedInfo = await this.coreContract.callStatic.planetsExtendedInfo(
      rawLoc,
      { blockTag }
    );
    return this.rawPlanetToObject(
      rawLoc.toString(),
      rawPlanet,
      rawPlanetExtendedInfo
    );
  }

  // not strictly necessary but it's cleaner
  private rawArrivalToObject(rawArrival: RawArrivalData): QueuedArrival {
    const rawId = rawArrival[0];
    const rawPlayer = rawArrival[1];
    const rawFromPlanet = rawArrival[2];
    const rawToPlanet = rawArrival[3];
    const rawPopArriving = rawArrival[4];
    const rawSilverMoved = rawArrival[5];
    const rawDepartureTime = rawArrival[6];
    const rawArrivalTime = rawArrival[7];

    const arrival: QueuedArrival = {
      eventId: rawId.toString(),
      player: address(rawPlayer),
      fromPlanet: locationIdFromDecStr(rawFromPlanet.toString()),
      toPlanet: locationIdFromDecStr(rawToPlanet.toString()),
      energyArriving: rawPopArriving.toNumber() / contractPrecision,
      silverMoved: rawSilverMoved.toNumber() / contractPrecision,
      departureTime: rawDepartureTime.toNumber(),
      arrivalTime: rawArrivalTime.toNumber(),
    };

    return arrival;
  }

  private rawPlanetToObject(
    rawLocationId: string,
    rawPlanet: RawPlanetData,
    rawPlanetExtendedInfo: RawPlanetExtendedInfo
  ): Planet {
    const rawOwner = rawPlanet[0];
    const rawRange = rawPlanet[1];
    const rawSpeed = rawPlanet[2];
    const rawDefense = rawPlanet[3];
    const rawPopulation = rawPlanet[4];
    const rawPopulationCap = rawPlanet[5];
    const rawPopulationGrowth = rawPlanet[6];
    const rawPlanetResource = rawPlanet[7];
    const rawSilverCap = rawPlanet[8];
    const rawSilverGrowth = rawPlanet[9];
    const rawSilver = rawPlanet[10];
    const rawPlanetLevel = rawPlanet[11];

    const rawIsInitialized = rawPlanetExtendedInfo[0];
    const rawCreatedAt = rawPlanetExtendedInfo[1];
    const rawLastUpdated = rawPlanetExtendedInfo[2];
    const rawPerlin = rawPlanetExtendedInfo[3];
    const rawSpaceType = rawPlanetExtendedInfo[4] as SpaceType;
    const rawUpgradeState = [
      rawPlanetExtendedInfo[5],
      rawPlanetExtendedInfo[6],
      rawPlanetExtendedInfo[7],
    ];
    const rawHatLevel = rawPlanetExtendedInfo[8];

    const planet: Planet = {
      locationId: locationIdFromDecStr(rawLocationId.toString()),
      perlin: rawPerlin.toNumber(),
      spaceType: rawSpaceType,
      owner: address(rawOwner),
      hatLevel: rawHatLevel.toNumber(),

      planetLevel: rawPlanetLevel.toNumber(),
      planetResource: rawPlanetResource,

      energyCap: rawPopulationCap.toNumber() / contractPrecision,
      energyGrowth: rawPopulationGrowth.toNumber() / contractPrecision,

      silverCap: rawSilverCap.toNumber() / contractPrecision,
      silverGrowth: rawSilverGrowth.toNumber() / contractPrecision,

      energy: rawPopulation.toNumber() / contractPrecision,
      silver: rawSilver.toNumber() / contractPrecision,

      range: rawRange.toNumber(),
      speed: rawSpeed.toNumber(),
      defense: rawDefense.toNumber(),

      // metadata
      isInitialized: rawIsInitialized,
      createdAt: rawCreatedAt.toNumber(),
      lastUpdated: rawLastUpdated.toNumber(),
      upgradeState: [
        rawUpgradeState[0].toNumber(),
        rawUpgradeState[1].toNumber(),
        rawUpgradeState[2].toNumber(),
      ],

      silverSpent: 0, // this is stale and will be updated in planethelper

      pulledFromContract: true,
    };
    return planet;
  }

  private rawUpgradeToUpgrade(rawUpgrade: RawUpgrade): Upgrade {
    return {
      energyCapMultiplier: rawUpgrade[0].toNumber(),
      energyGroMultiplier: rawUpgrade[1].toNumber(),
      rangeMultiplier: rawUpgrade[2].toNumber(),
      speedMultiplier: rawUpgrade[3].toNumber(),
      defMultiplier: rawUpgrade[4].toNumber(),
    };
  }

  private rawUpgradesInfoToUpgradesInfo(
    rawUpgradesInfo: RawUpgradesInfo
  ): UpgradesInfo {
    return rawUpgradesInfo.map((a) =>
      a.map((b) => this.rawUpgradeToUpgrade(b))
    ) as UpgradesInfo;
  }

  public async getLogs(beginBlockNumber: number, endBlockNumber: number): Promise<Event[]> {
    return this.coreContract.queryFilter(
      {
        address: this.coreContract.address,
      },
      beginBlockNumber,
      endBlockNumber,
    );
  }

  public async getBlock(blockTag: number): Promise<providers.Block> {
    return this.coreContract.provider.getBlock(blockTag);
  }
}
