/**
 * @jest-environment node
 */
import { ASK_ERROR_STATUS, askErrorForStatus, encodeAskEvent, normaliseQuestion, readAskEvents, SourceSplitter, withoutEmDashes } from "@/packages/ai/ask";

import { bodyOf } from "../fixtures/streams";

describe("SourceSplitter", () => {
  test("shows the answer and keeps the sources line out of it", () => {
    const splitter = new SourceSplitter();
    const shown = ["Red built it.", "\n[[sources: history, projects]]"].map((chunk) => splitter.push(chunk)).join("");
    const { text, keys } = splitter.end(["history", "projects"]);

    expect(shown + text).toBe("Red built it.\n");
    expect(keys).toEqual(["history", "projects"]);
  });

  test("holds back a marker cut across chunks, and releases text that was not one", () => {
    const splitter = new SourceSplitter();

    expect(splitter.push("Done. [[sou")).toBe("Done. ");
    expect(splitter.push("rces: about]]")).toBe("");
    expect(splitter.end(["about"])).toEqual({ text: "", keys: ["about"] });

    const other = new SourceSplitter();

    expect(other.push("a [[")).toBe("a ");
    expect(other.push("note]]")).toBe("[[note]]");
  });

  test("keeps only allowed keys, once each", () => {
    const splitter = new SourceSplitter();

    splitter.push("x[[sources: history, made-up, history ]] trailing");

    expect(splitter.end(["history"]).keys).toEqual(["history"]);
  });
});

describe("the wire", () => {
  test("events read back as written, even when lines arrive in pieces, and other lines are skipped", async () => {
    const encoded = [encodeAskEvent({ type: "model", label: "Gemini" }), encodeAskEvent({ type: "text", text: "Hi" }), encodeAskEvent({ type: "done" })].join("");
    const events = [];

    for await (const event of readAskEvents(bodyOf([encoded.slice(0, 9), encoded.slice(9, 40), encoded.slice(40), "not json\n"]))) {
      events.push(event);
    }

    expect(events).toEqual([{ type: "model", label: "Gemini" }, { type: "text", text: "Hi" }, { type: "done" }]);
  });

  test("one status map serves the server and the client", () => {
    (Object.keys(ASK_ERROR_STATUS) as Array<keyof typeof ASK_ERROR_STATUS>).forEach((code) => expect(askErrorForStatus(ASK_ERROR_STATUS[code])).toBe(code));
    expect(askErrorForStatus(418)).toBe("failed");
  });

  test("text helpers: em dashes become commas, and the same question in other words of case and punctuation is one", () => {
    expect(withoutEmDashes("Red — an architect—builds")).toBe("Red, an architect, builds");
    expect(normaliseQuestion("  What has Red BUILT with AI?? ")).toBe(normaliseQuestion("what has red built with ai"));
  });
});
