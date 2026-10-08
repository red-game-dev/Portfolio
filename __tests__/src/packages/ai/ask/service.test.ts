/**
 * @jest-environment node
 */
import {
  AnswerCache,
  AnswerModel,
  AnthropicMessagesModel,
  AskEvent,
  AskGuards,
  AskPlan,
  AskRecord,
  AskRoute,
  AskService,
  AskServiceOptions,
  MemoryStore,
  ModelChunk,
  ModelError,
  ModelRequest
} from "@/packages/ai/ask";

type Script = Array<string | Error>;

// Plays one script per call: text chunks, or an error thrown at that point. Usage follows the text.
class FakeModel implements AnswerModel {
  public requests: ModelRequest[] = [];

  constructor(private readonly scripts: Script[]) {}

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

const price = { input: 1, cacheWrite: 2, cacheRead: 0.1, output: 5 };

const route = (model: AnswerModel, fields: Partial<AskRoute> = {}): AskRoute => ({
  provider: "fake",
  label: "Small",
  model,
  modelId: "small",
  maxTokens: 100,
  effort: "low",
  price,
  tier: "quick",
  ...fields,
});

// One model behind both depths: deep tries "large", then falls back to "small", like the real routes do.
const routesFor = (model: AnswerModel) => ({
  quick: [route(model)],
  deep: [route(model, { label: "Large", modelId: "large", maxTokens: 900, effort: "medium", tier: "deep" }), route(model)],
});

const createService = (model: AnswerModel, extra: Partial<AskServiceOptions> = {}) => new AskService({
  knowledge: "Rules and knowledge",
  promptCache: "1h",
  routes: routesFor(model),
  guidance: { quick: "Short.", deep: "Long." },
  sourceKeys: ["about", "history"],
  guards: createGuards().guards,
  resilience: { retries: 1, backoffMs: 1, waitForPeerMs: 40, pollMs: 10 },
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

const textOf = (events: AskEvent[]) => events.flatMap((event) => (event.type === "text" ? [event.text] : [])).join("");

const planFor = async (service: AskService, body: object) => {
  const prepared = await service.prepare(body, "client");

  if (!("plan" in prepared)) {
    throw new Error(`refused: ${prepared.error}`);
  }

  return prepared.plan;
};

const createCache = (store = new MemoryStore()) => new AnswerCache({ store, version: "v1", ttlMs: 60000, hash: (text) => text });

describe("AskService answering", () => {
  test("streams the answer, then the sources it named, then done, and records what it cost", async () => {
    const records: AskRecord[] = [];
    const { guards, spent } = createGuards();
    const service = createService(new FakeModel([["Red led ", "it — well.", "\n[[sources: history]]"]]), { guards, onRecord: (record) => records.push(record) });
    const events = await collect(service.answer(await planFor(service, { question: "What did he lead?" })));

    expect(textOf(events).trim()).toBe("Red led it, well.");
    expect(events[0]).toEqual({ type: "model", label: "Small" });
    expect(events.slice(-2)).toEqual([{ type: "sources", keys: ["history"] }, { type: "done" }]);
    // 100 * 1 + 1000 * 0.1 + 50 * 5 micro dollars.
    expect(spent).toEqual([450]);
    expect(records[0]).toMatchObject({ outcome: "answered", provider: "fake", model: "small", attempts: 1, costMicros: 450 });
    expect(records[0]).toMatchObject({ sources: ["history"], isFirstQuestion: true });
  });

  test("sends the knowledge as a cached block, the guidance after it, and the history before the question", async () => {
    const model = new FakeModel([["ok"]]);
    const service = createService(model);

    await collect(service.answer({ request: { question: "More?", depth: "deep", history: [{ question: "Q", answer: "A" }] } }));

    expect(model.requests[0]).toEqual({
      model: "large",
      maxTokens: 900,
      effort: "medium",
      system: [{ text: "Rules and knowledge", cache: "1h" }, { text: "Long." }],
      messages: [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
        { role: "user", content: "More?" },
      ],
    });
  });

  test("retries an overloaded model before the first word, then falls back to the quick model", async () => {
    const model = new FakeModel([[new ModelError(529, "overloaded")], [new ModelError(429, "limited")], ["Quick answer."]]);
    const records: AskRecord[] = [];
    const service = createService(model, { onRecord: (record) => records.push(record) });
    const events = await collect(service.answer({ request: { question: "Q", depth: "deep", history: [] } }));

    expect(model.requests.map((request) => request.model)).toEqual(["large", "large", "small"]);
    expect(textOf(events)).toBe("Quick answer.");
    expect(records[0]).toMatchObject({ outcome: "answered", model: "small", attempts: 3 });
  });

  test("a provider that refuses outright, such as on a bad key, is skipped for the next one without a retry", async () => {
    const free = new FakeModel([[new ModelError(401, "bad key")]]);
    const paid = new FakeModel([["From the paid one."]]);
    const quick = [route(free, { provider: "free", label: "Free" }), route(paid, { provider: "paid", label: "Paid" })];
    const service = createService(free, { routes: { quick, deep: [] } });
    const events = await collect(service.answer({ request: { question: "Q", depth: "quick", history: [] } }));

    expect(free.requests).toHaveLength(1);
    expect(events.slice(0, 2)).toEqual([{ type: "model", label: "Paid" }, { type: "text", text: "From the paid one." }]);
  });

  test("never retries once words are shown, and never retries what cannot succeed", async () => {
    const midway = new FakeModel([["Half", new ModelError(529, "overloaded")]]);
    const refused = new FakeModel([[new ModelError(400, "bad request")]]);

    expect(await collect(createService(midway).answer({ request: { question: "Q", depth: "quick", history: [] } })))
      .toEqual([{ type: "model", label: "Small" }, { type: "text", text: "Half" }, { type: "error", code: "failed" }]);
    expect(midway.requests).toHaveLength(1);

    await collect(createService(refused).answer({ request: { question: "Q", depth: "quick", history: [] } }));
    expect(refused.requests).toHaveLength(1);
  });

  test("a reader who stops gets no error, and the answer is logged as stopped", async () => {
    const controller = new AbortController();
    const records: AskRecord[] = [];
    const model: AnswerModel = {
      async* stream() {
        yield { type: "text", text: "Start" };
        controller.abort();
        throw new ModelError(0, "aborted");
      },
    };
    const events = await collect(createService(model, { onRecord: (record) => records.push(record) })
      .answer({ request: { question: "Q", depth: "quick", history: [] } }, controller.signal));

    expect(events).toEqual([{ type: "model", label: "Small" }, { type: "text", text: "Start" }]);
    expect(records[0].outcome).toBe("stopped");
  });
});

describe("AskService guarding", () => {
  test("refuses before any model call: an invalid request, a visitor over the limit, everyone over the limit, an empty budget", async () => {
    const model = new FakeModel([["never"]]);
    const refuse = () => ({ take: () => Promise.resolve(false) });
    const cases: Array<[Partial<AskGuards>, object, string]> = [
      [{}, { question: "" }, "invalid"],
      [{ visitor: { quick: refuse(), deep: allowAll() } }, { question: "Hi" }, "limited"],
      [{ everyone: { quick: allowAll(), deep: refuse() } }, { question: "Hi", depth: "deep" }, "limited"],
      [{ budget: { hasRoom: () => Promise.resolve(false), spend: () => Promise.resolve() } }, { question: "Hi" }, "unavailable"],
    ];

    for (const [overrides, body, error] of cases) {
      expect(await createService(model, { guards: createGuards(overrides).guards }).prepare(body, "c")).toEqual({ error });
    }

    expect(model.requests).toHaveLength(0);
  });

  test("a first question already answered is served from the shared cache, without the model or the budget", async () => {
    const store = new MemoryStore();
    const model = new FakeModel([["Cached once.", "[[sources: about]]"]]);
    const everyone = { take: jest.fn(() => Promise.resolve(true)) };
    const first = createService(model, { cache: createCache(store) });
    const second = createService(model, { cache: createCache(store), guards: createGuards({ everyone: { quick: everyone, deep: everyone } }).guards });

    await collect(first.answer(await planFor(first, { question: "What has Red built?" })));

    const plan: AskPlan = await planFor(second, { question: "  what has red built " });
    const events = await collect(second.answer(plan));

    expect(plan.cached).toEqual({ text: "Cached once.", sources: ["about"], label: "Small" });
    expect(events).toEqual([
      { type: "model", label: "Small" },
      { type: "text", text: "Cached once." },
      { type: "sources", keys: ["about"] },
      { type: "done" },
    ]);
    expect(model.requests).toHaveLength(1);
    expect(everyone.take).not.toHaveBeenCalled();
  });

  test("follow ups and fallback answers are never cached", async () => {
    const store = new MemoryStore();
    const service = createService(new FakeModel([[new ModelError(529, "x")], [new ModelError(529, "x")], ["fallback"]]), { cache: createCache(store) });

    await collect(service.answer({ request: { question: "Deep one", depth: "deep", history: [] } }));
    await collect(service.answer({ request: { question: "Follow up", depth: "quick", history: [{ question: "Q", answer: "A" }] } }));

    expect(await createCache(store).get("Deep one", "deep")).toBeNull();
    expect(await createCache(store).get("Follow up", "quick")).toBeNull();
  });

  test("when many ask the same first question at once, only one calls the model and the rest wait for its answer", async () => {
    const store = new MemoryStore();
    const cache = createCache(store);
    let polls = 0;
    const leader = createService(new FakeModel([["Shared."]]), { cache });
    const follower = createService(new FakeModel([["never"]]), {
      cache,
      wait: async () => {
        polls += 1;

        // The leader finishes while the follower waits.
        if (polls === 2) {
          await cache.set("Popular?", "quick", { text: "Shared.", sources: [], label: "Small" });
        }
      },
    });

    expect((await planFor(leader, { question: "Popular?" })).cached).toBeUndefined();
    expect((await planFor(follower, { question: "Popular?" })).cached).toEqual({ text: "Shared.", sources: [], label: "Small" });
    expect(polls).toBe(2);
  });
});

describe("AnthropicMessagesModel", () => {
  const sse = (events: object[]) => events.map((event) => `event: x\ndata: ${JSON.stringify(event)}\n\n`).join("");

  const fetcherFor = (status: number, body: string, seen: { init?: RequestInit }) => (async (_url: unknown, init?: RequestInit) => {
    seen.init = init;

    return new Response(status === 200 ? body : "{}", { status });
  }) as unknown as typeof fetch;

  const request: ModelRequest = { model: "m", maxTokens: 10, system: [{ text: "K", cache: "1h" }, { text: "G" }], messages: [{ role: "user", content: "Q" }] };

  const chunksOf = async (model: AnthropicMessagesModel) => {
    const chunks: ModelChunk[] = [];

    for await (const chunk of model.stream(request)) {
      chunks.push(chunk);
    }

    return chunks;
  };

  test("yields text, then usage merged from message_start and message_delta, and caches the knowledge for an hour", async () => {
    const seen: { init?: RequestInit } = {};
    const body = sse([
      { type: "message_start", message: { usage: { input_tokens: 12, cache_creation_input_tokens: 0, cache_read_input_tokens: 22000, output_tokens: 1 } } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Hel" } },
      { type: "ping" },
      { type: "content_block_delta", delta: { type: "text_delta", text: "lo" } },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 40 } },
      { type: "message_stop" },
    ]);
    const chunks = await chunksOf(new AnthropicMessagesModel({ apiKey: "key", fetcher: fetcherFor(200, body, seen) }));
    const sent = JSON.parse(String(seen.init?.body));

    expect(chunks).toEqual([
      { type: "text", text: "Hel" },
      { type: "text", text: "lo" },
      { type: "usage", usage: { input: 12, cacheWrite: 0, cacheRead: 22000, output: 40 } },
    ]);
    expect((seen.init?.headers as Record<string, string>)["x-api-key"]).toBe("key");
    expect(sent.system).toEqual([
      { type: "text", text: "K", cache_control: { type: "ephemeral", ttl: "1h" } },
      { type: "text", text: "G" },
    ]);
  });

  test("a refused call throws with its status; an overloaded stream throws a retryable 529", async () => {
    const refused = new AnthropicMessagesModel({ apiKey: "k", fetcher: fetcherFor(429, "", {}) });
    const overloadedStream = sse([{ type: "error", error: { type: "overloaded_error", message: "Overloaded" } }]);
    const overloaded = new AnthropicMessagesModel({ apiKey: "k", fetcher: fetcherFor(200, overloadedStream, {}) });

    await expect(refused.stream(request).next()).rejects.toMatchObject({ status: 429, isRetryable: true });
    await expect(chunksOf(overloaded)).rejects.toMatchObject({ status: 529, isRetryable: true });
  });
});
