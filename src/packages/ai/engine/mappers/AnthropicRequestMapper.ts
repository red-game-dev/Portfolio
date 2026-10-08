import { Mapper } from "@/packages/core/domain";

import { ModelRequest } from "../domain/types";

// A request in the engine's terms as a Messages API body: cached blocks carry cache_control with their time to
// live, and effort becomes output_config.
export class AnthropicRequestMapper extends Mapper<ModelRequest, Record<string, unknown>> {
  public map(request: ModelRequest): Record<string, unknown> {
    return {
      model: request.model,
      max_tokens: request.maxTokens,
      stream: true,
      system: request.system.map((block) => ({
        type: "text",
        text: block.text,
        ...(block.cache ? { cache_control: { type: "ephemeral", ...(block.cache === "1h" ? { ttl: "1h" } : {}) } } : {}),
      })),
      messages: request.messages,
      ...(request.effort ? { output_config: { effort: request.effort } } : {}),
    };
  }
}
