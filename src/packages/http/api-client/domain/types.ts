import type { RetryConfig } from "fetchff";

// fetchff's retry rules without its per response callback, so one policy fits calls of any response type.
export type RetryPolicy = Pick<RetryConfig, "retries" | "delay" | "maxDelay" | "backoff" | "jitter" | "retryOn" | "methods" | "resetTimeout">;

// Settings a client is made with. An instance made from another inherits these and overrides what it names.
export interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  // Milliseconds per attempt, until the response headers arrive.
  timeout?: number;
  retry?: RetryPolicy;
}

// Per call: cancel it, add headers, or give it a timeout of its own. A read can also be kept for `cacheSeconds`, and
// reads of the same thing within `dedupeMs` of each other share one request (fetchff's cache and dedupe), so every
// part of a page asking the same question costs one request.
export interface CallOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeout?: number;
  cacheSeconds?: number;
  dedupeMs?: number;
}

export interface ApiFailure {
  ok: false;
  // The HTTP status, or 0 when no response arrived (offline, timed out, cancelled).
  status: number;
  message: string;
  isCancelled: boolean;
  // The body a server answered the failure with (parsed JSON, as the caller must guard it), or null for none.
  data: unknown;
}

// What a call came back with: the data, or why there is none. Calls never throw, so a caller decides with types,
// not try and catch.
export type ApiResult<TData> = { ok: true; status: number; data: TData } | ApiFailure;
