import {
  AskRequestMapper,
  AskRequestValidator,
  DEFAULT_ASK_LIMITS,
  isAskBody,
  isAskEvent,
  isCachedAnswer,
  PromptMapper
} from "@/packages/ai/ask";

const limits = DEFAULT_ASK_LIMITS;

describe("a question on its way in: guard, validator, mapper", () => {
  test("the guard only lets through an object with a question string", () => {
    expect([null, "text", [], { question: 3 }, {}].map(isAskBody)).toEqual([false, false, false, false, false]);
    expect(isAskBody({ question: "" })).toBe(true);
  });

  test("the validator collects every rule a body breaks", () => {
    const validator = new AskRequestValidator(limits);

    expect(validator.validate({ question: "  " }).errors).toEqual(["the question is empty"]);
    expect(validator.validate({ question: "x".repeat(limits.questionLength + 1), depth: "max", history: "no" }).errors).toEqual([
      `the question is over ${limits.questionLength} characters`,
      "the depth is neither quick nor deep",
      "the history is not a list",
    ]);
    expect(validator.validate({ question: "What did Red build?", depth: "deep", history: [] }).isValid).toBe(true);
  });

  test("the mapper trims, defaults to quick, and keeps only well formed history within the limits", () => {
    const history = [
      { question: "one", answer: "a" },
      { question: "two", answer: "b" },
      { question: 3, answer: "c" },
      { question: "four", answer: "d".repeat(5000) },
    ];
    const request = new AskRequestMapper(limits).map({ question: "  next  ", history });

    expect(request.question).toBe("next");
    expect(request.depth).toBe("quick");
    expect(request.history.map((turn) => turn.question)).toEqual(["two", "four"]);
    expect(request.history[1].answer).toHaveLength(limits.answerLength);
  });

  test("the prompt puts the cached knowledge first, the depth's guidance after it, and the history before the question", () => {
    const prompt = new PromptMapper({ knowledge: "K", guidance: { quick: "Short.", deep: "Long." }, cache: "1h", cacheKey: "ask-v1" });

    expect(prompt.map({ question: "More?", depth: "deep", history: [{ question: "Q", answer: "A" }] })).toEqual({
      tier: "deep",
      system: [{ text: "K", cache: "1h" }, { text: "Long." }],
      messages: [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
        { role: "user", content: "More?" },
      ],
      cacheKey: "ask-v1",
    });
  });
});

describe("data read back from outside", () => {
  test("a cached answer and a wire event are checked before they are trusted", () => {
    expect(isCachedAnswer({ text: "a", sources: ["about"], label: "Gemini" })).toBe(true);
    expect(isCachedAnswer({ text: "a", sources: [1], label: "Gemini" })).toBe(false);
    expect(isCachedAnswer({ text: "a", sources: [] })).toBe(false);
    expect([
      { type: "model", label: "Gemini" },
      { type: "text", text: "a" },
      { type: "sources", keys: ["about"] },
      { type: "done" },
      { type: "error", code: "limited" },
    ].every(isAskEvent)).toBe(true);
    expect([{ type: "nope" }, { type: "text" }, { type: "sources", keys: [1] }, { type: "error", code: "teapot" }, null].some(isAskEvent)).toBe(false);
  });
});
