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

  Object.assign(pipeline, {
    set: record("SET", pipeline), incrby: record("INCRBY", pipeline), get: record("GET", pipeline), zadd: record("ZADD", pipeline), pexpire: record("PEXPIRE", pipeline),
    zremrangebyrank: record("ZREMRANGEBYRANK", pipeline),
  });

  return {
    pipeline: () => pipeline,
    get: record("GET", Promise.resolve(answers[0])),
    set: record("SET", Promise.resolve(answers[0])),
    zrange: record("ZRANGE", Promise.resolve(answers[0])),
  } as unknown as Redis;
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

describe("ranked lists", () => {
  test("in memory, each member keeps its best score, the best come back first, and the list ends with its time", async () => {
    let now = 0;
    const store = new MemoryStore(() => now);

    await store.rank("board", "ABC:1", 300, 1000);
    await store.rank("board", "XYZ:2", 500, 1000);
    await store.rank("board", "ABC:1", 100, 1000);
    await store.rank("board", "QRS:3", 400, 1000);

    expect(await store.top("board", 2)).toEqual([{ member: "XYZ:2", score: 500 }, { member: "QRS:3", score: 400 }]);
    expect((await store.top("board", 10)).find(({ member }) => member === "ABC:1")?.score).toBe(300);

    now = 1001;
    expect(await store.top("board", 10)).toEqual([]);
  });

  test("a list kept to its best few drops the rest as better ones come, in memory and on Upstash", async () => {
    const store = new MemoryStore();

    for (let run = 1; run <= 5; run += 1) {
      await store.rank("board", `R${run}`, run * 10, 1000, 3);
    }

    expect((await store.top("board", 10)).map(({ member }) => member)).toEqual(["R5", "R4", "R3"]);

    const commands: Command[] = [];

    await new UpstashStore(fakeRedis([1, 1, 0], commands)).rank("board", "R6", 60, 5000, 100);
    expect(commands[2]).toEqual(["ZREMRANGEBYRANK", "board", 0, -101]);
  });

  test("on Upstash, a member keeps its best (ZADD GT), the list's time is set once, and pairs are read back", async () => {
    const commands: Command[] = [];

    await new UpstashStore(fakeRedis([1, 1], commands)).rank("board", "ABC:1", 300, 5000);
    expect(commands).toEqual([["ZADD", "board", { gt: true }, { score: 300, member: "ABC:1" }], ["PEXPIRE", "board", 5000, "NX"]]);

    expect(await new UpstashStore(fakeRedis([["XYZ:2", "500", "ABC:1", "300"]])).top("board", 2)).toEqual([
      { member: "XYZ:2", score: 500 },
      { member: "ABC:1", score: 300 },
    ]);
    expect(await new UpstashStore(fakeRedis([[]])).top("board", 0)).toEqual([]);
  });
});

describe("ResilientStore", () => {
  const broken: KeyValueStore = {
    add: () => Promise.reject(new StoreError("down")),
    get: () => Promise.reject(new StoreError("down")),
    set: () => Promise.reject(new StoreError("down")),
    claim: () => Promise.reject(new StoreError("down")),
    rank: () => Promise.reject(new StoreError("down")),
    top: () => Promise.reject(new StoreError("down")),
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
