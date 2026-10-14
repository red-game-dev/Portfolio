import { MemoryStore } from "@/packages/server/kv";
import { DailyQuota, slidingCount, SlidingWindowLimiter } from "@/packages/server/quota";

describe("SlidingWindowLimiter", () => {
  test("the estimate weighs the previous window by how much of it still overlaps", () => {
    expect(slidingCount(10, 2, 0.25)).toBe(9.5);
    expect(slidingCount(10, 2, 1)).toBe(2);
  });

  test("holds across instances that share a store", async () => {
    let now = 0;
    const store = new MemoryStore(() => now);
    const first = new SlidingWindowLimiter(store, "rate", { limit: 2, windowMs: 1000 }, () => now);
    const second = new SlidingWindowLimiter(store, "rate", { limit: 2, windowMs: 1000 }, () => now);

    expect(await first.take("a")).toBe(true);
    expect(await second.take("a")).toBe(true);
    expect(await first.take("a")).toBe(false);
    expect(await second.take("b")).toBe(true);

    // Half way into the next window, half of the last window's 3 hits still count: 1.5 + 1 is over 2.
    now = 1500;
    expect(await first.take("a")).toBe(false);

    now = 2000;
    expect(await first.take("a")).toBe(true);
  });
});

describe("DailyQuota", () => {
  test("has room until the day's spend reaches the limit, and starts again the next UTC day", async () => {
    let now = Date.UTC(2026, 9, 8, 23, 0);
    const quota = new DailyQuota(new MemoryStore(() => now), "spend", 1000, () => now);

    expect(await quota.hasRoom()).toBe(true);
    await quota.spend(600);
    await quota.spend(0);
    expect(await quota.hasRoom()).toBe(true);
    await quota.spend(400.2);
    expect(await quota.hasRoom()).toBe(false);

    now = Date.UTC(2026, 9, 9, 0, 1);
    expect(await quota.hasRoom()).toBe(true);
  });

  test("takes one at a time, never past the limit however many ask at once, and gives back what was never spent", async () => {
    const now = Date.UTC(2026, 9, 8, 12, 0);
    const quota = new DailyQuota(new MemoryStore(() => now), "sent", 3, () => now);
    const taken = await Promise.all([quota.take(), quota.take(), quota.take(), quota.take(), quota.take()]);

    expect(taken.filter(Boolean)).toHaveLength(3);
    expect(await quota.hasRoom()).toBe(false);

    const fresh = new DailyQuota(new MemoryStore(() => now), "sent", 1, () => now);

    expect(await fresh.take()).toBe(true);
    await fresh.refund();
    expect(await fresh.hasRoom()).toBe(true);
    expect(await fresh.take()).toBe(true);
    expect(await fresh.take()).toBe(false);
  });
});
