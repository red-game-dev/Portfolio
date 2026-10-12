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
  // Mends data of this version before it is checked, on every read: a part that fails its own check can be put back
  // to its start, so one broken part is not the whole record lost.
  repair?: (data: unknown) => unknown;
}

// A record as it was written, read through the same steps a store read takes: migrated from an older version, repaired
// and validated; null when it is not a record, is from a newer version this code cannot read, or does not check out.
// A record carried in from elsewhere (another device's export) is read this way, as the device's own would be.
export const readVersioned = <T>(stored: unknown, { version, isValid, migrate, repair }: RepositoryOptions<T>): T | null => {
  if (!isVersioned(stored) || stored.version > version) {
    return null;
  }

  const migrated = stored.version < version && migrate ? migrate(stored.data, stored.version) : stored.data;
  const data = repair ? repair(migrated) : migrated;

  return isValid(data) ? data : null;
};

// One typed record in a store: read back, migrated from older versions, repaired, validated, and replaced by the fallback
// when it is missing, broken or from a newer version this code cannot read; written with its version. Failures
// to read are nothing kept, failures to write are reported, never thrown.
export class Repository<T> {
  constructor(private readonly adapter: StoreAdapter, private readonly key: string, private readonly options: RepositoryOptions<T>) {}

  public async load(): Promise<T> {
    try {
      return readVersioned(await this.adapter.get(this.key), this.options) ?? this.options.fallback();
    } catch {
      return this.options.fallback();
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

  public close(): void {
    this.adapter.close();
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
