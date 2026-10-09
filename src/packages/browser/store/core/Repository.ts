import { StoreAdapter, Versioned } from "../domain/types";

export interface RepositoryOptions<T> {
  // The shape version this code writes.
  version: number;
  // Whether a value read back is a valid one.
  isValid: (value: unknown) => value is T;
  // What to start from when nothing valid is kept.
  fallback: () => T;
  // Brings data written in an older version up to this one.
  migrate?: (data: unknown, from: number) => unknown;
}

// One typed record in a store: read back, migrated from older versions, validated, and replaced by the fallback
// when it is missing, broken or from a newer version this code cannot read; written with its version. Failures
// to read are nothing kept, failures to write are reported, never thrown.
export class Repository<T> {
  constructor(private readonly adapter: StoreAdapter, private readonly key: string, private readonly options: RepositoryOptions<T>) {}

  public async load(): Promise<T> {
    const { version, isValid, fallback, migrate } = this.options;

    try {
      const stored = await this.adapter.get(this.key);

      if (!isVersioned(stored) || stored.version > version) {
        return fallback();
      }

      const data = stored.version < version && migrate ? migrate(stored.data, stored.version) : stored.data;

      return isValid(data) ? data : fallback();
    } catch {
      return fallback();
    }
  }

  public async save(data: T): Promise<boolean> {
    try {
      const record: Versioned<T> = { version: this.options.version, data };

      await this.adapter.set(this.key, record);

      return true;
    } catch {
      return false;
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.adapter.delete(this.key);
    } catch {
      // Nothing kept to clear.
    }
  }
}

const isVersioned = (value: unknown): value is Versioned<unknown> => typeof value === "object" && value !== null && "version" in value &&
  typeof value.version === "number" && "data" in value;
