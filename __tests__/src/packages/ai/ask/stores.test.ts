/**
 * @jest-environment node
 */
import { AskStore, MemoryStore, ResilientStore, StoreError, UpstashRestStore } from "@/packages/ai/ask";

const fetcherReturning = (results: unknown[], sent: unknown[][] = [], status = 200) => (async (_url: unknown, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body)) as unknown[]);

  return new Response(JSON.stringify(results), { status });
}) as unknown as typeof fetch;

describe("UpstashRestStore", () => {
  test("add creates the key with its expiry, increments it and reads others, in one pipeline", async () => {
    const sent: unknown[][] = [];
    const results = [{ result: "OK" }, { result: 3 }, { result: "2" }, { result: null }];
    const store = new UpstashRestStore({ url: "https://kv.example/", token: "t", fetcher: fetcherReturning(results, sent) });

    expect(await store.add("k", 1, 2000, ["a", "b"])).toEqual({ value: 3, read: [2, 0] });
    expect(sent[0]).toEqual([["SET", "k", 0, "PX", 2000, "NX"], ["INCRBY", "k", 1], ["GET", "a"], ["GET", "b"]]);
  });

  test("claim is true only when SET NX set it", async () => {
    expect(await new UpstashRestStore({ url: "u", token: "t", fetcher: fetcherReturning([{ result: "OK" }]) }).claim("l", 10)).toBe(true);
    expect(await new UpstashRestStore({ url: "u", token: "t", fetcher: fetcherReturning([{ result: null }]) }).claim("l", 10)).toBe(false);
  });

  test("a failed call or a refused command throws a StoreError", async () => {
    await expect(new UpstashRestStore({ url: "u", token: "t", fetcher: fetcherReturning([], [], 500) }).get("k")).rejects.toBeInstanceOf(StoreError);
    await expect(new UpstashRestStore({ url: "u", token: "t", fetcher: fetcherReturning([{ error: "WRONGTYPE" }]) }).get("k")).rejects.toThrow("WRONGTYPE");
  });
});

describe("ResilientStore", () => {
  const broken: AskStore = {
    add: () => Promise.reject(new StoreError("down")),
    get: () => Promise.reject(new StoreError("down")),
    set: () => Promise.reject(new StoreError("down")),
    claim: () => Promise.reject(new StoreError("down")),
  };

  test("falls back when the shared store fails, stays there for the cooldown, then tries it again", async () => {
    let now = 0;
    let calls = 0;
    const failures: unknown[] = [];
    const primary: AskStore = {
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
