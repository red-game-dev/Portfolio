import { isRecord } from "@/packages/core/domain";
import type { CustomFetcher } from "@/packages/http/api-client";

import { headersOf, SentConfig, sentBody } from "../../http/fixtures/fetcher";

// What a fake fetcher saw: the full URL, and the request it was given.
export interface SeenRequest {
  url: string;
  method?: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

export const sse = (events: Array<object | string>) => events.map((event) => `data: ${typeof event === "string" ? event : JSON.stringify(event)}\n\n`).join("");

// A fetcher that answers each call with the next of `responses` (the last repeats) and records what it was sent.
export const fakeFetcher = (responses: Array<{ status: number; body: string }>, seen: SeenRequest[] = []): CustomFetcher => (
  async (url: string, config?: SentConfig | null) => {
    const { status, body } = responses[Math.min(seen.length, responses.length - 1)];
    const sent = sentBody(config?.body);

    seen.push({
      url,
      method: typeof config?.method === "string" ? config.method : undefined,
      body: isRecord(sent) ? sent : {},
      headers: headersOf(config?.headers),
    });

    return new Response(body, { status });
  }
);

export const bodyOf = (chunks: string[]) => {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
};
