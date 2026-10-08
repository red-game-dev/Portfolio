import { ModelError } from "../domain/errors";
import { AnswerModel, ModelChunk, ModelRequest, TokenUsage } from "../domain/types";
import { EventStreamParser } from "../utils/eventStream";

export interface AnthropicModelOptions {
  apiKey: string;
  endpoint?: string;
  version?: string;
  fetcher?: typeof fetch;
}

interface RawUsage {
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

interface StreamEvent {
  type?: string;
  message?: { usage?: RawUsage };
  usage?: RawUsage;
  delta?: { type?: string; text?: string };
  error?: { type?: string; message?: string };
}

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

// message_start carries the input side, message_delta the running output total; a later count replaces an
// earlier one, since both are cumulative.
const mergeUsage = (usage: TokenUsage, raw: RawUsage | undefined): TokenUsage => ({
  input: raw?.input_tokens ?? usage.input,
  cacheWrite: raw?.cache_creation_input_tokens ?? usage.cacheWrite,
  cacheRead: raw?.cache_read_input_tokens ?? usage.cacheRead,
  output: raw?.output_tokens ?? usage.output,
});

// Claude through the Messages API, streamed. Cached system blocks are marked for prompt caching with their
// time to live; the usage arrives as the last chunk so the caller can price the call.
export class AnthropicMessagesModel implements AnswerModel {
  private readonly options: AnthropicModelOptions;

  constructor(options: AnthropicModelOptions) {
    this.options = options;
  }

  public async* stream(request: ModelRequest, signal?: AbortSignal): AsyncGenerator<ModelChunk> {
    const fetcher = this.options.fetcher ?? fetch;
    const response = await fetcher(this.options.endpoint ?? ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.options.apiKey,
        "anthropic-version": this.options.version ?? VERSION,
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens,
        stream: true,
        system: request.system.map((block) => ({
          type: "text",
          text: block.text,
          ...(block.cache ? { cache_control: { type: "ephemeral", ...(block.cache === "1h" ? { ttl: "1h" } : {}) } } : {}),
        })),
        messages: request.messages,
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
        const event = JSON.parse(data) as StreamEvent;

        if (event.type === "error") {
          throw new ModelError(event.error?.type === "overloaded_error" ? 529 : 0, event.error?.message ?? "The model stream failed");
        }

        if (event.type === "message_start") {
          usage = mergeUsage(usage, event.message?.usage);
        }

        if (event.type === "message_delta") {
          usage = mergeUsage(usage, event.usage);
        }

        if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
          yield { type: "text", text: event.delta.text };
        }
      }
    }
  }
}
