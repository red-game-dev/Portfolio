import { ApiClient } from "@/packages/http/api-client";

describe("the forms' delivery", () => {
  afterEach(() => jest.restoreAllMocks());

  test("is the site's own server first, then the visitor's own email app, the server's channel one for the whole page", async () => {
    const instance = {
      get: jest.fn(async () => ({ ok: true, status: 200, data: { isOpen: true } })),
      post: jest.fn(async () => ({ ok: false, status: 503, message: "", isCancelled: false, data: { error: "full" } })),
    };

    jest.spyOn(ApiClient, "global").mockReturnValue({ withConfig: () => instance } as unknown as ApiClient);

    const { createContactDelivery } = await import("@/services/contact/client");
    const card = createContactDelivery("inbox@example.test", "Hiring: CTO");
    const finale = createContactDelivery("inbox@example.test", "Feedback");

    expect(await card.status()).toBe("open");
    expect(await finale.status()).toBe("open");
    expect(await card.deliver({ kind: "message", message: "Shall we talk about the role?", email: "a@example.test", subject: "Hiring: CTO" }))
      .toMatchObject({ kind: "fallback", refusal: "full", href: expect.stringContaining("mailto:inbox@example.test?subject=Hiring%3A%20CTO") });
    expect(instance.post).toHaveBeenCalledWith("/api/contact/", expect.objectContaining({ kind: "message" }), expect.anything());
    expect(card.linkFor({ message: "Hi" })).toBe("mailto:inbox@example.test?subject=Hiring%3A%20CTO&body=Hi");
  });
});
