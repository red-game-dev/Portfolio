import { StoreAdapter } from "../domain/types";

const RECORDS = "records";

const settle = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
});

// Keeps values in an IndexedDB database of its own: structured values kept as they are (no JSON), room for far
// more than localStorage, and nothing parsed on the main thread. `open` resolves null where IndexedDB is missing
// or refuses to open, so the caller can fall back.
export class IndexedDBAdapter implements StoreAdapter {
  public readonly kind = "indexedDB";

  private constructor(private readonly database: IDBDatabase) {}

  public static open(factory: IDBFactory | undefined, name: string): Promise<IndexedDBAdapter | null> {
    if (!factory) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = factory.open(name, 1);

        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(RECORDS)) {
            request.result.createObjectStore(RECORDS);
          }
        };
        request.onsuccess = () => resolve(new IndexedDBAdapter(request.result));
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public get(key: string): Promise<unknown> {
    return settle(this.records("readonly").get(key));
  }

  public async set(key: string, value: unknown): Promise<void> {
    await settle(this.records("readwrite").put(value, key));
  }

  public async delete(key: string): Promise<void> {
    await settle(this.records("readwrite").delete(key));
  }

  public async keys(): Promise<string[]> {
    const keys = await settle(this.records("readonly").getAllKeys());

    return keys.map(String);
  }

  private records(mode: IDBTransactionMode): IDBObjectStore {
    return this.database.transaction(RECORDS, mode).objectStore(RECORDS);
  }
}
