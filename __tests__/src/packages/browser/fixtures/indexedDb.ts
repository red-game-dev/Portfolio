/* eslint-disable max-classes-per-file -- an IndexedDB that never answers: its factory and the request it hands out */

const neverOpened = (what: string): never => {
  throw new Error(`A request that never opened has no ${what}.`);
};

// A request to open a database that stays pending for good: no success, no error, nothing blocked.
export class PendingOpenRequest extends EventTarget implements IDBOpenDBRequest {
  public readonly error = null;
  public readonly readyState = "pending";
  public readonly transaction = null;
  public onerror: ((this: IDBRequest<IDBDatabase>, event: Event) => unknown) | null = null;
  public onsuccess: ((this: IDBRequest<IDBDatabase>, event: Event) => unknown) | null = null;
  public onblocked: ((this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => unknown) | null = null;
  public onupgradeneeded: ((this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => unknown) | null = null;

  public get result(): IDBDatabase {
    return neverOpened("database");
  }

  public get source(): IDBObjectStore {
    return neverOpened("source");
  }
}

// An IndexedDB that never answers a request to open, as a browser can leave one hanging.
export class SilentIndexedDB implements IDBFactory {
  public open(): IDBOpenDBRequest {
    return new PendingOpenRequest();
  }

  public deleteDatabase(): IDBOpenDBRequest {
    return new PendingOpenRequest();
  }

  public databases(): Promise<IDBDatabaseInfo[]> {
    return Promise.resolve([]);
  }

  public cmp(): number {
    return 0;
  }
}
