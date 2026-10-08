import { ASK_ENDPOINT } from "@/config/ask";
import { askErrorForStatus, AskEvent, AskRequest, readAskEvents } from "@/packages/ai/ask";
import { ApiClient } from "@/packages/http/api-client";

// Asks the agent through the app's global API client and yields its answer as it streams. Never throws: a failure
// arrives as an error event, and a stop simply ends the stream. Nothing is retried: a question costs money, and
// the server already moves between providers.
export async function* askRed(request: AskRequest, signal?: AbortSignal): AsyncGenerator<AskEvent> {
  const result = await ApiClient.global().postStream<AskRequest>(ASK_ENDPOINT, request, { signal });

  if (!result.ok) {
    if (!result.isCancelled && !signal?.aborted) {
      yield { type: "error", code: askErrorForStatus(result.status) };
    }

    return;
  }

  try {
    yield* readAskEvents(result.data);
  } catch {
    if (!signal?.aborted) {
      yield { type: "error", code: "failed" };
    }
  }
}
