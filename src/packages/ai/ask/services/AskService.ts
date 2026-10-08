import { AskLimits, resolveAskLimits } from "../config/limits";
import { AnswerCache, CachedAnswer } from "../core/AnswerCache";
import { ModelError } from "../domain/errors";
import { AnswerModel, AskDepth, AskErrorCode, AskEvent, AskRequest, ModelEffort, ModelMessage, ModelPrice, ModelRequest, SystemBlock, TokenUsage } from "../domain/types";
import { parseAskRequest } from "../guards/askRequest";
import { costMicros, NO_USAGE } from "../utils/cost";
import { withoutEmDashes } from "../utils/dashes";
import { SourceSplitter } from "../utils/sources";
import { sleep, withTimeout } from "../utils/time";

// One provider's model, ready to answer at one depth. A depth has a list of these, tried in order.
export interface AskRoute {
  provider: string;
  // How the answer is credited, such as "Gemini 3.8 Flash".
  label: string;
  model: AnswerModel;
  modelId: string;
  maxTokens: number;
  effort?: ModelEffort;
  price: ModelPrice;
  // The depth this route is meant for. A deep question answered by a quick route is a downgrade, and is not
  // cached as the deep answer.
  tier: AskDepth;
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
  // Further tries of the same route when it is rate limited or overloaded before the first word, before the
  // next route is tried.
  retries: number;
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
  provider: string;
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
  // The instructions and the knowledge, sent as one cached block.
  knowledge: string;
  promptCache?: SystemBlock["cache"];
  // Per depth, the routes to try in order, such as a free provider first and paid ones behind it.
  routes: Record<AskDepth, AskRoute[]>;
  // Added after the cached knowledge, so it never breaks the cached prefix.
  guidance: Record<AskDepth, string>;
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

// Answers questions about one body of knowledge for many visitors at once, on whichever providers it is given.
// Everything that can refuse runs before a model is called (the request, the visitor's limit, the shared
// cache, the limit for everyone and the daily budget), so the host can answer with a status code. Then the
// answer streams back as events from the first route that answers, retrying and moving down the routes while
// nothing has been shown yet, and is priced, logged and cached.
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
    const record = (fields: Pick<AskRecord, "provider" | "model" | "outcome" | "attempts" | "firstTokenMs" | "usage" | "costMicros" | "sources">) => {
      this.options.onRecord?.({ ...fields, depth: request.depth, ms: this.now() - started, isFirstQuestion: request.history.length === 0 });
    };

    if (cached) {
      yield { type: "model", label: cached.label };
      yield { type: "text", text: cached.text };

      if (cached.sources.length > 0) {
        yield { type: "sources", keys: cached.sources };
      }

      yield { type: "done" };
      record({ provider: "cache", model: cached.label, outcome: "cached", attempts: 0, firstTokenMs: 0, usage: NO_USAGE, costMicros: 0, sources: cached.sources });

      return;
    }

    const attemptRoutes = this.attemptsFor(request.depth);
    const timeout = withTimeout(this.resilience.timeoutMs, signal);
    const splitter = new SourceSplitter();
    let text = "";
    let usage = NO_USAGE;
    let cost = 0;
    let firstTokenMs: number | null = null;
    let attempts = 0;
    let route: AskRoute | undefined = attemptRoutes[0];
    let failure: unknown = attemptRoutes.length === 0 ? new ModelError(503, "No route can answer") : null;

    try {
      let index = 0;

      while (index < attemptRoutes.length) {
        const candidate = attemptRoutes[index];

        attempts = index + 1;
        route = candidate;
        failure = null;

        try {
          for await (const chunk of candidate.model.stream(this.modelRequest(request, candidate), timeout.signal)) {
            if (chunk.type === "usage") {
              usage = addUsage(usage, chunk.usage);
              cost += costMicros(chunk.usage, candidate.price);
            } else {
              if (firstTokenMs === null) {
                firstTokenMs = this.now() - started;
                yield { type: "model", label: candidate.label };
              }

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

          // Once words are shown, or the time is up, the answer stands as it is.
          if (firstTokenMs !== null || timeout.signal.aborted) {
            break;
          }

          // A busy route gets its retries; anything else, such as a bad key, moves straight to the next route.
          const isRetryable = error instanceof ModelError && error.isRetryable;
          const next = isRetryable ? index + 1 : attemptRoutes.findIndex((other, at) => at > index && other !== candidate);

          if (next < 0 || next >= attemptRoutes.length) {
            break;
          }

          if (attemptRoutes[next] === candidate) {
            await this.wait(this.resilience.backoffMs * 2 ** index, timeout.signal);
          }

          index = next;
        }
      }
    } finally {
      timeout.clear();
    }

    const served = { provider: route?.provider ?? "none", model: route?.modelId ?? "none" };

    if (failure) {
      const isStopped = Boolean(signal?.aborted);

      if (!isStopped) {
        yield { type: "error", code: "failed" };
      }

      await this.settle(() => this.options.guards.budget.spend(cost));
      record({ ...served, outcome: isStopped ? "stopped" : "failed", attempts, firstTokenMs, usage, costMicros: cost, sources: [] });

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
    const isCacheable = request.history.length === 0 && route?.tier === request.depth && answer.length > 0;

    await this.settle(() => this.options.guards.budget.spend(cost));

    if (isCacheable && this.options.cache) {
      const cache = this.options.cache;

      await this.settle(() => cache.set(request.question, request.depth, { text: answer, sources: keys, label: route?.label ?? "" }));
    }

    record({ ...served, outcome: "answered", attempts, firstTokenMs, usage, costMicros: cost, sources: keys });
  }

  // Every route for the depth in order, each repeated for its retries.
  private attemptsFor(depth: AskDepth): AskRoute[] {
    return this.options.routes[depth].flatMap((route) => Array.from({ length: this.resilience.retries + 1 }, () => route));
  }

  private modelRequest(request: AskRequest, route: AskRoute): ModelRequest {
    const messages: ModelMessage[] = [
      ...request.history.flatMap((turn): ModelMessage[] => [
        { role: "user", content: turn.question },
        { role: "assistant", content: turn.answer },
      ]),
      { role: "user", content: request.question },
    ];

    return {
      model: route.modelId,
      maxTokens: route.maxTokens,
      effort: route.effort,
      system: [{ text: this.options.knowledge, cache: this.options.promptCache ?? "5m" }, { text: this.options.guidance[request.depth] }],
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
