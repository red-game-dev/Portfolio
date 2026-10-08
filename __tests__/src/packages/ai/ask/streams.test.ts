/**
 * @jest-environment node
 */
import { encodeAskEvent, EventStreamParser, readAskEvents, SourceSplitter, withoutEmDashes } from "@/packages/ai/ask";

const bodyOf = (chunks: string[]) => {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
};

describe("SourceSplitter", () => {
  test("shows the answer and keeps the sources line out of it", () => {
    const splitter = new SourceSplitter();
    const shown = ["Red built it.", "\n[[sources: history, projects]]"].map((chunk) => splitter.push(chunk)).join("");
    const { text, keys } = splitter.end(["history", "projects"]);

    expect(shown + text).toBe("Red built it.\n");
    expect(keys).toEqual(["history", "projects"]);
  });

  test("holds back a marker cut across chunks instead of showing half of it", () => {
    const splitter = new SourceSplitter();

    expect(splitter.push("Done. [[sou")).toBe("Done. ");
    expect(splitter.push("rces: about]]")).toBe("");
    expect(splitter.end(["about"])).toEqual({ text: "", keys: ["about"] });
  });

  test("releases held text that turned out not to be the marker", () => {
    const splitter = new SourceSplitter();

    expect(splitter.push("a [[")).toBe("a ");
    expect(splitter.push("note]]")).toBe("[[note]]");
    expect(splitter.end([])).toEqual({ text: "", keys: [] });
  });

  test("keeps only allowed keys, once each", () => {
    const splitter = new SourceSplitter();

    splitter.push("x[[sources: history, made-up, history ]] trailing");

    expect(splitter.end(["history"]).keys).toEqual(["history"]);
  });
});

describe("EventStreamParser", () => {
  test("joins an event split across chunks and skips lines that are not data", () => {
    const parser = new EventStreamParser();

    expect(parser.push("event: ping\ndata: {\"a\"")).toEqual([]);
    expect(parser.push(":1}\n\ndata: {\"b\":2}\r\n\r\n")).toEqual(["{\"a\":1}", "{\"b\":2}"]);
  });
});

describe("ndjson events", () => {
  test("reads back what was encoded, even when lines arrive in pieces", async () => {
    const encoded = [encodeAskEvent({ type: "text", text: "Hi" }), encodeAskEvent({ type: "sources", keys: ["about"] }), encodeAskEvent({ type: "done" })].join("");
    const events = [];

    for await (const event of readAskEvents(bodyOf([encoded.slice(0, 7), encoded.slice(7, 30), encoded.slice(30), "not json\n"]))) {
      events.push(event);
    }

    expect(events).toEqual([{ type: "text", text: "Hi" }, { type: "sources", keys: ["about"] }, { type: "done" }]);
  });
});

test("em dashes become commas", () => {
  expect(withoutEmDashes("Red — an architect—builds")).toBe("Red, an architect, builds");
});
