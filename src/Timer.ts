export interface Timer {
  now(): number;

  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(handle: number): void;

  setInterval(fn: () => void, ms: number): number;
  clearInterval(handle: number): void;
}

export class ReplayTimer implements Timer {
  speedMultiplier: number;

  paused: boolean;

  _now: number;

  _raf?: number;
  _rafStart?: number;
  _elapsed: number;

  _timerId: number;
  _timeouts: Map<number, [number, () => void]>;
  _intervals: Map<number, [number, number, () => void]>;
  _blockTimers: Map<number, [number, () => void]>;

  constructor(startTime: number, speedMultiplier: number) {
    this.speedMultiplier = speedMultiplier;
    this._elapsed = 0;
    this._now = startTime;
    this._timerId = 0;
    this._timeouts = new Map();
    this._intervals = new Map();
    this._blockTimers = new Map();
    this.paused = true;
  }

  _tick() {
    this._raf = window.requestAnimationFrame((timestamp: number) => {
      this._tick();

      if (this._rafStart === undefined) {
        this._rafStart = timestamp;
      }

      let tick = (timestamp - this._rafStart - this._elapsed);
      let now = this._now + (tick * this.speedMultiplier);

      for (let [id, [timeout, timeoutFn]] of this._blockTimers.entries()) {
        // If the timeout is now or in the past, run it and remove it from our list
        if (timeout <= now) {
          now = timeout;
          timeoutFn()
          this._blockTimers.delete(id);
        }
      }
      for (let [id, [timeout, timeoutFn]] of this._timeouts.entries()) {
        // If the timeout is now or in the past, run it and remove it from our list
        if (timeout <= now) {
          timeoutFn()
          this._timeouts.delete(id);
        }
      }
      for (let [id, [interval, ms, intervalFn]] of this._intervals.entries()) {
        // If the interval is now or in the past, run it and update the interval
        if (interval <= now) {
          intervalFn()
          this._intervals.set(id, [now + ms, ms, intervalFn]);
        }
      }

      this._now = now;
      this._elapsed += tick;
    });
  }

  destroy() {
    this.stop();
    this._timeouts = new Map();
    this._intervals = new Map();
    this._blockTimers = new Map();
  }

  stop() {
    if (this._raf) {
      window.cancelAnimationFrame(this._raf);
      this._raf = undefined;
      this._rafStart = undefined;
    }
    this.paused = true;
  }

  start() {
    if (this.paused) {
      this.paused = false;
      this._tick();
    }
  }

  registerBlock(timestamp: number, fn: () => void) {
    this._timerId++;
    this._blockTimers.set(this._timerId, [timestamp, fn])
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
