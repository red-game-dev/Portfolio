/**
 * @jest-environment node
 */
import { AnthropicProvider, ModelChunk, ModelProvider, ModelRequest, OpenAICompatibleProvider } from "@/packages/ai/engine";
import { ApiClient } from "@/packages/http/api-client";

import { fakeFetcher, SeenRequest, sse } from "../fixtures/streams";

const request: ModelRequest = {
  model: "m",
  maxTokens: 1200,
  effort: "low",
  system: [{ text: "Knowledge", cache: "1h" }, { text: "Short." }],
  messages: [{ role: "user", content: "Q" }],
  cacheKey: "ask-v1",
};

// A client that answers like the provider would, with the provider's own retries off so a refusal is seen once.
const clientFor = (responses: Array<{ status: number; body: string }>, seen: SeenRequest[] = []) => new ApiClient({}, fakeFetcher(responses, seen));

const chunksOf = async (provider: ModelProvider) => {
  const chunks: ModelChunk[] = [];

  for await (const chunk of provider.stream(request)) {
    chunks.push(chunk);
  }

  return chunks;
};

describe("AnthropicProvider", () => {
  test("posts a Messages body with the knowledge cached for an hour and effort as output_config", async () => {
    const seen: SeenRequest[] = [];

    await chunksOf(new AnthropicProvider({ apiKey: "key", client: clientFor([{ status: 200, body: sse([{ type: "message_stop" }]) }], seen) }));

    expect(seen[0].url).toBe("https://api.anthropic.com/v1/messages");
    expect(seen[0].headers).toMatchObject({ "x-api-key": "key", "anthropic-version": "2023-06-01" });
    expect(seen[0].body).toEqual({
      model: "m",
      max_tokens: 1200,
      stream: true,
      system: [{ type: "text", text: "Knowledge", cache_control: { type: "ephemeral", ttl: "1h" } }, { type: "text", text: "Short." }],
      messages: [{ role: "user", content: "Q" }],
      output_config: { effort: "low" },
    });
  });

  test("yields text, skips thinking and pings, and reports usage merged from message_start and message_delta", async () => {
    const body = sse([
      { type: "message_start", message: { usage: { input_tokens: 12, cache_creation_input_tokens: 0, cache_read_input_tokens: 22000, output_tokens: 1 } } },
      { type: "content_block_delta", delta: { type: "thinking_delta", thinking: "hmm" } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Hel" } },
      { type: "ping" },
      "not json",
      { type: "content_block_delta", delta: { type: "text_delta", text: "lo" } },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 40 } },
    ]);

    expect(await chunksOf(new AnthropicProvider({ apiKey: "k", client: clientFor([{ status: 200, body }]) }))).toEqual([
      { type: "text", text: "Hel" },
      { type: "text", text: "lo" },
      { type: "usage", usage: { input: 12, cacheWrite: 0, cacheRead: 22000, output: 40 } },
    ]);
  });

  test("a refusal throws with its status; an overloaded stream throws a retryable 529", async () => {
    const overloaded = sse([{ type: "error", error: { type: "overloaded_error", message: "Overloaded" } }]);

    await expect(chunksOf(new AnthropicProvider({ apiKey: "k", client: clientFor([{ status: 401, body: "{}" }]) })))
      .rejects.toMatchObject({ status: 401, isRetryable: false });
    await expect(chunksOf(new AnthropicProvider({ apiKey: "k", client: clientFor([{ status: 200, body: overloaded }]) })))
      .rejects.toMatchObject({ status: 529, isRetryable: true });
  });
});

describe("OpenAICompatibleProvider", () => {
  const create = (responses: Array<{ status: number; body: string }>, seen: SeenRequest[] = [], sendsCacheKey = false) => new OpenAICompatibleProvider({
    name: "gemini",
    apiKey: "key",
    baseURL: "https://api.example/v1/",
    maxTokensField: "max_completion_tokens",
    sendsCacheKey,
    client: clientFor(responses, seen),
  });

  test("posts one system message in order, asks for usage, maps effort and names the token limit the provider expects", async () => {
    const seen: SeenRequest[] = [];

    await chunksOf(create([{ status: 200, body: sse(["[DONE]"]) }], seen));

    expect(seen[0].url).toBe("https://api.example/v1/chat/completions");
    expect(seen[0].headers.authorization).toBe("Bearer key");
    expect(seen[0].body).toEqual({
      model: "m",
      stream: true,
      stream_options: { include_usage: true },
      max_completion_tokens: 1200,
      reasoning_effort: "low",
      messages: [{ role: "system", content: "Knowledge\n\nShort." }, { role: "user", content: "Q" }],
    });
  });

  test("sends the prompt cache key only to providers that take it", async () => {
    const seen: SeenRequest[] = [];

    await chunksOf(create([{ status: 200, body: sse(["[DONE]"]) }], seen, true));

    expect(seen[0].body.prompt_cache_key).toBe("ask-v1");
  });

  test("streams content, then usage with cached prompt tokens counted apart", async () => {
    const body = sse([
      { choices: [{ delta: { role: "assistant" } }] },
      { choices: [{ delta: { content: "Red " } }] },
      { choices: [{ delta: { content: "built it." } }] },
      { choices: [], usage: { prompt_tokens: 22000, completion_tokens: 60, prompt_tokens_details: { cached_tokens: 21000 } } },
      "[DONE]",
    ]);

    expect(await chunksOf(create([{ status: 200, body }]))).toEqual([
      { type: "text", text: "Red " },
      { type: "text", text: "built it." },
      { type: "usage", usage: { input: 1000, cacheWrite: 0, cacheRead: 21000, output: 60 } },
    ]);
  });

  test("a busy free tier is retried by its client before the stream starts", async () => {
    const seen: SeenRequest[] = [];
    const provider = new OpenAICompatibleProvider({
      name: "gemini",
      apiKey: "key",
      baseURL: "https://api.example/v1",
      client: new ApiClient({}, fakeFetcher([{ status: 429, body: "{}" }, { status: 200, body: sse([{ choices: [{ delta: { content: "ok" } }] }]) }], seen)),
    });

    expect((await chunksOf(provider))[0]).toEqual({ type: "text", text: "ok" });
    expect(seen).toHaveLength(2);
  });
});
