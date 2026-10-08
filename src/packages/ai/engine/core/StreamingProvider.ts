import { parseJson } from "@/packages/core/domain";
import type { ApiClient } from "@/packages/http/api-client";

import { ModelError } from "../domain/errors";
import { ModelChunk, ModelProvider, ModelRequest, ProviderSignal, TokenUsage } from "../domain/types";
import { NO_USAGE } from "../utils/cost";
import { readServerEvents } from "./streams";

const DONE = "[DONE]";

// Everything a provider that streams server sent events has in common: post the mapped request through its API
// client, read the events, check each with the provider's guard, map it to what it means, and report the usage
// last. A provider only says which path to call and how its request and events map; its client carries the base
// URL, the auth headers and the retry rules.
export abstract class StreamingProvider<TEvent> implements ModelProvider {
  private readonly client: ApiClient;
  public abstract readonly name: string;

  protected constructor(client: ApiClient) {
    this.client = client;
  }

  public async* stream(request: ModelRequest, signal?: AbortSignal): AsyncGenerator<ModelChunk> {
    const result = await this.client.postStream(this.path(), this.body(request), { signal });

    if (!result.ok) {
      throw new ModelError(result.status, `${this.name} refused the call: ${result.message}`);
    }

    let usage: TokenUsage = NO_USAGE;

    for await (const data of readServerEvents(result.data)) {
      const event = data === DONE ? undefined : parseJson(data);

      if (!this.isEvent(event)) {
        continue;
      }

      const meaning = this.toSignal(event);

      if (meaning.error) {
        throw meaning.error;
      }

      usage = meaning.usage ? { ...usage, ...meaning.usage } : usage;

      if (meaning.text) {
        yield { type: "text", text: meaning.text };
      }
    }

    yield { type: "usage", usage };
  }

  protected abstract path(): string;

  protected abstract body(request: ModelRequest): unknown;

  protected abstract isEvent(value: unknown): value is TEvent;

  protected abstract toSignal(event: TEvent): ProviderSignal;
}
