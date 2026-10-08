import { ASK_PROVIDERS } from "@/config/ask";
import { RouteValidator } from "@/packages/ai/engine";
import { activeProviders, createAskRoutes } from "@/services/ask/routes";

const ALL_KEYS = { GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o" };

describe("Ask Red routes", () => {
  test("the free provider goes first, and a provider without a key is left out", () => {
    expect(activeProviders({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" })).toEqual(["gemini", "anthropic"]);
    expect(activeProviders({ ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "o" })).toEqual(["anthropic", "openai"]);
    expect(activeProviders({})).toEqual([]);
  });

  test("ASK_PROVIDERS reorders or narrows them, ignoring names it does not know", () => {
    expect(activeProviders({ ...ALL_KEYS, ASK_PROVIDERS: "anthropic, nope ,gemini,anthropic" })).toEqual(["anthropic", "gemini"]);
  });

  test("each depth gets every active provider's model for it, in order", () => {
    const routes = createAskRoutes({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" });

    expect(routes.quick.map((route) => [route.provider.name, route.spec.id, route.tier])).toEqual([
      ["gemini", "gemini-3.8-flash", "quick"],
      ["anthropic", "claude-haiku-5-5", "quick"],
    ]);
    expect(routes.deep.map((route) => [route.provider.name, route.spec.id])).toEqual([
      ["gemini", "gemini-3.8-flash"],
      ["anthropic", "claude-sonnet-5-5"],
    ]);
  });

  test("every configured model passes the engine's route rules, so a typo fails here and not in production", () => {
    const routes = createAskRoutes(ALL_KEYS);

    expect(new RouteValidator().validate([...routes.quick, ...routes.deep]).errors).toEqual([]);
    expect(routes.quick).toHaveLength(Object.keys(ASK_PROVIDERS).length);
  });

  test("free models cost nothing against the daily budget; paid ones carry their price", () => {
    const [gemini, claude] = createAskRoutes({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" }).quick;

    expect(gemini.spec.price).toEqual({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
    expect(claude.spec.price.input).toBeGreaterThan(0);
  });
});
