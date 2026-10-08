import { ModelError } from "../domain/errors";
import { AnswerModel, ModelRequest } from "../domain/types";
import { EventStreamParser } from "../utils/eventStream";

export interface AnthropicModelOptions {
  apiKey: string;
  endpoint?: string;
  version?: string;
  fetcher?: typeof fetch;
}

interface StreamEvent {
  type?: string;
  delta?: { type?: string; text?: string };
  error?: { message?: string };
}

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

// Claude through the Messages API, streamed. A cached system block is marked for prompt caching, so the
// knowledge base is paid for in full once and read back at a fraction of the price while it stays warm.
export class AnthropicMessagesModel implements AnswerModel {
  private readonly options: AnthropicModelOptions;

  constructor(options: AnthropicModelOptions) {
    this.options = options;
  }

  public async* stream(request: ModelRequest, signal?: AbortSignal): AsyncGenerator<string> {
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
          ...(block.isCached ? { cache_control: { type: "ephemeral" } } : {}),
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

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      for (const data of parser.push(decoder.decode(value, { stream: true }))) {
        const event = JSON.parse(data) as StreamEvent;

        if (event.type === "error") {
          throw new ModelError(0, event.error?.message ?? "The model stream failed");
        }

        if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
          yield event.delta.text;
        }
      }
    }
  }
}
