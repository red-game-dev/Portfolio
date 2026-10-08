import { cacheHitRatio, EngineReport, sleep, TextEngine } from "@/packages/ai/engine";
import type { Limiter, Quota } from "@/packages/server/quota";

import { AskLimits, resolveAskLimits } from "../config/limits";
import { AnswerCache } from "../core/AnswerCache";
import { SourceSplitter } from "../core/SourceSplitter";
import { AskDepth, AskEvent, AskOutcome, AskPlan, AskPreparation, AskRecord, AskRequest, CachedAnswer } from "../domain/types";
import { isAskBody } from "../guards/askBody";
import { AskRequestMapper } from "../mappers/AskRequestMapper";
import { PromptMapper } from "../mappers/PromptMapper";
import { withoutEmDashes } from "../utils/dashes";
import { AskRequestValidator } from "../validators/AskRequestValidator";

export interface AskGuards {
  // Per visitor, counted on every request, cached or not.
  visitor: Record<AskDepth, Limiter>;
  // For everyone together, counted only when a model is called.
  everyone: Record<AskDepth, Limiter>;
  // Spend per day, in micro dollars.
  budget: Quota;
}

export interface AskServiceOptions {
  engine: TextEngine;
  prompt: PromptMapper;
  // The section keys an answer may cite.
  sourceKeys: readonly string[];
  guards: AskGuards;
  cache?: AnswerCache;
  limits?: Partial<AskLimits>;
  onRecord?: (record: AskRecord) => void;
  wait?: (ms: number) => Promise<void>;
}

// The domain service for questions about one body of knowledge. A request is guarded, validated and mapped,
// then everything that can refuse runs before a model is called (the visitor's limit, the shared cache, the limit
// for everyone and the daily budget), so the host can answer with a status code. The answer itself comes from
// the AI engine, whose events become the domain's: the source line is split off, em dashes become commas, and
// the engine's report is priced against the budget, cached and logged.
export class AskService {
  private readonly options: AskServiceOptions;
  private readonly limits: AskLimits;
  private readonly validator: AskRequestValidator;
  private readonly mapper: AskRequestMapper;
  private readonly wait: (ms: number) => Promise<void>;

  constructor(options: AskServiceOptions) {
    this.options = options;
    this.limits = resolveAskLimits(options.limits);
    this.validator = new AskRequestValidator(this.limits);
    this.mapper = new AskRequestMapper(this.limits);
    this.wait = options.wait ?? sleep;
  }

  public async prepare(body: unknown, client: string): Promise<AskPreparation> {
    if (!isAskBody(body) || !this.validator.validate(body).isValid) {
      return { error: "invalid" };
    }

    const request = this.mapper.map(body);
    const { guards } = this.options;

    if (!(await guards.visitor[request.depth].take(client))) {
      return { error: "limited" };
    }

    const cached = request.history.length === 0 ? await this.cachedOrWait(request) : null;

    if (cached) {
      return { plan: { request, cached } };
    }

    if (!(await guards.everyone[request.depth].take("all"))) {
      return { error: "limited" };
    }

    return (await guards.budget.hasRoom()) ? { plan: { request } } : { error: "unavailable" };
  }

  public async* answer(plan: AskPlan, signal?: AbortSignal): AsyncGenerator<AskEvent> {
    const { request, cached } = plan;

    if (cached) {
      yield* this.replay(cached);
      this.record(request, this.cachedReport(cached), "cached", cached.sources);

      return;
    }

    const splitter = new SourceSplitter();
    let text = "";

    for await (const event of this.options.engine.stream(this.options.prompt.map(request), signal)) {
      if (event.type === "start") {
        yield { type: "model", label: event.label };
      } else if (event.type === "text") {
        const shown = withoutEmDashes(splitter.push(event.text));

        text += shown;

        if (shown) {
          yield { type: "text", text: shown };
        }
      } else {
        yield* this.finish(request, event.report, splitter, text);
      }
    }
  }

  // The end of an answer: on success the held back text, the sources and done, then the bookkeeping.
  private async* finish(request: AskRequest, report: EngineReport, splitter: SourceSplitter, shown: string): AsyncGenerator<AskEvent> {
    await this.settle(() => this.options.guards.budget.spend(report.costMicros));

    if (report.outcome !== "complete") {
      if (report.outcome === "failed") {
        yield { type: "error", code: "failed" };
      }

      this.record(request, report, report.outcome, []);

      return;
    }

    const { text: rest, keys } = splitter.end(this.options.sourceKeys);
    const tail = withoutEmDashes(rest);
    const answer = `${shown}${tail}`.trim();

    if (tail.trim()) {
      yield { type: "text", text: tail };
    }

    if (keys.length > 0) {
      yield { type: "sources", keys };
    }

    yield { type: "done" };

    const { cache } = this.options;

    // A first question answered at the tier it asked for is worth sharing; a fallback answer is not.
    if (cache && request.history.length === 0 && report.servedTier === request.depth && answer) {
      await this.settle(() => cache.set(request.question, request.depth, { text: answer, sources: keys, label: report.label }));
    }

    this.record(request, report, "answered", keys);
  }

  private* replay(cached: CachedAnswer): Generator<AskEvent> {
    yield { type: "model", label: cached.label };
    yield { type: "text", text: cached.text };

    if (cached.sources.length > 0) {
      yield { type: "sources", keys: cached.sources };
    }

    yield { type: "done" };
  }

  private cachedReport(cached: CachedAnswer): EngineReport {
    return {
      outcome: "complete",
      provider: "cache",
      model: cached.label,
      label: cached.label,
      servedTier: "cache",
      attempts: 0,
      usage: { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 },
      costMicros: 0,
      firstTokenMs: 0,
      ms: 0,
    };
  }

  private record(request: AskRequest, report: EngineReport, outcome: AskOutcome, sources: string[]): void {
    this.options.onRecord?.({
      ...report,
      outcome,
      depth: request.depth,
      isFirstQuestion: request.history.length === 0,
      cacheHitRatio: cacheHitRatio(report.usage),
      sources,
    });
  }

  // A cached answer, or the one another request is about to write. Only one request among many asking the same
  // first question at once calls a model; the rest wait briefly for its answer.
  private async cachedOrWait(request: AskRequest): Promise<CachedAnswer | null> {
    const { cache } = this.options;

    if (!cache) {
      return null;
    }

    const cached = await cache.get(request.question, request.depth);

    if (cached || (await cache.claim(request.question, request.depth, this.limits.waitForPeerMs * 2))) {
      return cached;
    }

    for (let polled = 0; polled < Math.ceil(this.limits.waitForPeerMs / this.limits.pollMs); polled += 1) {
      await this.wait(this.limits.pollMs);

      const answer = await cache.get(request.question, request.depth);

      if (answer) {
        return answer;
      }
    }

    return null;
  }

  // Bookkeeping after an answer never fails the answer itself.
  private async settle(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch {
      // The store is down; the resilient store already logged it.
    }
  }
}
