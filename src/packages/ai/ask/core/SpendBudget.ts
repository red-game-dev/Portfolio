import { CounterStore } from "../domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;

// A daily spend ceiling in micro dollars, shared by every instance. Spend is recorded after each answer, so
// concurrent answers can pass it by at most what they cost between them; the provider's monthly limit is the
// hard stop behind it.
export class SpendBudget {
  private readonly store: CounterStore;
  private readonly prefix: string;
  private readonly limitMicros: number;
  private readonly now: () => number;

  constructor(store: CounterStore, prefix: string, limitMicros: number, now: () => number = Date.now) {
    this.store = store;
    this.prefix = prefix;
    this.limitMicros = limitMicros;
    this.now = now;
  }

  public async hasRoom(): Promise<boolean> {
    const { value } = await this.store.add(this.key(), 0, DAY_MS * 2);

    return value < this.limitMicros;
  }

  public async spend(micros: number): Promise<void> {
    if (micros > 0) {
      await this.store.add(this.key(), Math.ceil(micros), DAY_MS * 2);
    }
  }

  // One counter per UTC day.
  private key(): string {
    return `${this.prefix}:${new Date(this.now()).toISOString()
.slice(0, 10)}`;
  }
}
