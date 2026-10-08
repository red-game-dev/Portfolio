import { EngineResilience, resolveEngineResilience } from "../config/resilience";
import { ModelError } from "../domain/errors";
import { EngineEvent, EngineOutcome, EngineRequest, ModelRequest, Route, TextEngine, TokenUsage } from "../domain/types";
import { addUsage, costMicros, NO_USAGE } from "../utils/cost";
import { sleep, withTimeout } from "../utils/time";
import { RouteValidator } from "../validators/RouteValidator";

export interface AiEngineOptions {
  // Per tier, the routes to try in order, such as a free provider first and paid ones behind it.
  routes: Record<string, Route[]>;
  // The tiers a tier falls back to once its own routes are spent, such as deep to quick.
  fallbacks?: Record<string, string[]>;
  resilience?: Partial<EngineResilience>;
  now?: () => number;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

const isSameModel = (first: Route, second: Route) => first.provider.name === second.provider.name && first.spec.id === second.spec.id;

// Text generation on any provider. A request names a tier; the engine answers from the first route that works:
// a busy route is retried before the first word, a refusing one (a bad key, an unknown model) is skipped for the
// next, and once a tier's routes are spent its fallback tiers are tried. Usage is priced per route, and every
// answer ends with a report, so callers never have to catch.
export class AiEngine implements TextEngine {
  private readonly options: AiEngineOptions;
  private readonly resilience: EngineResilience;
  private readonly now: () => number;
  private readonly wait: (ms: number, signal?: AbortSignal) => Promise<void>;

  constructor(options: AiEngineOptions) {
    new RouteValidator().assertValid(Object.values(options.routes).flat());
    this.options = options;
    this.resilience = resolveEngineResilience(options.resilience);
    this.now = options.now ?? Date.now;
    this.wait = options.wait ?? sleep;
  }

  public hasRoutes(tier: string): boolean {
    return this.routesFor(tier).length > 0;
  }

  public async* stream(request: EngineRequest, signal?: AbortSignal): AsyncGenerator<EngineEvent> {
    const started = this.now();
    const attempts = this.routesFor(request.tier).flatMap((route) => Array.from({ length: this.resilience.retries + 1 }, () => route));
    const timeout = withTimeout(this.resilience.timeoutMs, signal);
    let usage: TokenUsage = NO_USAGE;
    let cost = 0;
    let firstTokenMs: number | null = null;
    let index = 0;
    let calls = 0;
    let failure: unknown = attempts.length === 0 ? new ModelError(503, `No route answers ${request.tier}`) : null;

    try {
      while (index < attempts.length) {
        const route = attempts[index];

        calls += 1;
        failure = null;

        try {
          for await (const chunk of route.provider.stream(this.modelRequest(request, route), timeout.signal)) {
            if (chunk.type === "usage") {
              usage = addUsage(usage, chunk.usage);
              cost += costMicros(chunk.usage, route.spec.price);
            } else {
              if (firstTokenMs === null) {
                firstTokenMs = this.now() - started;
                yield { type: "start", label: route.spec.label };
              }

              yield { type: "text", text: chunk.text };
            }
          }

          break;
        } catch (error) {
          failure = error;

          const next = this.nextAttempt(attempts, index, error, firstTokenMs !== null || timeout.signal.aborted);

          if (next === null) {
            break;
          }

          if (attempts[next] === route) {
            await this.wait(this.resilience.backoffMs * 2 ** index, timeout.signal);
          }

          index = next;
        }
      }
    } finally {
      timeout.clear();
    }

    const served = attempts[Math.min(index, attempts.length - 1)];
    const outcome: EngineOutcome = !failure ? "complete" : signal?.aborted ? "stopped" : "failed";

    yield {
      type: "end",
      report: {
        outcome,
        provider: served?.provider.name ?? "none",
        model: served?.spec.id ?? "none",
        label: served?.spec.label ?? "",
        servedTier: served?.tier ?? request.tier,
        attempts: calls,
        usage,
        costMicros: cost,
        firstTokenMs,
        ms: this.now() - started,
      },
    };
  }

  // The tier's routes, then each fallback tier's routes it has not already tried.
  private routesFor(tier: string): Route[] {
    return [tier, ...(this.options.fallbacks?.[tier] ?? [])].reduce<Route[]>((routes, name) => [
      ...routes,
      ...(this.options.routes[name] ?? []).filter((route) => !routes.some((tried) => isSameModel(tried, route))),
    ], []);
  }

  // Once words are shown or time is up, the answer stands. A busy route gets its retries; anything else moves
  // straight to the next route.
  private nextAttempt(attempts: Route[], index: number, error: unknown, isSettled: boolean): number | null {
    if (isSettled) {
      return null;
    }

    const isRetryable = error instanceof ModelError && error.isRetryable;
    const next = isRetryable ? index + 1 : attempts.findIndex((other, at) => at > index && other !== attempts[index]);

    return next > 0 && next < attempts.length ? next : null;
  }

  private modelRequest(request: EngineRequest, route: Route): ModelRequest {
    return {
      model: route.spec.id,
      maxTokens: route.spec.maxTokens,
      effort: route.spec.effort,
      system: request.system,
      messages: request.messages,
      cacheKey: request.cacheKey,
    };
  }
}
