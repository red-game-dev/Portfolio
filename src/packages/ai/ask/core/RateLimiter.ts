export interface RateWindow {
  limit: number;
  windowMs: number;
}

// Past this many keys, keys with no recent hits are dropped, so memory stays bounded.
const PRUNE_AT = 5000;

// A sliding window per key: each key may act `limit` times within `windowMs`. It lives in memory, so it holds
// per server instance: a first line in front of a hard spend cap set with the model provider.
export class RateLimiter {
  private readonly window: RateWindow;
  private readonly now: () => number;
  private readonly hits = new Map<string, number[]>();

  constructor(window: RateWindow, now: () => number = Date.now) {
    this.window = window;
    this.now = now;
  }

  // Counts a hit and says whether it was allowed. A refused hit is not counted.
  public take(key: string): boolean {
    const time = this.now();
    const recent = this.recent(key, time);

    if (recent.length >= this.window.limit) {
      this.hits.set(key, recent);

      return false;
    }

    this.hits.set(key, [...recent, time]);

    if (this.hits.size > PRUNE_AT) {
      this.prune(time);
    }

    return true;
  }

  private recent(key: string, time: number): number[] {
    return (this.hits.get(key) ?? []).filter((at) => time - at < this.window.windowMs);
  }

  private prune(time: number): void {
    [...this.hits.keys()].forEach((key) => {
      if (this.recent(key, time).length === 0) {
        this.hits.delete(key);
      }
    });
  }
}
