import { CounterStore } from "@/packages/server/kv";

import { Quota } from "../domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;

// A ceiling per UTC day, shared by every instance. Spend is recorded after the work, so concurrent work can pass
// the ceiling by at most what it costs between them; anything that must never be passed needs a hard limit
// behind this one.
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

  private key(): string {
    return `${this.prefix}:${new Date(this.now()).toISOString()
.slice(0, 10)}`;
  }
}
