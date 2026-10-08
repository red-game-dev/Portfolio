import { ASK_ENDPOINT } from "@/config/ask";
import { AskErrorCode, AskEvent, AskRequest, readAskEvents } from "@/packages/ai/ask";

const STATUS_ERRORS: Record<number, AskErrorCode> = { 400: "invalid", 429: "limited", 503: "unavailable" };

// Asks the agent and yields its answer as it streams. Never throws: a failure arrives as an error event, and
// an abort simply ends the stream.
export async function* askRed(request: AskRequest, signal?: AbortSignal): AsyncGenerator<AskEvent> {
  let response: Response;

  try {
    response = await fetch(ASK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    if (!signal?.aborted) {
      yield { type: "error", code: "failed" };
    }

    return;
  }

  if (!response.ok || !response.body) {
    yield { type: "error", code: STATUS_ERRORS[response.status] ?? "failed" };

    return;
  }

  try {
    yield* readAskEvents(response.body);
  } catch {
    if (!signal?.aborted) {
      yield { type: "error", code: "failed" };
    }
  }
}
