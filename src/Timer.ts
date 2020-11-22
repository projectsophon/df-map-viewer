export interface Timer {
  now(): number;
}

export class ReplayTimer implements Timer {
  speedMultiplier: number;
  startBlockNumber: number;
  startTime: number;
  blockSpeed: number;

  _now: number;

  rafStartTime: number;

  constructor() {
    // TODO: parameterize
    this.speedMultiplier = 1;
    this.startBlockNumber = 12314333;
    this.startTime = 1601678470 * 1000;
    this.blockSpeed = 7000;
    this._now = this.startTime;
  }

  tick(timeOfBlock: number, resolve: (value?: unknown) => void) {
    window.requestAnimationFrame((timestamp) => {
      if (this.rafStartTime === undefined) {
        this.rafStartTime = timestamp;
      }
      const elapsedTime = timestamp - this.rafStartTime;
      this._now = this.startTime + elapsedTime;

      if (this._now >= timeOfBlock) {
        resolve()
      } else {
        this.tick(timeOfBlock, resolve);
      }
    });
  }

  waitForBlockNumber(blockNumber: number) {
    const estimatedElapsed = (blockNumber - this.startBlockNumber) * (this.blockSpeed / this.speedMultiplier);
    const timeOfBlock = this.startTime + estimatedElapsed;
    return new Promise((resolve) => {
      this.tick(timeOfBlock, resolve);
    });
  }

  now(): number {
    return Math.floor(this._now);
  }
}

export class LiveTimer implements Timer {
  constructor() { }

  nextBlockNumber() { }

  now(): number {
    return Date.now();
  }
}
