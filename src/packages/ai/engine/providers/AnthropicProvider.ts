import { ApiClient } from "@/packages/http/api-client";

import { MODEL_HTTP_RETRY, MODEL_HTTP_TIMEOUT_MS } from "../config/resilience";
import { StreamingProvider } from "../core/StreamingProvider";
import { ModelRequest, ProviderSignal } from "../domain/types";
import { AnthropicStreamEvent, isAnthropicStreamEvent } from "../guards/anthropic";
import { AnthropicEventMapper } from "../mappers/AnthropicEventMapper";
import { AnthropicRequestMapper } from "../mappers/AnthropicRequestMapper";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseURL?: string;
  version?: string;
  // The client its own instance is made from: the global one unless another is given.
  client?: ApiClient;
}

// Claude, through the Messages API.
export class AnthropicProvider extends StreamingProvider<AnthropicStreamEvent> {
  public readonly name = "anthropic";
  private readonly requests = new AnthropicRequestMapper();
  private readonly events = new AnthropicEventMapper();

  constructor(options: AnthropicProviderOptions) {
    super((options.client ?? ApiClient.global()).withConfig({
      baseURL: options.baseURL ?? "https://api.anthropic.com",
      headers: { "x-api-key": options.apiKey, "anthropic-version": options.version ?? "2023-06-01" },
      timeout: MODEL_HTTP_TIMEOUT_MS,
      retry: MODEL_HTTP_RETRY,
    }));
  }

  protected path(): string {
    return "/v1/messages";
  }

  protected body(request: ModelRequest): unknown {
    return this.requests.map(request);
  }

  protected isEvent(value: unknown): value is AnthropicStreamEvent {
    return isAnthropicStreamEvent(value);
  }

  protected toSignal(event: AnthropicStreamEvent): ProviderSignal {
    return this.events.map(event);
  }
}
