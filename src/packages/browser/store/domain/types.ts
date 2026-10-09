// Somewhere values can be kept in the browser, by key. Every operation is asynchronous, because the best of
// them (IndexedDB) is, and every one may fail (a private window, a full disk, blocked storage), which callers
// treat as nothing kept.
export interface StoreAdapter {
  readonly kind: StoreKind;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export type StoreKind = "indexedDB" | "localStorage" | "memory";

// What is to be kept, which decides where: large or lasting data wants IndexedDB (room, structured values, off
// the main thread's string parsing); small settings are fine in localStorage; anything survives in memory.
export interface StoreNeed {
  size: "small" | "large";
  isDurable: boolean;
}

// A value as a repository keeps it: with the shape version it was written in, so later code can migrate it.
export interface Versioned<T> {
  version: number;
  data: T;
}
