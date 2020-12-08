export interface Timer {
  now(): number;

  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(handle: number): void;
}

export class ReplayTimer implements Timer {
  speedMultiplier: number;
  startTime: number;

  _now: number;

  rafStartTime: number;

  _timeouts: Map<number, [number, () => void]>;

  _timeoutId: number;

  constructor() {
    // TODO: parameterize
    this.speedMultiplier = 7;
    this.startTime = 1601678470 * 1000;
    this._now = this.startTime;
    this._timeouts = new Map();
    this._timeoutId = 0;
  }

  tick(timeOfBlock: number, resolve: (value?: unknown) => void) {
    window.requestAnimationFrame((timestamp) => {
      if (this.rafStartTime === undefined) {
        this.rafStartTime = timestamp;
      }
      const elapsedTime = timestamp - this.rafStartTime;
      this._now = this.startTime + (elapsedTime * this.speedMultiplier);

      for (let [id, [timeout, timeoutFn]] of this._timeouts.entries()) {
        // If the timeout is now or in the past, run it and remove it from our list
        if (timeout <= this._now) {
          timeoutFn()
          this._timeouts.delete(id);
        }
      }

      if (this._now >= timeOfBlock) {
        resolve()
      } else {
        this.tick(timeOfBlock, resolve);
      }
    });
  }

  waitForBlockNumber(blockTimestamp: number) {
    return new Promise((resolve) => {
      this.tick(blockTimestamp * 1000, resolve);
    });
  }

  now(): number {
    return Math.floor(this._now);
  }

  setTimeout(fn: () => void, ms: number): number {
    this._timeoutId++;
    this._timeouts.set(this._timeoutId, [this.now() + ms, fn]);
    return this._timeoutId;
  }

  clearTimeout(timeoutId: number): void {
    this._timeouts.delete(timeoutId)
  }
}

export class LiveTimer implements Timer {
  constructor() { }

  nextBlockNumber() { }

  now(): number {
    return Date.now();
  }

  // TODO: Can I do this?
  setTimeout = setTimeout
  clearTimeout = clearTimeout
}
