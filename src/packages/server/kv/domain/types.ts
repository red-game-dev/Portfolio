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

// A ranked list with a time to live: each member keeps its best score (a lower one never replaces it), and the top
// few are read back best first. `rank` sets the time to live when it creates the list, and with `keep`, trims the list
// to its best that many, so it can never grow without bound.
export interface RankStore {
  rank(key: string, member: string, score: number, ttlMs: number, keep?: number): Promise<void>;
  top(key: string, count: number): Promise<RankedMember[]>;
}

export interface RankedMember {
  member: string;
  score: number;
}

export type KeyValueStore = CounterStore & CacheStore & RankStore;
