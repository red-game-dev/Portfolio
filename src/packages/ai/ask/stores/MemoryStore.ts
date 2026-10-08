import { AskStore } from "../domain/types";

interface Entry {
  value: string;
  expiresAt: number;
}

// Past this many keys, expired ones are swept, so memory stays bounded.
const SWEEP_AT = 10000;

// The store for one process: tests, local runs, and the fallback while the shared store is down. Limits it
// keeps hold per instance only.
export class MemoryStore implements AskStore {
  private readonly entries = new Map<string, Entry>();
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  public async add(key: string, by: number, ttlMs: number, alsoRead: string[] = []): Promise<{ value: number; read: number[] }> {
    const entry = this.live(key);
    const value = Number(entry?.value ?? 0) + by;

    this.put(key, String(value), entry ? entry.expiresAt - this.now() : ttlMs);

    return Promise.resolve({ value, read: alsoRead.map((other) => Number(this.live(other)?.value ?? 0)) });
  }

  public async get(key: string): Promise<string | null> {
    return Promise.resolve(this.live(key)?.value ?? null);
  }

  public async set(key: string, value: string, ttlMs: number): Promise<void> {
    this.put(key, value, ttlMs);

    return Promise.resolve();
  }

  public async claim(key: string, ttlMs: number): Promise<boolean> {
    if (this.live(key)) {
      return Promise.resolve(false);
    }

    this.put(key, "1", ttlMs);

    return Promise.resolve(true);
  }

  private live(key: string): Entry | undefined {
    const entry = this.entries.get(key);

    if (entry && entry.expiresAt <= this.now()) {
      this.entries.delete(key);

      return undefined;
    }

    return entry;
  }

  private put(key: string, value: string, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });

    if (this.entries.size > SWEEP_AT) {
      [...this.entries.keys()].forEach((other) => this.live(other));
    }
  }
}
