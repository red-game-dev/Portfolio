import type { EngineReport } from "@/packages/ai/engine";

// How much of an answer is wanted, which is also the engine tier asked for.
export type AskDepth = "quick" | "deep";

// One earlier exchange, so a follow up question can lean on it.
export interface AskTurn {
  question: string;
  answer: string;
}

// A question as it arrives, before it is trusted: only its shape is known.
export interface AskBody {
  question: string;
  depth?: unknown;
  history?: unknown;
}

export interface AskRequest {
  question: string;
  depth: AskDepth;
  history: AskTurn[];
}

export type AskErrorCode = "invalid" | "limited" | "unavailable" | "failed";

// What an answer streams back, in order: the model answering, the text as it is written, the sections it drew
// on, then done. An error can arrive instead of done if every model fails.
export type AskEvent =
  | { type: "model"; label: string }
  | { type: "text"; text: string }
  | { type: "sources"; keys: string[] }
  | { type: "done" }
  | { type: "error"; code: AskErrorCode };

export interface CachedAnswer {
  text: string;
  sources: string[];
  // The model that wrote it.
  label: string;
}

export interface AskPlan {
  request: AskRequest;
  cached?: CachedAnswer;
}

export type AskPreparation = { plan: AskPlan } | { error: AskErrorCode };

export type AskOutcome = "answered" | "cached" | "failed" | "stopped";

// One line per answer, for logs and dashboards: the engine's report plus what the domain decided.
export interface AskRecord extends Omit<EngineReport, "outcome"> {
  outcome: AskOutcome;
  depth: AskDepth;
  isFirstQuestion: boolean;
  cacheHitRatio: number;
  sources: string[];
}
