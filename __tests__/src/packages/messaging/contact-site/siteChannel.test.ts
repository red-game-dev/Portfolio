/**
 * @jest-environment node
 */
import type { CustomFetcher } from "fetchff";

import { ApiClient } from "@/packages/http/api-client";
import { SiteChannel } from "@/packages/messaging/contact-site";

import { settled, useFetchClock } from "../../http/fixtures/fakeClock";

const MESSAGE = { kind: "feedback" as const, message: "More case studies, please.", key: "msg-1234567" };

// A fetcher answering each call with the next answer (the last repeats): a response, or a dropped connection.
const fetcherAnswering = (answers: Array<{ status: number; body: unknown } | "dropped">, seen: string[]): CustomFetcher => (async (url, config) => {
  const answer = answers[Math.min(seen.length, answers.length - 1)];

  seen.push(`${typeof config?.method === "string" ? config.method : "GET"} ${url}`);

  if (answer === "dropped") {
    throw new TypeError("Failed to fetch");
  }

  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { "content-type": "application/json" } });
}) as CustomFetcher;

const channelWith = (answers: Array<{ status: number; body: unknown } | "dropped">, seen: string[] = []) =>
  new SiteChannel(`https://site.test/api/contact/${seen.length}-${Math.random().toString(36)
.slice(2)}`, new ApiClient({}, fetcherAnswering(answers, seen)));

describe("the site's channel, on the real client", () => {
  describe("reading whether it can send", () => {
    useFetchClock();

    test("says whether it can send, once more after a dropped connection or a busy server, and that it cannot tell when no answer comes", async () => {
      const dropped: string[] = [];

      expect(await settled(channelWith(["dropped", { status: 200, body: { isOpen: true } }], dropped).isOpen())).toBe(true);
      expect(dropped).toHaveLength(2);

      const busy: string[] = [];

      expect(await settled(channelWith([{ status: 502, body: {} }, { status: 200, body: { isOpen: false } }], busy).isOpen())).toBe(false);
      expect(busy).toHaveLength(2);

      expect(await settled(channelWith(["dropped"]).isOpen())).toBeNull();
    });

    test("keeps the answer a moment, so every form on a page asks once", async () => {
      const seen: string[] = [];
      const channel = channelWith([{ status: 200, body: { isOpen: true } }], seen);

      await settled(Promise.all([channel.isOpen(), channel.isOpen()]));
      await settled(channel.isOpen());
      expect(seen).toHaveLength(1);
    });
  });

  test("never retries a send, and answers with the server's own refusal, keeping only the problems it knows", async () => {
    const seen: string[] = [];
    const refused = channelWith([{ status: 502, body: { error: "failed" } }, { status: 200, body: { ok: true } }], seen);

    expect(await refused.deliver(MESSAGE)).toEqual({ kind: "refused", refusal: "failed", problems: [] });
    expect(seen).toEqual([expect.stringMatching(/^POST /)]);

    expect(await channelWith([{ status: 400, body: { error: "invalid", problems: ["messageShort", "made-up"] } }]).deliver(MESSAGE))
      .toEqual({ kind: "refused", refusal: "invalid", problems: ["messageShort"] });
    expect(await channelWith([{ status: 503, body: { error: "full" } }]).deliver(MESSAGE)).toEqual({ kind: "refused", refusal: "full", problems: [] });
    expect(await channelWith(["dropped"]).deliver(MESSAGE)).toEqual({ kind: "refused", refusal: "failed", problems: [] });
    expect(await channelWith([{ status: 200, body: { ok: true } }]).deliver(MESSAGE)).toEqual({ kind: "sent" });
  });
});
