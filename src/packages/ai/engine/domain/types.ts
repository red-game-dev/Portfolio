// How hard a model thinks before it answers, mapped by each provider onto its own setting.
export type ModelEffort = "low" | "medium" | "high";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

// A cached block is written once and read back at a fraction of the price while it stays warm. Providers that
// cache a repeated prefix on their own ignore the mark; keep long, unchanging text first either way.
export interface SystemBlock {
  text: string;
  cache?: "5m" | "1h";
}

// Tokens one call used, split the way they are priced.
export interface TokenUsage {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
}

// US dollars per million tokens, which is also micro dollars per token.
export interface ModelPrice {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
}

// One call to one model, in the engine's own terms; each provider maps it onto its API.
export interface ModelRequest {
  model: string;
  // The whole output, thinking included on models that think.
  maxTokens: number;
  effort?: ModelEffort;
  system: SystemBlock[];
  messages: Message[];
  // Groups calls that share a prefix, for providers that route on it to hit their cache.
  cacheKey?: string;
}

export type ModelChunk = { type: "text"; text: string } | { type: "usage"; usage: TokenUsage };

// The port every AI provider sits behind: the answer arrives as it is written, then what it used.
export interface ModelProvider {
  readonly name: string;
  stream(request: ModelRequest, signal?: AbortSignal): AsyncIterable<ModelChunk>;
}

// What a provider's stream event means: text to show, usage so far, or a failure. Usage counts are cumulative,
// so a later count replaces an earlier one.
export interface ProviderSignal {
  text?: string;
  usage?: Partial<TokenUsage>;
  error?: Error;
}

export interface ModelSpec {
  id: string;
  // How an answer is credited, such as "Gemini 3.8 Flash".
  label: string;
  maxTokens: number;
  effort?: ModelEffort;
  price: ModelPrice;
}

// A model on a provider, ready to answer at one tier, such as "quick" or "deep".
export interface Route {
  provider: ModelProvider;
  spec: ModelSpec;
  tier: string;
}

export interface EngineRequest {
  tier: string;
  system: SystemBlock[];
  messages: Message[];
  cacheKey?: string;
}

export type EngineOutcome = "complete" | "failed" | "stopped";

// How an answer went, for pricing, logs and the decision to cache it.
export interface EngineReport {
  outcome: EngineOutcome;
  provider: string;
  model: string;
  label: string;
  // The tier of the route that answered, lower than the asked tier when it fell back.
  servedTier: string;
  // Calls actually made, retries and skipped routes included.
  attempts: number;
  usage: TokenUsage;
  costMicros: number;
  firstTokenMs: number | null;
  ms: number;
}

// An answer as it happens: who is answering, the text, then always a report, even when it failed.
export type EngineEvent =
  | { type: "start"; label: string }
  | { type: "text"; text: string }
  | { type: "end"; report: EngineReport };

// The engine as its callers see it.
export interface TextEngine {
  stream(request: EngineRequest, signal?: AbortSignal): AsyncIterable<EngineEvent>;
}
