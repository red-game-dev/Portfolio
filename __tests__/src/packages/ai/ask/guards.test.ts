import { DEFAULT_ASK_LIMITS, parseAskRequest, RateLimiter } from "@/packages/ai/ask";

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

describe("RateLimiter", () => {
  test("allows the limit within the window, then refuses until hits age out", () => {
    let now = 0;
    const limiter = new RateLimiter({ limit: 2, windowMs: 1000 }, () => now);

    expect([limiter.take("a"), limiter.take("a"), limiter.take("a")]).toEqual([true, true, false]);
    expect(limiter.take("b")).toBe(true);

    now = 999;
    expect(limiter.take("a")).toBe(false);

    now = 1000;
    expect(limiter.take("a")).toBe(true);
  });

  test("a refused hit does not count against the next window", () => {
    let now = 0;
    const limiter = new RateLimiter({ limit: 1, windowMs: 100 }, () => now);

    limiter.take("a");
    now = 50;
    limiter.take("a");
    now = 100;

    expect(limiter.take("a")).toBe(true);
  });
});
