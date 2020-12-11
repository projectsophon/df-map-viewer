export interface Timer {
  now(): number;

  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(handle: number): void;

  setInterval(fn: () => void, ms: number): number;
  clearInterval(handle: number): void;
}

export class ReplayTimer implements Timer {
  speedMultiplier: number;
  startTime: number;

  _now: number;

  rafStartTime: number;

  _timerId: number;
  _timeouts: Map<number, [number, () => void]>;
  _intervals: Map<number, [number, () => void]>;

  constructor() {
    // TODO: Parameterize?
    this.speedMultiplier = 10;
    this.startTime = 1601677525 * 1000;
    this._now = this.startTime;
    this._timerId = 0;
    this._timeouts = new Map();
    this._intervals = new Map();
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
      for (let [id, [interval, intervalFn]] of this._intervals.entries()) {
        // If the interval is now or in the past, run it and update the interval
        if (interval <= this._now) {
          intervalFn()
          this._intervals.set(id, [interval, intervalFn]);
        }
      }

      if (this._now >= timeOfBlock) {
        // Does this make sense to re-center the timestamp
        // since the block lookups might have been slow?
        this._now = timeOfBlock;
        resolve();
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
    this._timerId++;
    this._timeouts.set(this._timerId, [this.now() + ms, fn]);
    return this._timerId;
  }

  clearTimeout(timerId: number): void {
    this._timeouts.delete(timerId)
  }

  setInterval(fn: () => void, ms: number): number {
    this._timerId++;
    this._intervals.set(this._timerId, [this.now() + ms, fn]);
    return this._timerId;
  }

  clearInterval(timerId: number): void {
    this._intervals.delete(timerId);
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
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
  setInterval = setInterval
  clearInterval = clearInterval
}
