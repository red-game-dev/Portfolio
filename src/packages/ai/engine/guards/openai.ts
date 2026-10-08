import { Guard, isRecord } from "@/packages/core/domain";

// The parts of a Chat Completions stream chunk the engine reads.
export interface ChatCompletionChunk {
  choices?: Array<{ delta?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  } | null;
  error?: { message?: string; code?: number | string };
}

export const isChatCompletionChunk: Guard<ChatCompletionChunk> = (value): value is ChatCompletionChunk => isRecord(value)
  && (value.choices === undefined || Array.isArray(value.choices))
  && (value.usage === undefined || value.usage === null || isRecord(value.usage))
  && (value.error === undefined || isRecord(value.error));
