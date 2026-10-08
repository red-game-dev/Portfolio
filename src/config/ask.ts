import { SectionKey } from "@/config/sections";
import type { ModelSpec, OpenAIRequestOptions } from "@/packages/ai/engine";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Every provider Ask Red can run on, each a model per depth. Gemini's free tier is tried first; Claude and
// OpenAI stand behind it and only run when their key is set. Prices are US dollars per million tokens, with
// cache writes at the one hour rate. Gemini is priced at nothing because its free tier costs nothing; turn on
// billing for the key's project and its paid prices belong here instead. Thinking counts toward maxTokens.
export type AskProviderId = "gemini" | "anthropic" | "openai";

export interface AskProviderConfig {
  // Which engine provider speaks to it.
  api: "anthropic" | "openai";
  // The environment variable holding its key.
  keyEnv: string;
  baseURL?: string;
  maxTokensField?: OpenAIRequestOptions["maxTokensField"];
  // OpenAI routes calls with the same prompt_cache_key to the same cache; Gemini caches a repeated prefix alone.
  sendsCacheKey?: boolean;
  models: Record<"quick" | "deep", ModelSpec>;
}

const FREE = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };

export const ASK_PROVIDERS: Record<AskProviderId, AskProviderConfig> = {
  gemini: {
    api: "openai",
    keyEnv: "GEMINI_API_KEY",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    maxTokensField: "max_tokens",
    models: {
      quick: { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", maxTokens: 1200, effort: "low", price: FREE },
      deep: { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", maxTokens: 2500, effort: "medium", price: FREE },
    },
  },
  anthropic: {
    api: "anthropic",
    keyEnv: "ANTHROPIC_API_KEY",
    models: {
      quick: {
        id: "claude-haiku-5-5",
        label: "Claude Haiku 5.5",
        maxTokens: 1200,
        effort: "low",
        price: { input: 0.1, cacheWrite: 0.2, cacheRead: 0.01, output: 0.5 },
      },
      deep: {
        id: "claude-sonnet-5-5",
        label: "Claude Sonnet 5.5",
        maxTokens: 2500,
        effort: "medium",
        price: { input: 2, cacheWrite: 4, cacheRead: 0.1, output: 10 },
      },
    },
  },
  openai: {
    api: "openai",
    keyEnv: "OPENAI_API_KEY",
    baseURL: "https://api.openai.com/v1",
    maxTokensField: "max_completion_tokens",
    sendsCacheKey: true,
    models: {
      quick: { id: "gpt-5.4-mini", label: "GPT-5.4 mini", maxTokens: 1200, effort: "low", price: { input: 0.75, cacheWrite: 0.75, cacheRead: 0.075, output: 4.5 } },
      deep: { id: "gpt-6.1-sol", label: "GPT-6.1 Sol", maxTokens: 2500, effort: "medium", price: { input: 2, cacheWrite: 2, cacheRead: 0.1, output: 10 } },
    },
  },
};

// The order providers are tried in: the free one first. ASK_PROVIDERS in the environment overrides it with a
// comma separated list, such as "anthropic,gemini".
export const ASK_PROVIDER_ORDER: AskProviderId[] = ["gemini", "anthropic", "openai"];

// A deep question that no deep route can answer falls back to the quick routes, and that answer is not cached
// as the deep one.
export const ASK_FALLBACKS = { deep: ["quick"] };

// The knowledge is about 22k tokens. On Claude, cached for an hour it costs twice as much to write as for five
// minutes, and pays off on a site where questions arrive minutes apart. Gemini and OpenAI cache a repeated
// prefix on their own.
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
export const ASK_DAILY_BUDGET_USD = 1;

// First questions and their answers are shared for a day, keyed by a hash of the knowledge and the models, so
// a deploy that changes either starts afresh.
export const ASK_ANSWER_CACHE_MS = 24 * HOUR;

// The engine moves to the next provider when one fails; the HTTP client already retried it.
export const ASK_RESILIENCE = {
  retries: 0,
  timeoutMs: 45 * 1000,
  backoffMs: 400,
} as const;

// The knowledge may grow to this many tokens, estimated, before a test asks for it to be trimmed: the whole site
// in every prompt is what keeps answers accurate, and caching is what keeps it cheap, so it should stay lean.
export const ASK_KNOWLEDGE_TOKEN_BUDGET = 26000;

// The sections an answer may cite, in the order the knowledge lists them. Each is a stop on the page the
// terminal can take the reader to.
export const ASK_SOURCES = [
  "about", "services", "history", "aiUsage", "forge", "skillAreas", "caseStudies", "projects", "recommendations",
] as const satisfies readonly SectionKey[];

export type AskSourceKey = (typeof ASK_SOURCES)[number];

export const ASK_ENDPOINT = "/api/ask/";

// Earlier exchanges sent with a question, so a follow up can lean on them. The page keeps this many and the
// server trims to it.
export const ASK_HISTORY_TURNS = 2;
