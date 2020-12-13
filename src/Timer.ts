export interface Timer {
  now(): number;

  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(handle: number): void;

  setInterval(fn: () => void, ms: number): number;
  clearInterval(handle: number): void;
}

export class ReplayTimer implements Timer {
  speedMultiplier: number;

  _now: number;

  _rafStart: number;
  _elapsed: number;

  _timerId: number;
  _timeouts: Map<number, [number, () => void]>;
  _intervals: Map<number, [number, number, () => void]>;

  constructor(startTime: number = 1601677525 * 1000) {
    // TODO: Parameterize?
    this.speedMultiplier = 10;
    this._elapsed = 0;
    this._now = startTime;
    this._timerId = 0;
    this._timeouts = new Map();
    this._intervals = new Map();

    this._tick();
  }

  _tick() {
    window.requestAnimationFrame((timestamp) => {
      if (this._rafStart === undefined) {
        this._rafStart = timestamp;
      }
      let tick = timestamp - this._rafStart - this._elapsed;
      this._now += (tick * this.speedMultiplier);
      this._elapsed += tick;

      for (let [id, [timeout, timeoutFn]] of this._timeouts.entries()) {
        // If the timeout is now or in the past, run it and remove it from our list
        if (timeout <= this._now) {
          timeoutFn()
          this._timeouts.delete(id);
        }
      }
      for (let [id, [interval, ms, intervalFn]] of this._intervals.entries()) {
        // If the interval is now or in the past, run it and update the interval
        if (interval <= this._now) {
          intervalFn()
          this._intervals.set(id, [this._now + ms, ms, intervalFn]);
        }
      }

      this._tick();
    });
  }

  waitForBlockNumber(blockTimestamp: number) {
    let timestamp = blockTimestamp * 1000;
    return new Promise((resolve: () => void) => {
      this._timerId++;

      let fn = () => {
        // There's a little stuttering from this re-center so only do it if the gap is big-ish
        if (this._now > 1000 * this.speedMultiplier + timestamp) {
          console.log('[DEBUG] Re-centered because ReplayTimer is %dms ahead', this._now - timestamp);
          this._now = timestamp;
        }
        resolve();
      };

      this._timeouts.set(this._timerId, [timestamp, fn])
    });
  }

  now(): number {
    return Math.floor(this._now);
  }

  setTimeout(fn: () => void, ms: number): number {
    this._timerId++;
    this._timeouts.set(this._timerId, [this._now + ms, fn]);
    return this._timerId;
  }

  clearTimeout(timerId: number): void {
    this._timeouts.delete(timerId)
  }

  setInterval(fn: () => void, ms: number): number {
    this._timerId++;
    this._intervals.set(this._timerId, [this._now + ms, ms, fn]);
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
