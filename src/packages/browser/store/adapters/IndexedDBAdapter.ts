import { StoreAdapter } from "../domain/types";

const RECORDS = "records";
// Past this long without an answer, opening is given up on: some browsers never answer at all in a private
// window, and nothing should wait on them.
const OPEN_TIMEOUT_MS = 1500;

const settle = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
});

// A write is kept only once its transaction completes, not when its request succeeds.
const commit = (transaction: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
});

// Keeps values in an IndexedDB database of its own: structured values kept as they are (no JSON), room for far
// more than localStorage, and nothing parsed on the main thread. `open` resolves null where IndexedDB is missing,
// refuses, is blocked or does not answer in time, so the caller can fall back; a connection that answers too late
// is closed at once. The connection closes itself when a newer version of the page needs the database.
export class IndexedDBAdapter implements StoreAdapter {
  public readonly kind = "indexedDB";

  private constructor(private readonly database: IDBDatabase) {
    database.onversionchange = () => database.close();
  }

  public static open(factory: IDBFactory | undefined, name: string, timeoutMs = OPEN_TIMEOUT_MS): Promise<IndexedDBAdapter | null> {
    if (!factory) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      let isSettled = false;
      const finish = (adapter: IndexedDBAdapter | null) => {
        if (!isSettled) {
          isSettled = true;
          resolve(adapter);
        }
      };
      const timer = setTimeout(() => finish(null), timeoutMs);

      try {
        const request = factory.open(name, 1);

        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(RECORDS)) {
            request.result.createObjectStore(RECORDS);
          }
        };
        request.onsuccess = () => {
          clearTimeout(timer);

          if (isSettled) {
            request.result.close();
          } else {
            finish(new IndexedDBAdapter(request.result));
          }
        };
        request.onerror = () => {
          clearTimeout(timer);
          finish(null);
        };
        request.onblocked = () => {
          clearTimeout(timer);
          finish(null);
        };
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    });
  }

  public get(key: string): Promise<unknown> {
    return settle(this.records("readonly").get(key));
  }

  public async set(key: string, value: unknown): Promise<void> {
    const store = this.records("readwrite");

    store.put(value, key);
    await commit(store.transaction);
  }

  public async delete(key: string): Promise<void> {
    const store = this.records("readwrite");

    store.delete(key);
    await commit(store.transaction);
  }

  public async keys(): Promise<string[]> {
    const keys = await settle(this.records("readonly").getAllKeys());

    return keys.map(String);
  }

  public close(): void {
    this.database.close();
  }

  private records(mode: IDBTransactionMode): IDBObjectStore {
    return this.database.transaction(RECORDS, mode).objectStore(RECORDS);
  }
}
