import { createStore, LocalStorageAdapter, MemoryAdapter, Repository } from "@/packages/browser/store";

const isCount = (value: unknown): value is { count: number } => typeof value === "object" && value !== null && "count" in value && typeof value.count === "number";

describe("browser/store", () => {
  test("memory and localStorage keep values by key, each store under its own namespace", async () => {
    const memory = new MemoryAdapter();
    const local = new LocalStorageAdapter(window.localStorage, "test");
    const other = new LocalStorageAdapter(window.localStorage, "other");

    await memory.set("a", { count: 1 });
    await local.set("a", { count: 2 });
    await other.set("a", { count: 3 });

    expect(await memory.get("a")).toEqual({ count: 1 });
    expect(await local.get("a")).toEqual({ count: 2 });
    expect(await local.keys()).toEqual(["a"]);

    await local.delete("a");
    expect(await local.get("a")).toBeUndefined();
    expect(await other.get("a")).toEqual({ count: 3 });
  });

  test("picks IndexedDB for lasting data where it can, localStorage for small, and memory when neither works", async () => {
    const broken: Storage = { ...window.localStorage, setItem: () => { throw new Error("blocked"); } };

    expect((await createStore("t", { size: "large", isDurable: true }, { localStorage: window.localStorage })).kind).toBe("localStorage");
    expect((await createStore("t", { size: "small", isDurable: false }, { localStorage: window.localStorage })).kind).toBe("localStorage");
    expect((await createStore("t", { size: "small", isDurable: false }, { localStorage: broken })).kind).toBe("memory");
    expect((await createStore("t", { size: "large", isDurable: true }, {})).kind).toBe("memory");
  });

  test("a repository validates what it reads, migrates old versions and starts afresh from anything broken", async () => {
    const adapter = new MemoryAdapter();
    const repository = new Repository(adapter, "save", { version: 2, isValid: isCount, fallback: () => ({ count: 0 }), migrate: (data) => ({ count: Number(data) }) });

    expect(await repository.load()).toEqual({ count: 0 });
    expect(await repository.save({ count: 7 })).toBe(true);
    expect(await repository.load()).toEqual({ count: 7 });

    await adapter.set("save", { version: 1, data: 4 });
    expect(await repository.load()).toEqual({ count: 4 });

    await adapter.set("save", { version: 3, data: { count: 9 } });
    expect(await repository.load()).toEqual({ count: 0 });

    await adapter.set("save", "garbage");
    expect(await repository.load()).toEqual({ count: 0 });
  });
});
