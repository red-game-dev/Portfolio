/**
 * @jest-environment node
 */
import { ModelChunk, ModelRequest, OpenAICompatibleModel } from "@/packages/ai/ask";

const sse = (chunks: Array<object | string>) => chunks.map((chunk) => `data: ${typeof chunk === "string" ? chunk : JSON.stringify(chunk)}\n\n`).join("");

const request: ModelRequest = {
  model: "gemini-3.8-flash",
  maxTokens: 1200,
  effort: "low",
  system: [{ text: "Rules", cache: "1h" }, { text: "Short." }],
  messages: [{ role: "user", content: "Q" }],
};

const run = async (status: number, body: string, field?: "max_tokens" | "max_completion_tokens") => {
  const seen: { url?: string; init?: RequestInit } = {};
  const fetcher = (async (url: string, init?: RequestInit) => {
    seen.url = url;
    seen.init = init;

    return new Response(body, { status });
  }) as unknown as typeof fetch;
  const model = new OpenAICompatibleModel({ apiKey: "key", baseUrl: "https://api.example/v1/", maxTokensField: field, fetcher });
  const chunks: ModelChunk[] = [];

  for await (const chunk of model.stream(request)) {
    chunks.push(chunk);
  }

  return { chunks, seen, sent: JSON.parse(String(seen.init?.body)) as Record<string, unknown> };
};

describe("OpenAICompatibleModel", () => {
  test("streams content deltas, then usage with cached prompt tokens apart", async () => {
    const { chunks } = await run(200, sse([
      { choices: [{ delta: { role: "assistant" } }] },
      { choices: [{ delta: { content: "Red " } }] },
      { choices: [{ delta: { content: "built it." } }] },
      { choices: [], usage: { prompt_tokens: 22000, completion_tokens: 60, prompt_tokens_details: { cached_tokens: 21000 } } },
      "[DONE]",
    ]));

    expect(chunks).toEqual([
      { type: "text", text: "Red " },
      { type: "text", text: "built it." },
      { type: "usage", usage: { input: 1000, cacheWrite: 0, cacheRead: 21000, output: 60 } },
    ]);
  });

  test("sends one system message, asks for usage, maps effort, and names the token limit the provider expects", async () => {
    const { seen, sent } = await run(200, sse(["[DONE]"]), "max_completion_tokens");

    expect(seen.url).toBe("https://api.example/v1/chat/completions");
    expect((seen.init?.headers as Record<string, string>).authorization).toBe("Bearer key");
    expect(sent).toMatchObject({
      model: "gemini-3.8-flash",
      stream: true,
      stream_options: { include_usage: true },
      max_completion_tokens: 1200,
      reasoning_effort: "low",
      messages: [{ role: "system", content: "Rules\n\nShort." }, { role: "user", content: "Q" }],
    });
    expect(sent.max_tokens).toBeUndefined();
  });

  test("a refused call throws with its status, so a busy free tier is retried and a bad key moves on", async () => {
    await expect(run(429, "{}")).rejects.toMatchObject({ status: 429, isRetryable: true });
    await expect(run(401, "{}")).rejects.toMatchObject({ status: 401, isRetryable: false });
  });
});
