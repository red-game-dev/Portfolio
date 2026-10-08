/**
 * @jest-environment node
 */
import { AnswerModel, AnthropicMessagesModel, AskEvent, AskService, ModelError, ModelRequest } from "@/packages/ai/ask";

class FakeModel implements AnswerModel {
  public requests: ModelRequest[] = [];

  constructor(private readonly chunks: string[], private readonly failAfter = Infinity) {}

  public async* stream(request: ModelRequest): AsyncGenerator<string> {
    this.requests.push(request);

    for (const [index, chunk] of this.chunks.entries()) {
      if (index >= this.failAfter) {
        throw new ModelError(0, "broke");
      }

      yield chunk;
    }
  }
}

const createService = (model: AnswerModel, allow = () => true) => new AskService({
  model,
  knowledge: "Rules and knowledge",
  models: {
    quick: { model: "small", maxTokens: 100, guidance: "Short." },
    deep: { model: "large", maxTokens: 900, guidance: "Long." },
  },
  sourceKeys: ["about", "history"],
  allow,
});

const collect = async (events: AsyncIterable<AskEvent>) => {
  const all: AskEvent[] = [];

  for await (const event of events) {
    all.push(event);
  }

  return all;
};

describe("AskService", () => {
  test("streams the answer, then the sources it named, then done", async () => {
    const model = new FakeModel(["Red led ", "it — well.", "\n[[sources: history]]"]);
    const service = createService(model);
    const prepared = service.prepare({ question: "What did he lead?" }, "client");

    if (!("request" in prepared)) {
      throw new Error("expected a request");
    }

    const events = await collect(service.answer(prepared.request));
    const text = events.flatMap((event) => (event.type === "text" ? [event.text] : [])).join("");

    expect(text.trim()).toBe("Red led it, well.");
    expect(events.slice(-2)).toEqual([{ type: "sources", keys: ["history"] }, { type: "done" }]);
  });

  test("picks the model and guidance for the depth, caches the knowledge and replays the history", async () => {
    const model = new FakeModel(["ok"]);
    const service = createService(model);

    await collect(service.answer({ question: "More?", depth: "deep", history: [{ question: "Q", answer: "A" }] }));

    const [request] = model.requests;

    expect(request.model).toBe("large");
    expect(request.maxTokens).toBe(900);
    expect(request.system).toEqual([{ text: "Rules and knowledge", isCached: true }, { text: "Long." }]);
    expect(request.messages).toEqual([
      { role: "user", content: "Q" },
      { role: "assistant", content: "A" },
      { role: "user", content: "More?" },
    ]);
  });

  test("a model that fails midway ends in an error, not done", async () => {
    const events = await collect(createService(new FakeModel(["Half", "rest"], 1)).answer({ question: "Q", depth: "quick", history: [] }));

    expect(events).toEqual([{ type: "text", text: "Half" }, { type: "error", code: "failed" }]);
  });

  test("refuses an invalid request and one over the limit before any model is called", () => {
    const model = new FakeModel([]);

    expect(createService(model).prepare({ question: "" }, "c")).toEqual({ error: "invalid" });
    expect(createService(model, () => false).prepare({ question: "Hi" }, "c")).toEqual({ error: "limited" });
    expect(model.requests).toHaveLength(0);
  });
});

describe("AnthropicMessagesModel", () => {
  const sse = (events: object[]) => events.map((event) => `event: x\ndata: ${JSON.stringify(event)}\n\n`).join("");

  const fetcherFor = (status: number, body: string, seen: { init?: RequestInit }) => (async (_url: unknown, init?: RequestInit) => {
    seen.init = init;

    return new Response(status === 200 ? body : "{}", { status });
  }) as unknown as typeof fetch;

  const request: ModelRequest = { model: "m", maxTokens: 10, system: [{ text: "K", isCached: true }, { text: "G" }], messages: [{ role: "user", content: "Q" }] };

  test("yields text deltas and sends the cached system block with cache control", async () => {
    const seen: { init?: RequestInit } = {};
    const body = sse([
      { type: "message_start" },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Hel" } },
      { type: "ping" },
      { type: "content_block_delta", delta: { type: "text_delta", text: "lo" } },
      { type: "message_stop" },
    ]);
    const model = new AnthropicMessagesModel({ apiKey: "key", fetcher: fetcherFor(200, body, seen) });
    const chunks: string[] = [];

    for await (const chunk of model.stream(request)) {
      chunks.push(chunk);
    }

    const sent = JSON.parse(String(seen.init?.body));

    expect(chunks.join("")).toBe("Hello");
    expect((seen.init?.headers as Record<string, string>)["x-api-key"]).toBe("key");
    expect(sent.stream).toBe(true);
    expect(sent.system).toEqual([
      { type: "text", text: "K", cache_control: { type: "ephemeral" } },
      { type: "text", text: "G" },
    ]);
  });

  test("a refused call or an error event throws a ModelError", async () => {
    const refused = new AnthropicMessagesModel({ apiKey: "k", fetcher: fetcherFor(429, "", {}) });
    const broken = new AnthropicMessagesModel({ apiKey: "k", fetcher: fetcherFor(200, sse([{ type: "error", error: { message: "overloaded" } }]), {}) });

    await expect(refused.stream(request).next()).rejects.toMatchObject({ status: 429 });
    await expect(broken.stream(request).next()).rejects.toThrow("overloaded");
  });
});
