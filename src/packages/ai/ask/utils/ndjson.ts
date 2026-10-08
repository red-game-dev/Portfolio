import { AskEvent } from "../domain/types";

const EVENT_TYPES = new Set(["model", "text", "sources", "done", "error"]);

const isAskEvent = (value: unknown): value is AskEvent => typeof value === "object" && value !== null
  && EVENT_TYPES.has((value as { type?: unknown }).type as string);

// One event per line, so a reader can act on each as soon as its line ends.
export const encodeAskEvent = (event: AskEvent): string => `${JSON.stringify(event)}\n`;

// Reads the events back from a response body as they arrive. Lines that are not events are skipped.
export async function* readAskEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AskEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parse = (line: string): AskEvent | null => {
    try {
      const value: unknown = JSON.parse(line);

      return isAskEvent(value) ? value : null;
    } catch {
      return null;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();

    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");

    buffer = done ? "" : lines.pop() ?? "";

    for (const line of lines) {
      const event = line.trim() ? parse(line) : null;

      if (event) {
        yield event;
      }
    }

    if (done) {
      return;
    }
  }
}
