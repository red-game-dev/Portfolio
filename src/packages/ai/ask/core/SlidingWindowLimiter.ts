import { CounterStore } from "../domain/types";

export interface RateWindow {
  limit: number;
  windowMs: number;
}

// The sliding window estimate: the previous window's count, weighted by how much of it still overlaps the
// last `windowMs`, plus the current window's count. Two counters per key, close to an exact log, and cheap
// for a shared store.
export const slidingCount = (previous: number, current: number, elapsed: number): number => previous * (1 - elapsed) + current;

// Allows `limit` hits per key within any `windowMs`, counted in a store every instance shares. A refused hit
// still counts, so a client that keeps hammering stays refused.
export class SlidingWindowLimiter {
  private readonly store: CounterStore;
  private readonly prefix: string;
  private readonly window: RateWindow;
  private readonly now: () => number;

  constructor(store: CounterStore, prefix: string, window: RateWindow, now: () => number = Date.now) {
    this.store = store;
    this.prefix = prefix;
    this.window = window;
    this.now = now;
  }

  public async take(key: string): Promise<boolean> {
    const time = this.now();
    const index = Math.floor(time / this.window.windowMs);
    const elapsed = (time % this.window.windowMs) / this.window.windowMs;
    const { value, read } = await this.store.add(`${this.prefix}:${key}:${index}`, 1, this.window.windowMs * 2, [`${this.prefix}:${key}:${index - 1}`]);

    return slidingCount(read[0] ?? 0, value, elapsed) <= this.window.limit;
  }
}
