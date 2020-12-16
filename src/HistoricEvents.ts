import { Event } from '@ethersproject/contracts';
import { Result } from '@ethersproject/abi';
import { Contract } from './Contract';

export interface Evt {
  raw: Event,
  event?: string,
  args: Result
}

export interface HistoricEvent {
  timestamp?: number;
  blockNumber: number;
  events: Evt[],
}

export class HistoricEvents {
  startBlockNumber: number;
  contract: Contract;
  cachedBlockTimes: Map<number, number>;

  chunkSize: number;

  active: boolean;

  constructor(
    blockNumber: number,
    contract: Contract,
    cachedBlockTimes = new Map(),
    chunkSize = 1000
  ) {
    this.active = true;
    this.startBlockNumber = blockNumber;
    this.contract = contract;
    this.cachedBlockTimes = cachedBlockTimes;
    this.chunkSize = chunkSize
  }

  destroy() {
    this.active = false;
  }

  getLogs(lastEndChunk: number, nextEndChunk: number): Promise<Event[]> {
    return this.contract.getLogs(lastEndChunk, nextEndChunk);
  }

  async*[Symbol.asyncIterator](): AsyncGenerator<HistoricEvent> {
    let lastEndChunk = this.startBlockNumber;
    let idx = 0;
    let eventLogs: Event[] = [];

    while (this.active) {
      if (idx >= eventLogs.length) {
        let nextEndChunk = lastEndChunk + this.chunkSize;
        try {
          let nextLogs = await this.getLogs(lastEndChunk, nextEndChunk);
          for (let log of nextLogs) {
            try {
              if (!this.cachedBlockTimes.has(log.blockNumber)) {
                let block = await log.getBlock();
                this.cachedBlockTimes.set(log.blockNumber, block.timestamp * 1000);
              }
            } catch (err) {
              console.log('error getting block', err)
            }
          }
          eventLogs = eventLogs.concat(nextLogs);
          lastEndChunk = nextEndChunk;
        } catch (err) {
          console.log('error getting logs', err)
        }
      }

      let nextEvent = eventLogs[idx];
      if (nextEvent) {
        if (!this.cachedBlockTimes.has(nextEvent.blockNumber)) {
          let block = await nextEvent.getBlock()
          this.cachedBlockTimes.set(nextEvent.blockNumber, block.timestamp * 1000);
        }
        let eventsInBlock: { raw: Event, event?: string, args: Result }[] = []
        for (let event of eventLogs.slice(idx)) {
          if (event.blockNumber === nextEvent.blockNumber) {
            eventsInBlock.push({ raw: event, event: event.event, args: event.args || [] });
          } else {
            break;
          }
        }
        idx += eventsInBlock.length;
        yield {
          timestamp: this.cachedBlockTimes.get(nextEvent.blockNumber),
          blockNumber: nextEvent.blockNumber,
          events: eventsInBlock,
        }
      }
    }
  }
}
