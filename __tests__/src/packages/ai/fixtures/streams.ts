import type { CustomFetcher } from "@/packages/http/api-client";

// What a fake fetcher saw: the full URL, and the request it was given.
export interface SeenRequest {
  url: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

export const sse = (events: Array<object | string>) => events.map((event) => `data: ${typeof event === "string" ? event : JSON.stringify(event)}\n\n`).join("");

// A fetcher that answers each call with the next of `responses` (the last repeats) and records what it was sent.
export const fakeFetcher = (responses: Array<{ status: number; body: string }>, seen: SeenRequest[] = []): CustomFetcher => (
  async (url, config) => {
    const { status, body } = responses[Math.min(seen.length, responses.length - 1)];

    seen.push({ url, body: JSON.parse(String(config?.body ?? "{}")) as Record<string, unknown>, headers: (config?.headers ?? {}) as Record<string, string> });

    return new Response(body, { status });
  }
) as CustomFetcher;

export const bodyOf = (chunks: string[]) => {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
};
