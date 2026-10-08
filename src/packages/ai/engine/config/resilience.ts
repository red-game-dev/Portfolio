import type { RetryPolicy } from "@/packages/http/api-client";

export interface EngineResilience {
  // Further tries of the same route when it is busy before the first word, before the next route is tried. The
  // providers' HTTP client already retries busy responses, so this is for providers that do not.
  retries: number;
  // The whole answer, every attempt included.
  timeoutMs: number;
  // Doubled on each retry of the same route.
  backoffMs: number;
}

export const DEFAULT_ENGINE_RESILIENCE: EngineResilience = {
  retries: 0,
  timeoutMs: 45 * 1000,
  backoffMs: 400,
};

export const resolveEngineResilience = (overrides: Partial<EngineResilience> = {}): EngineResilience => ({ ...DEFAULT_ENGINE_RESILIENCE, ...overrides });

// How a provider's HTTP calls are retried before a stream starts: rate limits (honouring Retry-After), overloads
// and gateways that gave up, with jitter so many instances never retry in step. Mid stream failures are the
// engine's to handle, by moving to the next route.
export const MODEL_HTTP_RETRY: RetryPolicy = {
  retries: 1,
  delay: 300,
  maxDelay: 2000,
  backoff: 2,
  jitter: true,
  retryOn: [408, 429, 500, 502, 503, 504, 529],
  methods: ["POST"],
};

// Until a provider's response headers arrive; the whole answer is bounded by the engine's own timeout.
export const MODEL_HTTP_TIMEOUT_MS = 20 * 1000;
