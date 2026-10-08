/**
 * @jest-environment node
 */
import { AskEvent, readAskEvents } from "@/packages/ai/ask";
import { ASK_EVALS } from "@/services/ask/evals";

// Runs the evals against a deployment, only when one is named, since it calls the real model:
//   ASK_EVAL_URL=https://redgame.dev npx jest __tests__/src/services/ask/evals.test.ts --watchAll=false
const url = process.env.ASK_EVAL_URL;
const suite = url ? describe : describe.skip;

const ask = async (question: string, depth = "quick") => {
  const base = new URL(url ?? "http://localhost");
  const response = await fetch(new URL("/api/ask/", base), {
    method: "POST",
    headers: { "content-type": "application/json", "origin": base.origin },
    body: JSON.stringify({ question, depth }),
  });
  const events: AskEvent[] = [];

  if (!response.ok || !response.body) {
    throw new Error(`The agent answered ${response.status}`);
  }

  for await (const event of readAskEvents(response.body)) {
    events.push(event);
  }

  return {
    text: events.flatMap((event) => (event.type === "text" ? [event.text] : [])).join(""),
    sources: events.flatMap((event) => (event.type === "sources" ? event.keys : [])),
    isDone: events.some((event) => event.type === "done"),
  };
};

suite("Ask Red evals", () => {
  test.each(ASK_EVALS.map((item) => [item.id, item] as const))("%s", async (_id, item) => {
    const { text, sources, isDone } = await ask(item.question, item.depth);
    const answer = text.toLowerCase();

    expect(isDone).toBe(true);
    expect(text).not.toContain("—");
    (item.mentionsAll ?? []).forEach((term) => expect(answer).toContain(term.toLowerCase()));

    if (item.mentionsAny) {
      expect(item.mentionsAny.some((term) => answer.includes(term.toLowerCase()))).toBe(true);
    }

    (item.mentionsNone ?? []).forEach((term) => expect(answer).not.toContain(term.toLowerCase()));

    if (item.cites) {
      expect(item.cites.some((key) => sources.includes(key))).toBe(true);
    }
  }, 60000);
});
