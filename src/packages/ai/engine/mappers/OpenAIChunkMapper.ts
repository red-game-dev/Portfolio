import { Mapper } from "@/packages/core/domain";

import { ModelError } from "../domain/errors";
import { ProviderSignal } from "../domain/types";
import { ChatCompletionChunk } from "../guards/openai";

// A Chat Completions stream chunk as what it means. Cached prompt tokens are reported inside prompt_tokens, so
// they are taken out of the input and counted apart, at the cached price.
export class OpenAIChunkMapper extends Mapper<ChatCompletionChunk, ProviderSignal> {
  public map(chunk: ChatCompletionChunk): ProviderSignal {
    if (chunk.error) {
      return { error: new ModelError(Number(chunk.error.code) || 0, chunk.error.message ?? "The model stream failed") };
    }

    const text = chunk.choices?.[0]?.delta?.content ?? undefined;
    const usage = chunk.usage;
    const cached = usage?.prompt_tokens_details?.cached_tokens ?? 0;

    return {
      ...(text ? { text } : {}),
      ...(usage ? { usage: { input: (usage.prompt_tokens ?? 0) - cached, cacheWrite: 0, cacheRead: cached, output: usage.completion_tokens ?? 0 } } : {}),
    };
  }
}
