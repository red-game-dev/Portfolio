import { StoreAdapter } from "../domain/types";

// Keeps small values in localStorage as JSON, every key under a namespace so one store never reads another's.
export class LocalStorageAdapter implements StoreAdapter {
  public readonly kind = "localStorage";

  constructor(private readonly storage: Storage, private readonly namespace: string) {}

  // Whether localStorage works here: it can exist and still throw on every write.
  public static isAvailable(storage: Storage | undefined): storage is Storage {
    if (!storage) {
      return false;
    }

    try {
      const probe = "__store_probe__";

      storage.setItem(probe, probe);
      storage.removeItem(probe);

      return true;
    } catch {
      return false;
    }
  }

  public get(key: string): Promise<unknown> {
    try {
      const raw = this.storage.getItem(this.full(key));

      return Promise.resolve(raw === null ? undefined : JSON.parse(raw) as unknown);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public set(key: string, value: unknown): Promise<void> {
    try {
      this.storage.setItem(this.full(key), JSON.stringify(value));

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public delete(key: string): Promise<void> {
    try {
      this.storage.removeItem(this.full(key));

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public keys(): Promise<string[]> {
    const prefix = `${this.namespace}:`;
    const keys: string[] = [];

    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);

      if (key?.startsWith(prefix)) {
        keys.push(key.slice(prefix.length));
      }
    }

    return Promise.resolve(keys);
  }

  public close(): void {
    // Holds no connection.
  }

  private full(key: string): string {
    return `${this.namespace}:${key}`;
  }
}
