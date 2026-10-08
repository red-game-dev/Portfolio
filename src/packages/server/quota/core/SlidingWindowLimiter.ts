import { CounterStore } from "@/packages/server/kv";

import { Limiter, RateWindow } from "../domain/types";
import { slidingCount } from "../utils/sliding";

// Allows `limit` hits per key within any `windowMs`, counted in a store every instance shares. A refused hit
// still counts, so a client that keeps hammering stays refused.
export class SlidingWindowLimiter implements Limiter {
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
