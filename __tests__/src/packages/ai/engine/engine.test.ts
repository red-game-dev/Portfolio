/**
 * @jest-environment node
 */
import {
  AiEngine,
  cacheHitRatio,
  costMicros,
  EngineEvent,
  EngineReport,
  estimateTokens,
  ModelChunk,
  ModelError,
  ModelProvider,
  ModelRequest,
  readLines,
  Route,
  RouteValidator
} from "@/packages/ai/engine";

import { bodyOf } from "../fixtures/streams";

type Step = string | Error;

// A provider that plays one script per call: text chunks, or an error thrown at that point, then its usage.
class FakeProvider implements ModelProvider {
  public readonly requests: ModelRequest[] = [];

  constructor(public readonly name: string, private readonly scripts: Step[][]) {}

  public async* stream(request: ModelRequest): AsyncGenerator<ModelChunk> {
    const script = this.scripts[Math.min(this.requests.length, this.scripts.length - 1)];

    this.requests.push(request);

    for (const step of script) {
      if (step instanceof Error) {
        throw step;
      }

      yield { type: "text", text: step };
    }

    yield { type: "usage", usage: { input: 100, cacheWrite: 0, cacheRead: 1000, output: 50 } };
  }
}

const price = { input: 1, cacheWrite: 2, cacheRead: 0.1, output: 5 };

const route = (provider: ModelProvider, tier: string, id = `${provider.name}-${tier}`): Route => ({
  provider,
  spec: { id, label: id, maxTokens: 100, effort: "low", price },
  tier,
});

const run = async (engine: AiEngine, tier = "quick", signal?: AbortSignal) => {
  const events: EngineEvent[] = [];

  for await (const event of engine.stream({ tier, system: [{ text: "K", cache: "1h" }], messages: [{ role: "user", content: "Q" }], cacheKey: "c" }, signal)) {
    events.push(event);
  }

  const end = events[events.length - 1];

  return { events, report: (end.type === "end" ? end.report : null) as EngineReport };
};

describe("AiEngine", () => {
  test("streams who answers, the text, then a priced report", async () => {
    const provider = new FakeProvider("free", [["Hello", " there"]]);
    const { events, report } = await run(new AiEngine({ routes: { quick: [route(provider, "quick")] } }));

    expect(events.slice(0, 3)).toEqual([{ type: "start", label: "free-quick" }, { type: "text", text: "Hello" }, { type: "text", text: " there" }]);
    expect(report).toMatchObject({ outcome: "complete", provider: "free", model: "free-quick", servedTier: "quick", attempts: 1, costMicros: 450 });
    expect(provider.requests[0]).toEqual({
      model: "free-quick",
      maxTokens: 100,
      effort: "low",
      system: [{ text: "K", cache: "1h" }],
      messages: [{ role: "user", content: "Q" }],
      cacheKey: "c",
    });
  });

  test("a provider that refuses outright is skipped for the next, without a retry", async () => {
    const free = new FakeProvider("free", [[new ModelError(401, "bad key")]]);
    const paid = new FakeProvider("paid", [["From paid."]]);
    const { events, report } = await run(new AiEngine({ routes: { quick: [route(free, "quick"), route(paid, "quick")] }, resilience: { retries: 2 } }));

    expect(free.requests).toHaveLength(1);
    expect(events[0]).toEqual({ type: "start", label: "paid-quick" });
    expect(report).toMatchObject({ provider: "paid", attempts: 2 });
  });

  test("a busy route gets its retries, then a deep tier falls back to the quick routes it has not tried", async () => {
    const deep = new FakeProvider("big", [[new ModelError(529, "busy")]]);
    const quick = new FakeProvider("small", [["Quick answer."]]);
    const waits: number[] = [];
    const engine = new AiEngine({
      routes: { quick: [route(quick, "quick")], deep: [route(deep, "deep")] },
      fallbacks: { deep: ["quick"] },
      resilience: { retries: 1, backoffMs: 10 },
      wait: (ms) => Promise.resolve(void waits.push(ms)),
    });
    const { report } = await run(engine, "deep");

    expect(deep.requests).toHaveLength(2);
    expect(waits).toEqual([10]);
    expect(report).toMatchObject({ outcome: "complete", servedTier: "quick", provider: "small" });
  });

  test("a fallback tier never repeats a model already tried", () => {
    const shared = new FakeProvider("shared", [["x"]]);
    const engine = new AiEngine({ routes: { quick: [route(shared, "quick", "same")], deep: [route(shared, "deep", "same")] }, fallbacks: { deep: ["quick"] } });

    return run(engine, "deep").then(() => expect(shared.requests).toHaveLength(1));
  });

  test("once words are shown the answer stands: no retry, a failed report", async () => {
    const provider = new FakeProvider("p", [["Half", new ModelError(529, "busy")]]);
    const { events, report } = await run(new AiEngine({ routes: { quick: [route(provider, "quick"), route(new FakeProvider("q", [["never"]]), "quick")] } }));

    expect(events.filter((event) => event.type === "text")).toEqual([{ type: "text", text: "Half" }]);
    expect(report.outcome).toBe("failed");
  });

  test("a reader who stops gets a stopped report; a tier with no routes fails cleanly", async () => {
    const controller = new AbortController();
    const stopping: ModelProvider = {
      name: "p",
      async* stream() {
        yield { type: "text", text: "Start" };
        controller.abort();
        throw new ModelError(0, "aborted");
      },
    };
    const engine = new AiEngine({ routes: { quick: [route(stopping, "quick")] } });

    expect((await run(engine, "quick", controller.signal)).report.outcome).toBe("stopped");
    expect(engine.hasRoutes("deep")).toBe(false);
    expect((await run(engine, "deep")).report).toMatchObject({ outcome: "failed", attempts: 0 });
  });

  test("a broken route fails when the engine is made, not on a visitor's question", () => {
    const bad = { ...route(new FakeProvider("p", [[]]), "quick"), spec: { id: "", label: "x", maxTokens: 0, price: { ...price, output: -1 } } };

    expect(new RouteValidator().validate([bad]).errors).toEqual([
      "route 1 (p ?) has no model id",
      "route 1 (p ?) needs a positive whole maxTokens",
      "route 1 (p ?) has a bad output price",
    ]);
    expect(() => new AiEngine({ routes: { quick: [bad] } })).toThrow("has no model id");
  });
});

describe("engine utilities", () => {
  test("cost is micro dollars, the hit ratio is the cached share of input, tokens are estimated at four characters", () => {
    expect(costMicros({ input: 1000, cacheWrite: 0, cacheRead: 21000, output: 60 }, { input: 0.1, cacheWrite: 0.2, cacheRead: 0.01, output: 0.5 })).toBeCloseTo(340);
    expect(cacheHitRatio({ input: 1000, cacheWrite: 0, cacheRead: 3000, output: 0 })).toBe(0.75);
    expect(cacheHitRatio({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0 })).toBe(0);
    expect(estimateTokens("12345678")).toBe(2);
  });

  test("lines are read as they end, across chunk boundaries, with a last line kept", async () => {
    const lines: string[] = [];

    for await (const line of readLines(bodyOf(["a\nb", "b\n\nc"]))) {
      lines.push(line);
    }

    expect(lines).toEqual(["a", "bb", "c"]);
  });
});
