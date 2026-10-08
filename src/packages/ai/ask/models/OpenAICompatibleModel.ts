import { ModelError } from "../domain/errors";
import { AnswerModel, ModelChunk, ModelRequest, TokenUsage } from "../domain/types";
import { EventStreamParser } from "../utils/eventStream";

export interface OpenAICompatibleOptions {
  apiKey: string;
  // For example https://api.openai.com/v1, or Gemini's https://generativelanguage.googleapis.com/v1beta/openai.
  baseUrl: string;
  // OpenAI's reasoning models take max_completion_tokens; most compatible APIs still take max_tokens.
  maxTokensField?: "max_tokens" | "max_completion_tokens";
  fetcher?: typeof fetch;
}

interface ChatChunk {
  choices?: Array<{ delta?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  } | null;
  error?: { message?: string; code?: number | string };
}

const DONE = "[DONE]";

// Any provider that speaks OpenAI's Chat Completions API: OpenAI itself, Google Gemini, Groq, OpenRouter,
// Mistral and the rest. The system blocks become one system message; these providers cache a repeated prefix
// on their own, so the cache marks are not needed. Effort maps onto reasoning_effort, and cached prompt tokens
// are reported apart so the call is priced right.
export class OpenAICompatibleModel implements AnswerModel {
  private readonly options: OpenAICompatibleOptions;

  constructor(options: OpenAICompatibleOptions) {
    this.options = options;
  }

  public async* stream(request: ModelRequest, signal?: AbortSignal): AsyncGenerator<ModelChunk> {
    const fetcher = this.options.fetcher ?? fetch;
    const response = await fetcher(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${this.options.apiKey}` },
      body: JSON.stringify({
        model: request.model,
        stream: true,
        stream_options: { include_usage: true },
        [this.options.maxTokensField ?? "max_tokens"]: request.maxTokens,
        ...(request.effort ? { reasoning_effort: request.effort } : {}),
        messages: [{ role: "system", content: request.system.map((block) => block.text).join("\n\n") }, ...request.messages],
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new ModelError(response.status, `The model refused the call with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = new EventStreamParser();
    let usage: TokenUsage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        yield { type: "usage", usage };

        return;
      }

      for (const data of parser.push(decoder.decode(value, { stream: true }))) {
        if (data === DONE) {
          continue;
        }

        const chunk = JSON.parse(data) as ChatChunk;

        if (chunk.error) {
          throw new ModelError(Number(chunk.error.code) || 0, chunk.error.message ?? "The model stream failed");
        }

        if (chunk.usage) {
          const cached = chunk.usage.prompt_tokens_details?.cached_tokens ?? 0;

          usage = { input: (chunk.usage.prompt_tokens ?? 0) - cached, cacheWrite: 0, cacheRead: cached, output: chunk.usage.completion_tokens ?? 0 };
        }

        const text = chunk.choices?.[0]?.delta?.content;

        if (text) {
          yield { type: "text", text };
        }
      }
    }
  }
}
