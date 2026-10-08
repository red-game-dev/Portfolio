import { Mapper } from "@/packages/core/domain";

import { ModelError } from "../domain/errors";
import { ProviderSignal, TokenUsage } from "../domain/types";
import { AnthropicStreamEvent, AnthropicUsage } from "../guards/anthropic";

const toUsage = (raw: AnthropicUsage | undefined): Partial<TokenUsage> | undefined => raw && {
  ...(raw.input_tokens === undefined ? {} : { input: raw.input_tokens }),
  ...(raw.cache_creation_input_tokens === undefined ? {} : { cacheWrite: raw.cache_creation_input_tokens }),
  ...(raw.cache_read_input_tokens === undefined ? {} : { cacheRead: raw.cache_read_input_tokens }),
  ...(raw.output_tokens === undefined ? {} : { output: raw.output_tokens }),
};

// A Messages API stream event as what it means: message_start carries the input side, message_delta the running
// output total, text deltas the answer. Thinking deltas are never shown.
export class AnthropicEventMapper extends Mapper<AnthropicStreamEvent, ProviderSignal> {
  public map(event: AnthropicStreamEvent): ProviderSignal {
    switch (event.type) {
      case "error":
        return { error: new ModelError(event.error?.type === "overloaded_error" ? 529 : 0, event.error?.message ?? "The model stream failed") };
      case "message_start":
        return { usage: toUsage(event.message?.usage) };
      case "message_delta":
        return { usage: toUsage(event.usage) };
      case "content_block_delta":
        return event.delta?.type === "text_delta" && event.delta.text ? { text: event.delta.text } : {};
      default:
        return {};
    }
  }
}
