import { AskLimits, resolveAskLimits } from "../config/limits";
import { AnswerModel, AskDepth, AskErrorCode, AskEvent, AskRequest, ModelMessage, SystemBlock } from "../domain/types";
import { parseAskRequest } from "../guards/askRequest";
import { withoutEmDashes } from "../utils/dashes";
import { SourceSplitter } from "../utils/sources";

export interface AskModelChoice {
  model: string;
  maxTokens: number;
  // Added after the cached knowledge, so both depths share the same cached prefix shape.
  guidance: string;
}

export interface AskServiceOptions {
  model: AnswerModel;
  // The instructions and the knowledge, sent as one cached block.
  knowledge: string;
  models: Record<AskDepth, AskModelChoice>;
  // The section keys an answer may cite.
  sourceKeys: readonly string[];
  // Whether this client may ask now at this depth. Counting is up to the host.
  allow: (client: string, depth: AskDepth) => boolean;
  limits?: Partial<AskLimits>;
}

export type AskPreparation = { request: AskRequest } | { error: AskErrorCode };

// Answers a question about one body of knowledge: checks the request, asks the model, and streams the answer
// back as events, with the sections it drew on split off the end.
export class AskService {
  private readonly options: AskServiceOptions;
  private readonly limits: AskLimits;

  constructor(options: AskServiceOptions) {
    this.options = options;
    this.limits = resolveAskLimits(options.limits);
  }

  // Everything that can be refused before the model is called, so the host can answer with a status code.
  public prepare(body: unknown, client: string): AskPreparation {
    const request = parseAskRequest(body, this.limits);

    if (!request) {
      return { error: "invalid" };
    }

    return this.options.allow(client, request.depth) ? { request } : { error: "limited" };
  }

  public async* answer(request: AskRequest, signal?: AbortSignal): AsyncGenerator<AskEvent> {
    const choice = this.options.models[request.depth];
    const system: SystemBlock[] = [{ text: this.options.knowledge, isCached: true }, { text: choice.guidance }];
    const messages: ModelMessage[] = [
      ...request.history.flatMap((turn): ModelMessage[] => [
        { role: "user", content: turn.question },
        { role: "assistant", content: turn.answer },
      ]),
      { role: "user", content: request.question },
    ];
    const splitter = new SourceSplitter();

    try {
      for await (const chunk of this.options.model.stream({ model: choice.model, maxTokens: choice.maxTokens, system, messages }, signal)) {
        const text = withoutEmDashes(splitter.push(chunk));

        if (text) {
          yield { type: "text", text };
        }
      }
    } catch {
      yield { type: "error", code: "failed" };

      return;
    }

    const { text, keys } = splitter.end(this.options.sourceKeys);

    if (text.trim()) {
      yield { type: "text", text: withoutEmDashes(text) };
    }

    if (keys.length > 0) {
      yield { type: "sources", keys };
    }

    yield { type: "done" };
  }
}
