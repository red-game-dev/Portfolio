/**
 * @jest-environment node
 */
import { Redis } from "@upstash/redis";

import { KeyValueStore, MemoryStore, ResilientStore, StoreError, UpstashStore } from "@/packages/server/kv";

type Command = unknown[];

// The answers Upstash sends with base64 encoding on, as the client asks for by default: every string encoded, but "OK".
const encoded = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value === "OK" ? value : Buffer.from(value).toString("base64");
  }

  return Array.isArray(value) ? value.map(encoded) : value;
};

const urlOf = (input: string | URL | Request) => (input instanceof Request ? input.url : String(input));

// Each fake Upstash by its address, so every client a test makes talks to its own.
const servers = new Map<string, (target: string, init?: RequestInit) => Response>();

beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const target = urlOf(input);
    const serve = [...servers].find(([url]) => target.startsWith(url))?.[1];

    if (!serve) {
      throw new Error(`No fake Upstash at ${target}`);
    }

    return serve(target, init);
  });
});

afterEach(() => {
  servers.clear();
  jest.restoreAllMocks();
});

// The real Upstash client on a fake Upstash: each command it sends over HTTP (alone, or a pipeline's in one request) is
// kept as it went on the wire, and answered with the next of `answers` (the last repeats), or with `failure` thrown.
const fakeRedis = (answers: unknown[], commands: Command[] = [], failure?: Error) => {
  const url = `https://kv-${servers.size + 1}.test`;
  let next = 0;

  servers.set(url, (target, init) => {
    if (failure) {
      throw failure;
    }

    const body: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : null;
    const isPipeline = target.endsWith("/pipeline");
    const sent: unknown[] = isPipeline && Array.isArray(body) ? body : [body];
    const replies = sent.map((command) => {
      commands.push(Array.isArray(command) ? command : [command]);
      next += 1;

      return { result: encoded(answers[Math.min(next - 1, answers.length - 1)]) };
    });

    return new Response(JSON.stringify(isPipeline ? replies : replies[0]), { status: 200, headers: { "content-type": "application/json" } });
  });

  return new Redis({ url, token: "test", automaticDeserialization: false, retry: false, enableTelemetry: false });
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
    expect(commands).toEqual([["set", "k", 0, "nx", "px", 2000], ["incrby", "k", 1], ["get", "a"], ["get", "b"]]);
  });

  test("get gives back strings as written and nothing else; claim is true only when it set the key", async () => {
    expect(await new UpstashStore(fakeRedis(["{\"text\":\"a\"}"])).get("k")).toBe("{\"text\":\"a\"}");
    expect(await new UpstashStore(fakeRedis([5])).get("k")).toBeNull();
    expect(await new UpstashStore(fakeRedis(["OK"])).claim("l", 10)).toBe(true);
    expect(await new UpstashStore(fakeRedis([null])).claim("l", 10)).toBe(false);
  });

  test("a client failure becomes a StoreError", async () => {
    const failing = fakeRedis([], [], new Error("ECONNRESET"));

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
    expect(commands[2]).toEqual(["zremrangebyrank", "board", 0, -101]);
  });

  test("on Upstash, a member keeps its best (ZADD GT), the list's time is set once, and pairs are read back", async () => {
    const commands: Command[] = [];

    await new UpstashStore(fakeRedis([1, 1], commands)).rank("board", "ABC:1", 300, 5000);
    expect(commands).toEqual([["zadd", "board", "gt", 300, "ABC:1"], ["pexpire", "board", 5000, "NX"]]);

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
