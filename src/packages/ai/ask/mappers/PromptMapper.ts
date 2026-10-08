import type { EngineRequest, Message, SystemBlock } from "@/packages/ai/engine";
import { Mapper } from "@/packages/core/domain";

import { AskDepth, AskRequest } from "../domain/types";

export interface PromptOptions {
  // The rules and the knowledge, one block, first, so every provider's cache can hold it.
  knowledge: string;
  // Per depth, added after the knowledge so it never breaks the cached prefix.
  guidance: Record<AskDepth, string>;
  cache?: SystemBlock["cache"];
  // Groups calls that share the knowledge, for providers that route on it to their cache.
  cacheKey?: string;
}

// A question as an engine request: the cached knowledge, the depth's guidance, the history and the question.
export class PromptMapper extends Mapper<AskRequest, EngineRequest> {
  private readonly options: PromptOptions;

  constructor(options: PromptOptions) {
    super();
    this.options = options;
  }

  public map(request: AskRequest): EngineRequest {
    const messages: Message[] = [
      ...request.history.flatMap((turn): Message[] => [
        { role: "user", content: turn.question },
        { role: "assistant", content: turn.answer },
      ]),
      { role: "user", content: request.question },
    ];

    return {
      tier: request.depth,
      system: [{ text: this.options.knowledge, cache: this.options.cache ?? "5m" }, { text: this.options.guidance[request.depth] }],
      messages,
      cacheKey: this.options.cacheKey,
    };
  }
}
