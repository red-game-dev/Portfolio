import { AskStore } from "../domain/types";

export interface ResilientStoreOptions {
  // How long to stay on the fallback after the primary fails, before trying it again.
  cooldownMs?: number;
  onFailure?: (error: unknown) => void;
  now?: () => number;
}

const COOLDOWN_MS = 30 * 1000;

// The shared store, falling back to a local one when it fails, like a circuit breaker: after a failure every
// call goes to the fallback for a cooldown, so a store outage degrades limits to per instance instead of
// taking the agent down or leaving it unguarded.
export class ResilientStore implements AskStore {
  private readonly primary: AskStore;
  private readonly fallback: AskStore;
  private readonly options: ResilientStoreOptions;
  private openUntil = 0;

  constructor(primary: AskStore, fallback: AskStore, options: ResilientStoreOptions = {}) {
    this.primary = primary;
    this.fallback = fallback;
    this.options = options;
  }

  public add(key: string, by: number, ttlMs: number, alsoRead?: string[]) {
    return this.call((store) => store.add(key, by, ttlMs, alsoRead));
  }

  public get(key: string) {
    return this.call((store) => store.get(key));
  }

  public set(key: string, value: string, ttlMs: number) {
    return this.call((store) => store.set(key, value, ttlMs));
  }

  public claim(key: string, ttlMs: number) {
    return this.call((store) => store.claim(key, ttlMs));
  }

  private async call<T>(run: (store: AskStore) => Promise<T>): Promise<T> {
    const now = this.options.now?.() ?? Date.now();

    if (now < this.openUntil) {
      return run(this.fallback);
    }

    try {
      return await run(this.primary);
    } catch (error) {
      this.openUntil = now + (this.options.cooldownMs ?? COOLDOWN_MS);
      this.options.onFailure?.(error);

      return run(this.fallback);
    }
  }
}
