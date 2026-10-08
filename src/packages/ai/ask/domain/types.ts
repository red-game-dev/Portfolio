// How much of an answer is wanted: a quick reply from a small model, or a deeper one from a larger model.
export type AskDepth = "quick" | "deep";

// One earlier exchange, so a follow up question can lean on it.
export interface AskTurn {
  question: string;
  answer: string;
}

export interface AskRequest {
  question: string;
  depth: AskDepth;
  history: AskTurn[];
}

export type AskErrorCode = "invalid" | "limited" | "unavailable" | "failed";

// What an answer streams back, in order: text as it is written, the sections it drew on, then done. An error
// can arrive instead of done if the model fails midway.
export type AskEvent =
  | { type: "text"; text: string }
  | { type: "sources"; keys: string[] }
  | { type: "done" }
  | { type: "error"; code: AskErrorCode };

export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

// A cached block is written once and read back at a fraction of the price while it stays warm, so a long,
// unchanging knowledge base belongs in one. An hour costs more to write than five minutes and pays off when
// questions arrive minutes apart.
export interface SystemBlock {
  text: string;
  cache?: "5m" | "1h";
}

export interface ModelRequest {
  model: string;
  maxTokens: number;
  system: SystemBlock[];
  messages: ModelMessage[];
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

export type ModelChunk = { type: "text"; text: string } | { type: "usage"; usage: TokenUsage };

// The port a language model sits behind: the answer arrives as it is written, then what it cost.
export interface AnswerModel {
  stream(request: ModelRequest, signal?: AbortSignal): AsyncIterable<ModelChunk>;
}

// A counter shared by every server instance. `add` creates the key with its time to live if it is new, adds
// to it, and reads other keys in the same round trip.
export interface CounterStore {
  add(key: string, by: number, ttlMs: number, alsoRead?: string[]): Promise<{ value: number; read: number[] }>;
}

// Strings with a time to live, plus `claim`: set only if absent, true for the one caller that set it.
export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  claim(key: string, ttlMs: number): Promise<boolean>;
}

export type AskStore = CounterStore & CacheStore;
