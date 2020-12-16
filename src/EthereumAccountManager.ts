import events from 'events';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
  Contract,
  providers,
  ContractInterface,
} from 'ethers';
import {
  contractAddress,
} from './Contract';

export const XDAI_CHAIN_ID = 100;

export class EthereumAccountManager extends events.EventEmitter {
  private provider: JsonRpcProvider;
  private rpcURL: string;

  private isProd: boolean;

  constructor() {
    super();

    let url: string;
    // const isProd = process.env.NODE_ENV === 'production';
    this.isProd = true;
    if (this.isProd) {
      // url = 'wss://rpc.xdaichain.com/wss';
      // url = 'wss://xdai.poanetwork.dev/wss';
      // url = 'https://xdai.poanetwork.dev/';
      url = 'https://xdai-archive.blockscout.com';
    } else {
      url = 'http://localhost:8545';
    }
    this.setRpcEndpoint(url);
  }

  public getRpcEndpoint(): string {
    return this.rpcURL;
  }

  public setRpcEndpoint(url: string): void {
    try {
      this.rpcURL = url;
      // const newProvider = new providers.WebSocketProvider(this.rpcURL);
      const newProvider = new providers.JsonRpcProvider(this.rpcURL);
      this.provider = newProvider;
      // this.provider.pollingInterval = 8000;
      this.emit('ChangedRPCEndpoint');
    } catch (e) {
      console.error(`error setting rpc endpoint: ${e}`);
      this.setRpcEndpoint('wss://rpc.xdaichain.com/wss');
      return;
    }
  }

  public async loadContract(
    contractAddress: string,
    contractABI: ContractInterface
  ): Promise<Contract> {
    return new Contract(contractAddress, contractABI, this.provider);
  }

  public async loadCoreContract(isNode: boolean = false): Promise<Contract> {
    let contractABI;
    if (isNode) {
      contractABI = require('../public/contracts/DarkForestCore.json').abi;
    } else {
      contractABI = (
        await fetch('/contracts/DarkForestCore.json').then((x) => x.json())
      ).abi;
    }
    return this.loadContract(contractAddress, contractABI);
  }
}
