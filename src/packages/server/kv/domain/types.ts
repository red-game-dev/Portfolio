// A counter every server instance shares. `add` creates the key with its time to live if it is new, adds to
// it, and reads other keys in the same round trip.
export interface CounterStore {
  add(key: string, by: number, ttlMs: number, alsoRead?: string[]): Promise<{ value: number; read: number[] }>;
}

// Strings with a time to live, plus `claim`: set only if absent, true for the one caller that set it.
export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  claim(key: string, ttlMs: number): Promise<boolean>;
}

export type KeyValueStore = CounterStore & CacheStore;
