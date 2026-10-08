import { DEFAULT_ASK_LIMITS, MemoryStore, parseAskRequest, slidingCount, SlidingWindowLimiter, SpendBudget } from "@/packages/ai/ask";

describe("parseAskRequest", () => {
  test("trims the question and defaults to a quick answer", () => {
    expect(parseAskRequest({ question: "  What did Red build?  " }, DEFAULT_ASK_LIMITS)).toEqual({ question: "What did Red build?", depth: "quick", history: [] });
  });

  test("refuses what is not a question, an empty one or one past the limit", () => {
    [null, "text", [], { question: 3 }, { question: "   " }, { question: "x".repeat(DEFAULT_ASK_LIMITS.questionLength + 1) }].forEach((body) => {
      expect(parseAskRequest(body, DEFAULT_ASK_LIMITS)).toBeNull();
    });
  });

  test("keeps only well formed history, newest last, within the limit", () => {
    const history = [
      { question: "one", answer: "a" },
      { question: "two", answer: "b" },
      { question: 3, answer: "c" },
      { question: "four", answer: "d".repeat(5000) },
    ];
    const request = parseAskRequest({ question: "next", depth: "deep", history }, DEFAULT_ASK_LIMITS);

    expect(request?.depth).toBe("deep");
    expect(request?.history.map((turn) => turn.question)).toEqual(["two", "four"]);
    expect(request?.history[1].answer).toHaveLength(DEFAULT_ASK_LIMITS.answerLength);
  });

  test("an unknown depth falls back to quick", () => {
    expect(parseAskRequest({ question: "hi", depth: "max" }, DEFAULT_ASK_LIMITS)?.depth).toBe("quick");
  });
});

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

describe("SpendBudget", () => {
  test("has room until the day's spend reaches the limit, and starts again the next UTC day", async () => {
    let now = Date.UTC(2026, 9, 8, 23, 0);
    const budget = new SpendBudget(new MemoryStore(() => now), "spend", 1000, () => now);

    expect(await budget.hasRoom()).toBe(true);
    await budget.spend(600);
    expect(await budget.hasRoom()).toBe(true);
    await budget.spend(400.2);
    expect(await budget.hasRoom()).toBe(false);

    now = Date.UTC(2026, 9, 9, 0, 1);
    expect(await budget.hasRoom()).toBe(true);
  });
});

describe("MemoryStore", () => {
  test("counters keep the time to live they were created with, and expire", async () => {
    let now = 0;
    const store = new MemoryStore(() => now);

    expect((await store.add("k", 1, 100)).value).toBe(1);
    now = 60;
    expect((await store.add("k", 2, 100, ["other"])).value).toBe(3);
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
