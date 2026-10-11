import { Redis } from "@upstash/redis";

import { KeyValueStore, MemoryStore, ResilientStore, UpstashStore } from "@/packages/server/kv";

// One JSON line per event on stdout, which Vercel keeps as the function's logs.
const log = (event: string, fields: object) => process.stdout.write(`${JSON.stringify({ event, ...fields })}\n`);

let shared: KeyValueStore | null = null;

// The store every server route shares: Upstash Redis from Vercel's Marketplace (KV_* or UPSTASH_REDIS_REST_*
// variables), with memory behind it for outages; memory alone without one, which is fine locally and logged.
// `scope` names whoever asked first, for the log.
export const sharedStore = (scope: string): KeyValueStore => {
  if (shared) {
    return shared;
  }

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    log(`${scope}.store`, { kind: "memory" });
    shared = new MemoryStore();

    return shared;
  }

  const redis = new Redis({ url, token, automaticDeserialization: false, retry: { retries: 2, backoff: (attempt) => 50 * 2 ** attempt } });

  shared = new ResilientStore(new UpstashStore(redis), new MemoryStore(), {
    onFailure: (error) => log(`${scope}.store`, { kind: "fallback", error: error instanceof Error ? error.message : String(error) }),
  });

  return shared;
};
