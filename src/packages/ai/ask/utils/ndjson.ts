import { readLines } from "@/packages/ai/engine";
import { parseJson } from "@/packages/core/domain";

import { AskEvent } from "../domain/types";
import { isAskEvent } from "../guards/askEvent";

// One event per line, so a reader can act on each as soon as its line ends.
export const encodeAskEvent = (event: AskEvent): string => `${JSON.stringify(event)}\n`;

// The events back from a response body as they arrive. Lines that are not events are skipped.
export async function* readAskEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AskEvent> {
  for await (const line of readLines(body)) {
    const event = parseJson(line);

    if (isAskEvent(event)) {
      yield event;
    }
  }
}
