import { IndexedDBAdapter } from "../adapters/IndexedDBAdapter";
import { LocalStorageAdapter } from "../adapters/LocalStorageAdapter";
import { MemoryAdapter } from "../adapters/MemoryAdapter";
import { StoreAdapter, StoreNeed } from "../domain/types";

// What the browser offers, so tests (and a worker) can say what is there.
export interface StoreEnvironment {
  indexedDB?: IDBFactory;
  localStorage?: Storage;
}

const browserEnvironment = (): StoreEnvironment => {
  const environment: StoreEnvironment = {};

  try {
    environment.indexedDB = typeof indexedDB === "undefined" ? undefined : indexedDB;
  } catch {
    environment.indexedDB = undefined;
  }

  try {
    environment.localStorage = typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    environment.localStorage = undefined;
  }

  return environment;
};

// The best place this browser offers for what is to be kept: IndexedDB first for large or lasting data,
// localStorage first for small settings, each falling back to the other, and memory when neither works.
export const createStore = async (namespace: string, need: StoreNeed, environment: StoreEnvironment = browserEnvironment()): Promise<StoreAdapter> => {
  const local = () => (LocalStorageAdapter.isAvailable(environment.localStorage) ? new LocalStorageAdapter(environment.localStorage, namespace) : null);
  const database = () => IndexedDBAdapter.open(environment.indexedDB, namespace);
  const wantsDatabase = need.size === "large" || need.isDurable;

  if (wantsDatabase) {
    return (await database()) ?? local() ?? new MemoryAdapter();
  }

  return local() ?? (await database()) ?? new MemoryAdapter();
};
