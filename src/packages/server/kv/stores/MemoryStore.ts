import { KeyValueStore, RankedMember } from "../domain/types";

interface Entry {
  value: string;
  expiresAt: number;
}

// Past this many keys, expired ones are swept, so memory stays bounded.
const SWEEP_AT = 10000;

// The store for one process: tests, local runs, and the fallback while the shared store is down. Limits it
// keeps hold per instance only.
export class MemoryStore implements KeyValueStore {
  private readonly entries = new Map<string, Entry>();
  private readonly ranks = new Map<string, { scores: Map<string, number>; expiresAt: number }>();
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

  public async rank(key: string, member: string, score: number, ttlMs: number, keep?: number): Promise<void> {
    const list = this.liveRank(key) ?? { scores: new Map<string, number>(), expiresAt: this.now() + ttlMs };

    list.scores.set(member, Math.max(score, list.scores.get(member) ?? -Infinity));

    if (keep !== undefined && list.scores.size > keep) {
      const kept = [...list.scores].sort((first, second) => second[1] - first[1]).slice(0, Math.max(0, keep));

      list.scores = new Map(kept);
    }

    this.ranks.set(key, list);

    return Promise.resolve();
  }

  public async top(key: string, count: number): Promise<RankedMember[]> {
    const list = this.liveRank(key);
    const ranked = list ? [...list.scores].map(([member, score]) => ({ member, score })).sort((first, second) => second.score - first.score) : [];

    return Promise.resolve(ranked.slice(0, Math.max(0, count)));
  }

  private liveRank(key: string): { scores: Map<string, number>; expiresAt: number } | undefined {
    const list = this.ranks.get(key);

    if (list && list.expiresAt <= this.now()) {
      this.ranks.delete(key);

      return undefined;
    }

    return list;
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
