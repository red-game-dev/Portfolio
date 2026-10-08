import { ApiClient } from "@/packages/http/api-client";

import { MODEL_HTTP_RETRY, MODEL_HTTP_TIMEOUT_MS } from "../config/resilience";
import { StreamingProvider } from "../core/StreamingProvider";
import { ModelRequest, ProviderSignal } from "../domain/types";
import { ChatCompletionChunk, isChatCompletionChunk } from "../guards/openai";
import { OpenAIChunkMapper } from "../mappers/OpenAIChunkMapper";
import { OpenAIRequestMapper, OpenAIRequestOptions } from "../mappers/OpenAIRequestMapper";

export interface OpenAICompatibleProviderOptions extends OpenAIRequestOptions {
  // How it is named in reports, such as "openai" or "gemini".
  name: string;
  apiKey: string;
  // For example https://api.openai.com/v1, or Gemini's https://generativelanguage.googleapis.com/v1beta/openai.
  baseURL: string;
  // The client its own instance is made from: the global one unless another is given.
  client?: ApiClient;
}

// Any provider on OpenAI's Chat Completions API: OpenAI itself, Google Gemini, Groq, OpenRouter, Mistral and
// the rest.
export class OpenAICompatibleProvider extends StreamingProvider<ChatCompletionChunk> {
  public readonly name: string;
  private readonly requests: OpenAIRequestMapper;
  private readonly chunks = new OpenAIChunkMapper();

  constructor(options: OpenAICompatibleProviderOptions) {
    super((options.client ?? ApiClient.global()).withConfig({
      baseURL: options.baseURL.replace(/\/$/, ""),
      headers: { authorization: `Bearer ${options.apiKey}` },
      timeout: MODEL_HTTP_TIMEOUT_MS,
      retry: MODEL_HTTP_RETRY,
    }));
    this.name = options.name;
    this.requests = new OpenAIRequestMapper(options);
  }

  protected path(): string {
    return "/chat/completions";
  }

  protected body(request: ModelRequest): unknown {
    return this.requests.map(request);
  }

  protected isEvent(value: unknown): value is ChatCompletionChunk {
    return isChatCompletionChunk(value);
  }

  protected toSignal(chunk: ChatCompletionChunk): ProviderSignal {
    return this.chunks.map(chunk);
  }
}
