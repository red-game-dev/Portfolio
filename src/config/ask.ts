import { SectionKey } from "@/config/sections";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Haiku answers first, quickly and cheaply. "Go deeper" asks Sonnet for the longer answer, and falls back to
// Haiku if Sonnet is overloaded. Prices are US dollars per million tokens, with cache writes at the one hour
// rate the knowledge is cached at.
export const ASK_MODELS = {
  quick: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 450,
    price: { input: 1, cacheWrite: 2, cacheRead: 0.1, output: 5 },
  },
  deep: {
    model: "claude-sonnet-5-5",
    maxTokens: 1000,
    price: { input: 2, cacheWrite: 4, cacheRead: 0.1, output: 10 },
  },
} as const;

// The knowledge is about 22k tokens. Cached for an hour it costs twice as much to write as for five minutes,
// and pays off on a site where questions arrive minutes apart.
export const ASK_PROMPT_CACHE = "1h" as const;

// Sliding windows counted in the shared store, so they hold across every server instance: per visitor on
// every request, and for everyone together on every model call.
export const ASK_RATES = {
  visitor: {
    quick: { limit: 12, windowMs: 10 * MINUTE },
    deep: { limit: 4, windowMs: 10 * MINUTE },
  },
  everyone: {
    quick: { limit: 600, windowMs: HOUR },
    deep: { limit: 120, windowMs: HOUR },
  },
} as const;

// Spend per UTC day before the agent rests until tomorrow; ASK_DAILY_BUDGET_USD overrides it. The hard monthly
// cap is the spend limit on the key's workspace in the Anthropic Console.
export const ASK_DAILY_BUDGET_USD = 3;

// First questions and their answers are shared for a day, keyed by a hash of the knowledge and the models, so
// a deploy that changes either starts afresh.
export const ASK_ANSWER_CACHE_MS = 24 * HOUR;

export const ASK_RESILIENCE = {
  retries: 1,
  fallback: { deep: "quick" },
  timeoutMs: 45 * 1000,
  backoffMs: 400,
  waitForPeerMs: 8 * 1000,
  pollMs: 400,
} as const;

// The sections an answer may cite, in the order the knowledge lists them. Each is a stop on the page the
// terminal can take the reader to.
export const ASK_SOURCES = [
  "about", "services", "history", "aiUsage", "forge", "skillAreas", "caseStudies", "projects", "recommendations",
] as const satisfies readonly SectionKey[];

export type AskSourceKey = (typeof ASK_SOURCES)[number];

export const ASK_ENDPOINT = "/api/ask/";
