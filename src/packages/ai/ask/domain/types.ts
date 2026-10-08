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

// A cached block is sent once and read back cheaply on later calls, so a long, unchanging knowledge base
// belongs in one.
export interface SystemBlock {
  text: string;
  isCached?: boolean;
}

export interface ModelRequest {
  model: string;
  maxTokens: number;
  system: SystemBlock[];
  messages: ModelMessage[];
}

// The port a language model sits behind: the answer arrives as it is written.
export interface AnswerModel {
  stream(request: ModelRequest, signal?: AbortSignal): AsyncIterable<string>;
}
