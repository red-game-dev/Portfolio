/**
 * @jest-environment node
 */
import { ApiClient } from "@/packages/http/api-client";

import { settled, useFetchClock } from "../../packages/http/fixtures/fakeClock";
import { recordingFetcher, SeenCall } from "../../packages/http/fixtures/fetcher";

describe("the forms' delivery", () => {
  useFetchClock();
  afterEach(() => jest.restoreAllMocks());

  test("is the site's own server first, then the visitor's own email app, the server's channel one for the whole page", async () => {
    const sent: SeenCall[] = [];
    const answer = (call: SeenCall) => (call.method === "GET" ? { status: 200, body: { isOpen: true } } : { status: 503, body: { error: "full" } });

    jest.spyOn(ApiClient, "global").mockReturnValue(new ApiClient({}, recordingFetcher(answer, sent)));

    const { createContactDelivery } = await import("@/services/contact/client");
    const card = createContactDelivery("inbox@example.test", "Hiring: CTO");
    const finale = createContactDelivery("inbox@example.test", "Feedback");

    expect(await settled(card.status())).toBe("open");
    expect(await settled(finale.status())).toBe("open");
    expect(await settled(card.deliver({ kind: "message", message: "Shall we talk about the role?", email: "a@example.test", subject: "Hiring: CTO" })))
      .toMatchObject({ kind: "fallback", refusal: "full", href: expect.stringContaining("mailto:inbox@example.test?subject=Hiring%3A%20CTO") });
    expect(sent.find((call) => call.method === "POST"))
      .toMatchObject({ url: expect.stringContaining("/api/contact/"), body: expect.objectContaining({ kind: "message" }) });
    expect(card.linkFor({ message: "Hi" })).toBe("mailto:inbox@example.test?subject=Hiring%3A%20CTO&body=Hi");
  });
});
