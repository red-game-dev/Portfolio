import { Guard, isRecord, isText } from "@/packages/core/domain";

export interface AnthropicUsage {
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

// The parts of a Messages API stream event the engine reads.
export interface AnthropicStreamEvent {
  type: string;
  message?: { usage?: AnthropicUsage };
  usage?: AnthropicUsage;
  delta?: { type?: string; text?: string };
  error?: { type?: string; message?: string };
}

export const isAnthropicStreamEvent: Guard<AnthropicStreamEvent> = (value): value is AnthropicStreamEvent => isRecord(value) && isText(value.type);
