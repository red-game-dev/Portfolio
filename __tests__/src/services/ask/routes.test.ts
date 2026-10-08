import { activeProviders, createAskRoutes } from "@/services/ask/routes";

describe("Ask Red routes", () => {
  test("the free provider goes first, and a provider without a key is left out", () => {
    expect(activeProviders({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" })).toEqual(["gemini", "anthropic"]);
    expect(activeProviders({ ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o" })).toEqual(["anthropic", "openai"]);
    expect(activeProviders({})).toEqual([]);
  });

  test("ASK_PROVIDERS reorders or narrows them, ignoring names it does not know", () => {
    const env = { GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o" };

    expect(activeProviders({ ...env, ASK_PROVIDERS: "anthropic, nope ,gemini,anthropic" })).toEqual(["anthropic", "gemini"]);
  });

  test("quick has each provider's quick model; deep has each deep model, then the quick ones it has not tried", () => {
    const routes = createAskRoutes({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" });

    expect(routes.quick.map((route) => [route.provider, route.modelId, route.tier])).toEqual([
      ["gemini", "gemini-3.8-flash", "quick"],
      ["anthropic", "claude-haiku-5-5", "quick"],
    ]);
    expect(routes.deep.map((route) => [route.provider, route.modelId, route.tier])).toEqual([
      ["gemini", "gemini-3.8-flash", "deep"],
      ["anthropic", "claude-sonnet-5-5", "deep"],
      ["anthropic", "claude-haiku-5-5", "quick"],
    ]);
  });

  test("free models cost nothing against the daily budget; paid ones carry their price", () => {
    const [gemini, claude] = createAskRoutes({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" }).quick;

    expect(gemini.price).toEqual({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
    expect(claude.price.input).toBeGreaterThan(0);
  });
});
