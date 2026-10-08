import { Mapper } from "@/packages/core/domain";

import { ModelRequest } from "../domain/types";

export interface OpenAIRequestOptions {
  // OpenAI's reasoning models take max_completion_tokens; most compatible APIs still take max_tokens.
  maxTokensField?: "max_tokens" | "max_completion_tokens";
  // OpenAI routes requests with the same prompt_cache_key to the same cache; others may reject the field.
  sendsCacheKey?: boolean;
}

// A request in the engine's terms as a Chat Completions body: the system blocks become one system message, in
// order, so the long unchanging prefix the provider caches stays first. Usage is asked for in the stream.
export class OpenAIRequestMapper extends Mapper<ModelRequest, Record<string, unknown>> {
  private readonly options: OpenAIRequestOptions;

  constructor(options: OpenAIRequestOptions = {}) {
    super();
    this.options = options;
  }

  public map(request: ModelRequest): Record<string, unknown> {
    return {
      model: request.model,
      stream: true,
      stream_options: { include_usage: true },
      [this.options.maxTokensField ?? "max_tokens"]: request.maxTokens,
      ...(request.effort ? { reasoning_effort: request.effort } : {}),
      ...(this.options.sendsCacheKey && request.cacheKey ? { prompt_cache_key: request.cacheKey } : {}),
      messages: [{ role: "system", content: request.system.map((block) => block.text).join("\n\n") }, ...request.messages],
    };
  }
}
