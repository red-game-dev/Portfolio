import type { Redis } from "@upstash/redis";

import { StoreError } from "../domain/errors";
import { KeyValueStore, RankedMember } from "../domain/types";

// Redis on Upstash, through the official client over HTTP, so it works from any serverless instance without a
// connection pool. Build the client with automaticDeserialization off, so a stored string comes back exactly as
// written, and with its own retries for network blips. Every call is one pipelined round trip.
export class UpstashStore implements KeyValueStore {
  private readonly redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // SET NX with an expiry, then INCRBY: the counter gets its time to live once, on whichever instance creates
  // it, and INCRBY keeps it.
  public async add(key: string, by: number, ttlMs: number, alsoRead: string[] = []): Promise<{ value: number; read: number[] }> {
    const pipeline = this.redis.pipeline().set(key, 0, { px: ttlMs, nx: true })
      .incrby(key, by);

    alsoRead.forEach((other) => pipeline.get(other));

    const results = await this.run(() => pipeline.exec<unknown[]>());

    return { value: Number(results[1]), read: results.slice(2).map((value) => Number(value ?? 0)) };
  }

  public async get(key: string): Promise<string | null> {
    const value = await this.run(() => this.redis.get<unknown>(key));

    return typeof value === "string" ? value : null;
  }

  public async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.run(() => this.redis.set(key, value, { px: ttlMs }));
  }

  public async claim(key: string, ttlMs: number): Promise<boolean> {
    return (await this.run(() => this.redis.set(key, 1, { px: ttlMs, nx: true }))) === "OK";
  }

  // ZADD GT keeps a member's best score; the time to live is set only if the list has none yet (PEXPIRE NX), so a
  // list lasts from its first entry, not its last.
  public async rank(key: string, member: string, score: number, ttlMs: number): Promise<void> {
    await this.run(() => this.redis.pipeline().zadd(key, { gt: true }, { score, member })
      .pexpire(key, ttlMs, "NX")
      .exec());
  }

  // The best first, as member and score pairs.
  public async top(key: string, count: number): Promise<RankedMember[]> {
    if (count <= 0) {
      return [];
    }

    const flat = await this.run(() => this.redis.zrange<unknown[]>(key, 0, count - 1, { rev: true, withScores: true }));
    const ranked: RankedMember[] = [];

    for (let index = 0; index + 1 < flat.length; index += 2) {
      const score = Number(flat[index + 1]);

      if (Number.isFinite(score)) {
        ranked.push({ member: String(flat[index]), score });
      }
    }

    return ranked;
  }

  private async run<T>(command: () => Promise<T>): Promise<T> {
    try {
      return await command();
    } catch (error) {
      throw new StoreError(error instanceof Error ? error.message : "The store did not answer");
    }
  }
}
