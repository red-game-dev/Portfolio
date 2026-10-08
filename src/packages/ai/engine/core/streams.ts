import { EventStreamParser } from "./EventStreamParser";

// A response body as text, decoded across chunk boundaries.
export async function* readText(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      const rest = decoder.decode();

      if (rest) {
        yield rest;
      }

      return;
    }

    yield decoder.decode(value, { stream: true });
  }
}

// Each complete line of a body, as soon as it ends; a last line without a newline is still given.
export async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  let buffer = "";

  for await (const text of readText(body)) {
    const lines = (buffer + text).split("\n");

    buffer = lines.pop() ?? "";
    yield* lines.filter((line) => line.trim());
  }

  if (buffer.trim()) {
    yield buffer;
  }
}

// The data of each server sent event in a body.
export async function* readServerEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const parser = new EventStreamParser();

  for await (const text of readText(body)) {
    yield* parser.push(text);
  }
}
