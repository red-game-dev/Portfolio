import { AskLimits, resolveAskLimits } from "../config/limits";
import { AnswerCache, CachedAnswer } from "../core/AnswerCache";
import { ModelError } from "../domain/errors";
import { AnswerModel, AskDepth, AskErrorCode, AskEvent, AskRequest, ModelMessage, ModelPrice, ModelRequest, SystemBlock, TokenUsage } from "../domain/types";
import { parseAskRequest } from "../guards/askRequest";
import { costMicros, NO_USAGE } from "../utils/cost";
import { withoutEmDashes } from "../utils/dashes";
import { SourceSplitter } from "../utils/sources";
import { sleep, withTimeout } from "../utils/time";

export interface AskModelChoice {
  model: string;
  maxTokens: number;
  // Added after the cached knowledge, so it never breaks the cached prefix.
  guidance: string;
  price: ModelPrice;
}

export interface Limiter {
  take(key: string): Promise<boolean>;
}

export interface Budget {
  hasRoom(): Promise<boolean>;
  spend(micros: number): Promise<void>;
}

export interface AskGuards {
  // Per visitor, counted on every request, cached or not.
  visitor: Record<AskDepth, Limiter>;
  // For everyone together, counted only when the model is called.
  everyone: Record<AskDepth, Limiter>;
  budget: Budget;
}

export interface AskResilience {
  // Further tries of the same model when it is rate limited or overloaded before the first word.
  retries: number;
  // The depth to fall back to once the retries are spent, such as deep to quick.
  fallback: Partial<Record<AskDepth, AskDepth>>;
  timeoutMs: number;
  backoffMs: number;
  // How long a request waits for another one already asking the same first question.
  waitForPeerMs: number;
  pollMs: number;
}

export type AskOutcome = "answered" | "cached" | "failed" | "stopped";

// One line per answer, for logs and dashboards.
export interface AskRecord {
  depth: AskDepth;
  model: string;
  outcome: AskOutcome;
  attempts: number;
  ms: number;
  firstTokenMs: number | null;
  usage: TokenUsage;
  costMicros: number;
  sources: string[];
  isFirstQuestion: boolean;
}

export interface AskServiceOptions {
  model: AnswerModel;
  // The instructions and the knowledge, sent as one cached block.
  knowledge: string;
  promptCache?: SystemBlock["cache"];
  models: Record<AskDepth, AskModelChoice>;
  // The section keys an answer may cite.
  sourceKeys: readonly string[];
  guards: AskGuards;
  cache?: AnswerCache;
  resilience?: Partial<AskResilience>;
  limits?: Partial<AskLimits>;
  onRecord?: (record: AskRecord) => void;
  now?: () => number;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

export interface AskPlan {
  request: AskRequest;
  cached?: CachedAnswer;
}

export type AskPreparation = { plan: AskPlan } | { error: AskErrorCode };

const DEFAULT_RESILIENCE: AskResilience = {
  retries: 1,
  fallback: {},
  timeoutMs: 45 * 1000,
  backoffMs: 400,
  waitForPeerMs: 8 * 1000,
  pollMs: 400,
};

const addUsage = (total: TokenUsage, usage: TokenUsage): TokenUsage => ({
  input: total.input + usage.input,
  cacheWrite: total.cacheWrite + usage.cacheWrite,
  cacheRead: total.cacheRead + usage.cacheRead,
  output: total.output + usage.output,
});

// Answers questions about one body of knowledge for many visitors at once. Everything that can refuse runs
// before the model is called (the request, the visitor's limit, the shared cache, the limit for everyone and
// the daily budget), so the host can answer with a status code. Then the answer streams back as events, with
// retries and a fallback model while nothing has been shown yet, and is priced, logged and cached.
export class AskService {
  private readonly options: AskServiceOptions;
  private readonly limits: AskLimits;
  private readonly resilience: AskResilience;
  private readonly now: () => number;
  private readonly wait: (ms: number, signal?: AbortSignal) => Promise<void>;

  constructor(options: AskServiceOptions) {
    this.options = options;
    this.limits = resolveAskLimits(options.limits);
    this.resilience = { ...DEFAULT_RESILIENCE, ...options.resilience };
    this.now = options.now ?? Date.now;
    this.wait = options.wait ?? sleep;
  }

  public async prepare(body: unknown, client: string): Promise<AskPreparation> {
    const request = parseAskRequest(body, this.limits);
    const { guards } = this.options;

    if (!request) {
      return { error: "invalid" };
    }

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
    const started = this.now();
    const { request, cached } = plan;
    const record = (fields: Pick<AskRecord, "model" | "outcome" | "attempts" | "firstTokenMs" | "usage" | "costMicros" | "sources">) => {
      this.options.onRecord?.({ ...fields, depth: request.depth, ms: this.now() - started, isFirstQuestion: request.history.length === 0 });
    };

    if (cached) {
      yield { type: "text", text: cached.text };

      if (cached.sources.length > 0) {
        yield { type: "sources", keys: cached.sources };
      }

      yield { type: "done" };
      record({ model: "cache", outcome: "cached", attempts: 0, firstTokenMs: 0, usage: NO_USAGE, costMicros: 0, sources: cached.sources });

      return;
    }

    const depths = this.attemptsFor(request.depth);
    const timeout = withTimeout(this.resilience.timeoutMs, signal);
    const splitter = new SourceSplitter();
    let text = "";
    let usage = NO_USAGE;
    let cost = 0;
    let firstTokenMs: number | null = null;
    let attempts = 0;
    let usedDepth = request.depth;
    let failure: unknown = null;

    try {
      for (const [index, depth] of depths.entries()) {
        const choice = this.options.models[depth];

        attempts = index + 1;
        usedDepth = depth;
        failure = null;

        try {
          for await (const chunk of this.options.model.stream(this.modelRequest(request, choice), timeout.signal)) {
            if (chunk.type === "usage") {
              usage = addUsage(usage, chunk.usage);
              cost += costMicros(chunk.usage, choice.price);
            } else {
              firstTokenMs ??= this.now() - started;

              const shown = withoutEmDashes(splitter.push(chunk.text));

              text += shown;

              if (shown) {
                yield { type: "text", text: shown };
              }
            }
          }

          break;
        } catch (error) {
          failure = error;

          const canRetry = firstTokenMs === null && !timeout.signal.aborted && error instanceof ModelError && error.isRetryable && index < depths.length - 1;

          if (!canRetry) {
            break;
          }

          await this.wait(this.resilience.backoffMs * 2 ** index, timeout.signal);
        }
      }
    } finally {
      timeout.clear();
    }

    const model = this.options.models[usedDepth].model;

    if (failure) {
      const isStopped = Boolean(signal?.aborted);

      if (!isStopped) {
        yield { type: "error", code: "failed" };
      }

      await this.settle(() => this.options.guards.budget.spend(cost));
      record({ model, outcome: isStopped ? "stopped" : "failed", attempts, firstTokenMs, usage, costMicros: cost, sources: [] });

      return;
    }

    const { text: rest, keys } = splitter.end(this.options.sourceKeys);
    const tail = withoutEmDashes(rest);

    if (tail.trim()) {
      text += tail;
      yield { type: "text", text: tail };
    }

    if (keys.length > 0) {
      yield { type: "sources", keys };
    }

    yield { type: "done" };

    const answer = text.trim();
    const isCacheable = request.history.length === 0 && usedDepth === request.depth && answer.length > 0;

    await this.settle(() => this.options.guards.budget.spend(cost));

    if (isCacheable && this.options.cache) {
      const cache = this.options.cache;

      await this.settle(() => cache.set(request.question, request.depth, { text: answer, sources: keys }));
    }

    record({ model, outcome: "answered", attempts, firstTokenMs, usage, costMicros: cost, sources: keys });
  }

  // The depths to try in order: the asked one, its retries, then its fallback.
  private attemptsFor(depth: AskDepth): AskDepth[] {
    const fallback = this.resilience.fallback[depth];

    return [...Array.from({ length: this.resilience.retries + 1 }, () => depth), ...(fallback && fallback !== depth ? [fallback] : [])];
  }

  private modelRequest(request: AskRequest, choice: AskModelChoice): ModelRequest {
    const messages: ModelMessage[] = [
      ...request.history.flatMap((turn): ModelMessage[] => [
        { role: "user", content: turn.question },
        { role: "assistant", content: turn.answer },
      ]),
      { role: "user", content: request.question },
    ];

    return {
      model: choice.model,
      maxTokens: choice.maxTokens,
      system: [{ text: this.options.knowledge, cache: this.options.promptCache ?? "5m" }, { text: choice.guidance }],
      messages,
    };
  }

  // A cached answer, or the one another request is about to write. Only one request among many asking the
  // same first question at once calls the model; the rest wait briefly for its answer.
  private async cachedOrWait(request: AskRequest): Promise<CachedAnswer | null> {
    const { cache } = this.options;

    if (!cache) {
      return null;
    }

    const cached = await cache.get(request.question, request.depth);

    if (cached || (await cache.claim(request.question, request.depth, this.resilience.timeoutMs))) {
      return cached;
    }

    for (let polled = 0; polled < Math.ceil(this.resilience.waitForPeerMs / this.resilience.pollMs); polled += 1) {
      await this.wait(this.resilience.pollMs);

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
