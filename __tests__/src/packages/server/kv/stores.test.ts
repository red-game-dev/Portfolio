import type { Redis } from "@upstash/redis";

import { KeyValueStore, MemoryStore, ResilientStore, StoreError, UpstashStore } from "@/packages/server/kv";

type Command = [string, ...unknown[]];

// The slice of the Upstash client the store uses, recording each command and answering from a script.
const fakeRedis = (answers: unknown[], commands: Command[] = []) => {
  const record = <T>(name: string, result: T) => (...args: unknown[]) => {
    commands.push([name, ...args]);

    return result;
  };
  const pipeline: Record<string, unknown> = { exec: () => Promise.resolve(answers) };

  Object.assign(pipeline, { set: record("SET", pipeline), incrby: record("INCRBY", pipeline), get: record("GET", pipeline) });

  return { pipeline: () => pipeline, get: record("GET", Promise.resolve(answers[0])), set: record("SET", Promise.resolve(answers[0])) } as unknown as Redis;
};

describe("MemoryStore", () => {
  test("counters keep the time to live they were created with, and expire", async () => {
    let now = 0;
    const store = new MemoryStore(() => now);

    expect((await store.add("k", 1, 100)).value).toBe(1);
    now = 60;
    expect(await store.add("k", 2, 100, ["missing"])).toEqual({ value: 3, read: [0] });
    now = 100;
    expect((await store.add("k", 1, 100)).value).toBe(1);
  });

  test("only the first claim wins until it expires", async () => {
    let now = 0;
    const store = new MemoryStore(() => now);

    expect(await store.claim("lock", 50)).toBe(true);
    expect(await store.claim("lock", 50)).toBe(false);
    now = 50;
    expect(await store.claim("lock", 50)).toBe(true);
  });
});

describe("UpstashStore", () => {
  test("add sets the expiry once, increments and reads the others in one pipeline", async () => {
    const commands: Command[] = [];
    const store = new UpstashStore(fakeRedis(["OK", 3, "2", null], commands));

    expect(await store.add("k", 1, 2000, ["a", "b"])).toEqual({ value: 3, read: [2, 0] });
    expect(commands).toEqual([["SET", "k", 0, { px: 2000, nx: true }], ["INCRBY", "k", 1], ["GET", "a"], ["GET", "b"]]);
  });

  test("get gives back strings as written and nothing else; claim is true only when it set the key", async () => {
    expect(await new UpstashStore(fakeRedis(["{\"text\":\"a\"}"])).get("k")).toBe("{\"text\":\"a\"}");
    expect(await new UpstashStore(fakeRedis([5])).get("k")).toBeNull();
    expect(await new UpstashStore(fakeRedis(["OK"])).claim("l", 10)).toBe(true);
    expect(await new UpstashStore(fakeRedis([null])).claim("l", 10)).toBe(false);
  });

  test("a client failure becomes a StoreError", async () => {
    const failing = { get: () => Promise.reject(new Error("ECONNRESET")) } as unknown as Redis;

    await expect(new UpstashStore(failing).get("k")).rejects.toEqual(new StoreError("ECONNRESET"));
  });
});

describe("ResilientStore", () => {
  const broken: KeyValueStore = {
    add: () => Promise.reject(new StoreError("down")),
    get: () => Promise.reject(new StoreError("down")),
    set: () => Promise.reject(new StoreError("down")),
    claim: () => Promise.reject(new StoreError("down")),
  };

  test("falls back when the shared store fails, stays there for the cooldown, then tries it again", async () => {
    let now = 0;
    let calls = 0;
    const failures: unknown[] = [];
    const primary: KeyValueStore = {
      ...broken,
      get: () => {
        calls += 1;

        return Promise.reject(new StoreError("down"));
      },
    };
    const fallback = new MemoryStore(() => now);
    const store = new ResilientStore(primary, fallback, { cooldownMs: 1000, now: () => now, onFailure: (error) => failures.push(error) });

    await fallback.set("k", "local", 10000);

    expect(await store.get("k")).toBe("local");
    expect(await store.get("k")).toBe("local");
    expect(calls).toBe(1);

    now = 1000;
    await store.get("k");
    expect(calls).toBe(2);
    expect(failures).toHaveLength(2);
  });
});
