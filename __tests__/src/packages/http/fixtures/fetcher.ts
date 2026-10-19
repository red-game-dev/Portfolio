import type { CustomFetcher } from "fetchff";

import { isRecord } from "@/packages/core/domain";

// A fetcher for the real API client to send through, answering each call with the next answer (the last repeats), or as
// a function of the call says, and keeping what it was sent, so a test reads the request off the wire rather than off a
// stand in for the client.

export interface SeenCall {
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
}

export type FetchAnswer = { status: number; body?: unknown } | "dropped";

// The parts of fetchff's request a fetcher reads, typed as loosely as fetchff may hand them over.
export interface SentConfig {
  method?: unknown;
  body?: unknown;
  headers?: unknown;
}

export const headersOf = (value: unknown): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (isRecord(value)) {
    Object.entries(value).forEach(([name, text]) => {
      if (typeof text === "string") {
        headers[name] = text;
      }
    });
  }

  return headers;
};

// A JSON body as what it says, anything else as it came.
export const sentBody = (body: unknown): unknown => {
  if (typeof body !== "string") {
    return body ?? null;
  }

  try {
    const parsed: unknown = JSON.parse(body);

    return parsed;
  } catch {
    return body;
  }
};

type Answers = readonly FetchAnswer[] | ((call: SeenCall) => FetchAnswer);

export const recordingFetcher = (answers: Answers, seen: SeenCall[] = []): CustomFetcher => async (url: string, config?: SentConfig | null) => {
  const call = { url, method: typeof config?.method === "string" ? config.method : "GET", body: sentBody(config?.body), headers: headersOf(config?.headers) };
  const answer = typeof answers === "function" ? answers(call) : answers[Math.min(seen.length, answers.length - 1)];

  seen.push(call);

  if (answer === "dropped") {
    throw new TypeError("Failed to fetch");
  }

  return new Response(JSON.stringify(answer.body ?? null), { status: answer.status, headers: { "content-type": "application/json" } });
};
