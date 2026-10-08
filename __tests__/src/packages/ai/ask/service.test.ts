/**
 * @jest-environment node
 */
import { AnswerCache, AskEvent, AskGuards, AskRecord, AskService, AskServiceOptions, PromptMapper } from "@/packages/ai/ask";
import { EngineEvent, EngineReport, EngineRequest, TextEngine } from "@/packages/ai/engine";
import { MemoryStore } from "@/packages/server/kv";

const report = (fields: Partial<EngineReport> = {}): EngineReport => ({
  outcome: "complete",
  provider: "free",
  model: "flash",
  label: "Gemini 3.8 Flash",
  servedTier: "quick",
  attempts: 1,
  usage: { input: 1000, cacheWrite: 0, cacheRead: 3000, output: 50 },
  costMicros: 450,
  firstTokenMs: 120,
  ms: 900,
  ...fields,
});

// An engine that replays text and ends with a report, recording what it was asked.
class FakeEngine implements TextEngine {
  public readonly requests: EngineRequest[] = [];

  constructor(private readonly texts: string[], private readonly end: Partial<EngineReport> = {}) {}

  public async* stream(request: EngineRequest): AsyncGenerator<EngineEvent> {
    this.requests.push(request);

    if (this.texts.length > 0) {
      yield { type: "start", label: "Gemini 3.8 Flash" };
    }

    for (const text of this.texts) {
      yield { type: "text", text };
    }

    yield { type: "end", report: report({ servedTier: request.tier, ...this.end }) };
  }
}

const allowAll = () => ({ take: () => Promise.resolve(true) });

const createGuards = (overrides: Partial<AskGuards> = {}) => {
  const spent: number[] = [];
  const guards: AskGuards = {
    visitor: { quick: allowAll(), deep: allowAll() },
    everyone: { quick: allowAll(), deep: allowAll() },
    budget: { hasRoom: () => Promise.resolve(true), spend: (micros) => Promise.resolve(void spent.push(micros)) },
    ...overrides,
  };

  return { guards, spent };
};

const createCache = (store = new MemoryStore()) => new AnswerCache({ store, version: "v1", ttlMs: 60000, hash: (text) => text });

const createService = (engine: TextEngine, extra: Partial<AskServiceOptions> = {}) => new AskService({
  engine,
  prompt: new PromptMapper({ knowledge: "K", guidance: { quick: "Short.", deep: "Long." } }),
  sourceKeys: ["about", "history"],
  guards: createGuards().guards,
  limits: { waitForPeerMs: 40, pollMs: 10 },
  wait: () => Promise.resolve(),
  ...extra,
});

const collect = async (events: AsyncIterable<AskEvent>) => {
  const all: AskEvent[] = [];

  for await (const event of events) {
    all.push(event);
  }

  return all;
};

const planFor = async (service: AskService, body: object) => {
  const prepared = await service.prepare(body, "client");

  if (!("plan" in prepared)) {
    throw new Error(`refused: ${prepared.error}`);
  }

  return prepared.plan;
};

describe("AskService answering", () => {
  test("turns the engine's answer into the domain's: model, text without em dashes, sources split off, done", async () => {
    const records: AskRecord[] = [];
    const { guards, spent } = createGuards();
    const service = createService(new FakeEngine(["Red led ", "it — well.", "\n[[sources: history]]"]), { guards, onRecord: (record) => records.push(record) });
    const events = await collect(service.answer(await planFor(service, { question: "What did he lead?" })));

    expect(events).toEqual([
      { type: "model", label: "Gemini 3.8 Flash" },
      { type: "text", text: "Red led " },
      { type: "text", text: "it, well." },
      { type: "text", text: "\n" },
      { type: "sources", keys: ["history"] },
      { type: "done" },
    ]);
    expect(spent).toEqual([450]);
    expect(records[0]).toMatchObject({ outcome: "answered", provider: "free", depth: "quick", isFirstQuestion: true, cacheHitRatio: 0.75, sources: ["history"] });
  });

  test("asks the engine for the depth's tier with the knowledge first", async () => {
    const engine = new FakeEngine(["ok"]);

    await collect(createService(engine).answer({ request: { question: "More?", depth: "deep", history: [] } }));

    expect(engine.requests[0]).toMatchObject({ tier: "deep", system: [{ text: "K", cache: "5m" }, { text: "Long." }] });
  });

  test("a failed answer ends in an error and is still priced; a stopped one ends quietly", async () => {
    const { guards, spent } = createGuards();
    const plan = { request: { question: "Q", depth: "quick" as const, history: [] } };
    const failed = await collect(createService(new FakeEngine(["Half"], { outcome: "failed" }), { guards }).answer(plan));
    const stopped = await collect(createService(new FakeEngine(["Half"], { outcome: "stopped" })).answer(plan));

    expect(failed.slice(-1)).toEqual([{ type: "error", code: "failed" }]);
    expect(spent).toEqual([450]);
    expect(stopped.some((event) => event.type === "error" || event.type === "done")).toBe(false);
  });
});

describe("AskService guarding", () => {
  test("refuses before any model call: an invalid body, a visitor over the limit, everyone over the limit, an empty budget", async () => {
    const engine = new FakeEngine(["never"]);
    const refuse = () => ({ take: () => Promise.resolve(false) });
    const cases: Array<[Partial<AskGuards>, unknown, string]> = [
      [{}, { question: "" }, "invalid"],
      [{}, { question: 42 }, "invalid"],
      [{ visitor: { quick: refuse(), deep: allowAll() } }, { question: "Hi" }, "limited"],
      [{ everyone: { quick: allowAll(), deep: refuse() } }, { question: "Hi", depth: "deep" }, "limited"],
      [{ budget: { hasRoom: () => Promise.resolve(false), spend: () => Promise.resolve() } }, { question: "Hi" }, "unavailable"],
    ];

    for (const [overrides, body, error] of cases) {
      expect(await createService(engine, { guards: createGuards(overrides).guards }).prepare(body, "c")).toEqual({ error });
    }

    expect(engine.requests).toHaveLength(0);
  });

  test("a first question already answered is replayed from the shared cache, without the engine or the budget", async () => {
    const store = new MemoryStore();
    const engine = new FakeEngine(["Cached once.", "[[sources: about]]"]);
    const everyone = { take: jest.fn(() => Promise.resolve(true)) };
    const first = createService(engine, { cache: createCache(store) });
    const second = createService(engine, { cache: createCache(store), guards: createGuards({ everyone: { quick: everyone, deep: everyone } }).guards });

    await collect(first.answer(await planFor(first, { question: "What has Red built?" })));

    const plan = await planFor(second, { question: "  what has red built " });

    expect(plan.cached).toEqual({ text: "Cached once.", sources: ["about"], label: "Gemini 3.8 Flash" });
    expect(await collect(second.answer(plan))).toEqual([
      { type: "model", label: "Gemini 3.8 Flash" },
      { type: "text", text: "Cached once." },
      { type: "sources", keys: ["about"] },
      { type: "done" },
    ]);
    expect(engine.requests).toHaveLength(1);
    expect(everyone.take).not.toHaveBeenCalled();
  });

  test("follow ups and answers from a fallback tier are never cached", async () => {
    const store = new MemoryStore();

    await collect(createService(new FakeEngine(["fallback"], { servedTier: "quick" }), { cache: createCache(store) })
      .answer({ request: { question: "Deep one", depth: "deep", history: [] } }));
    await collect(createService(new FakeEngine(["follow"]), { cache: createCache(store) })
      .answer({ request: { question: "Follow up", depth: "quick", history: [{ question: "Q", answer: "A" }] } }));

    expect(await createCache(store).get("Deep one", "deep")).toBeNull();
    expect(await createCache(store).get("Follow up", "quick")).toBeNull();
  });

  test("when many ask the same first question at once, one calls the engine and the rest wait for its answer", async () => {
    const cache = createCache();
    let polls = 0;
    const leader = createService(new FakeEngine(["Shared."]), { cache });
    const follower = createService(new FakeEngine(["never"]), {
      cache,
      wait: async () => {
        polls += 1;

        // The leader finishes while the follower waits.
        if (polls === 2) {
          await cache.set("Popular?", "quick", { text: "Shared.", sources: [], label: "Gemini 3.8 Flash" });
        }
      },
    });

    expect((await planFor(leader, { question: "Popular?" })).cached).toBeUndefined();
    expect((await planFor(follower, { question: "Popular?" })).cached).toEqual({ text: "Shared.", sources: [], label: "Gemini 3.8 Flash" });
    expect(polls).toBe(2);
  });
});
