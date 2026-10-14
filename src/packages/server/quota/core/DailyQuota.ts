import { CounterStore } from "@/packages/server/kv";

import { Quota } from "../domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;

// A ceiling per UTC day, shared by every instance. Spend recorded after the work (`spend`) lets concurrent work pass
// the ceiling by at most what it costs between them, so anything that must never be passed takes its place first
// (`take`), one at a time.
export class DailyQuota implements Quota {
  private readonly store: CounterStore;
  private readonly prefix: string;
  private readonly limit: number;
  private readonly now: () => number;

  constructor(store: CounterStore, prefix: string, limit: number, now: () => number = Date.now) {
    this.store = store;
    this.prefix = prefix;
    this.limit = limit;
    this.now = now;
  }

  public async hasRoom(): Promise<boolean> {
    const { value } = await this.store.add(this.key(), 0, DAY_MS * 2);

    return value < this.limit;
  }

  public async spend(amount: number): Promise<void> {
    if (amount > 0) {
      await this.store.add(this.key(), Math.ceil(amount), DAY_MS * 2);
    }
  }

  // Spends one at once and says whether it fit, so concurrent work can never pass the ceiling: what the counter reads
  // after the add is this one's place in the day.
  public async take(): Promise<boolean> {
    const { value } = await this.store.add(this.key(), 1, DAY_MS * 2);

    // Past the ceiling, the place is given straight back, so a refused take never holds a place a refund frees.
    if (value > this.limit) {
      await this.store.add(this.key(), -1, DAY_MS * 2);

      return false;
    }

    return true;
  }

  // Gives one back, for work taken that never happened (a send that failed).
  public async refund(): Promise<void> {
    await this.store.add(this.key(), -1, DAY_MS * 2);
  }

  private key(): string {
    return `${this.prefix}:${new Date(this.now()).toISOString()
.slice(0, 10)}`;
  }
}
