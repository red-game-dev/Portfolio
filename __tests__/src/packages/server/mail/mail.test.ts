import { ApiClient } from "@/packages/http/api-client";
import { Mail, MailAdapter, MailResult, MailService, ResendMailAdapter } from "@/packages/server/mail";

const MAIL: Mail = {
  sender: { name: "Site", user: "site", domain: "example.test" },
  to: "inbox@example.test",
  subject: "[example.test] Hello",
  text: "Hi there",
  replyTo: "visitor@example.test",
};

// A client that keeps the config it was made with and the posts it was asked to make, answering with `status`.
const clientAnswering = (status: number) => {
  const calls: { config: unknown; posts: Array<{ path: string; body: unknown; options: unknown }> } = { config: null, posts: [] };
  const instance = {
    post: async (path: string, body: unknown, options: unknown) => {
      calls.posts.push({ path, body, options });

      return status === 200 ? { ok: true, status, data: { id: "email-1" } } : { ok: false, status, message: "refused", isCancelled: false, data: null };
    },
  };
  const client = { withConfig: (config: unknown) => {
    calls.config = config;

    return instance;
  } } as unknown as ApiClient;

  return { client, calls };
};

// An adapter that answers as told, counting its sends.
class FakeAdapter extends MailAdapter {
  public sends = 0;

  constructor(public readonly id: string, private readonly outcome: MailResult["outcome"]) {
    super();
  }

  public async send(): Promise<MailResult> {
    this.sends += 1;

    return { outcome: this.outcome, adapter: this.id, status: this.outcome === "sent" ? 200 : this.outcome === "limited" ? 429 : 500, ms: 5 };
  }
}

describe("mail adapters", () => {
  test("Resend's adapter posts to its API with its key, no retries, from the domain it verified, timed", async () => {
    const { client, calls } = clientAnswering(200);
    let now = 1000;
    const adapter = new ResendMailAdapter("re_test", { domain: "mail.example.test", client, now: () => (now += 120) });

    expect(await adapter.send(MAIL, "key-1")).toEqual({ outcome: "sent", adapter: "resend", status: 200, ms: 120 });
    expect(calls.config).toMatchObject({ baseURL: "https://api.resend.com", headers: { Authorization: "Bearer re_test" }, retry: { retries: 0 } });
    expect(calls.posts[0]).toEqual({
      path: "/emails",
      body: { from: "Site <site@mail.example.test>", to: MAIL.to, subject: MAIL.subject, text: MAIL.text, reply_to: MAIL.replyTo },
      options: { headers: { "Idempotency-Key": "key-1" } },
    });

    await new ResendMailAdapter("re_test", { client }).send({ ...MAIL, replyTo: undefined });
    expect(calls.posts[1].body).toMatchObject({ from: "Site <site@example.test>" });
    expect(calls.posts[1].body).not.toHaveProperty("reply_to");
  });

  test("a provider's limits read as limited, and anything else that fails as failed", async () => {
    expect((await new ResendMailAdapter("re_test", { client: clientAnswering(429).client }).send(MAIL)).outcome).toBe("limited");
    expect((await new ResendMailAdapter("re_test", { client: clientAnswering(403).client }).send(MAIL)).outcome).toBe("failed");
    expect((await new ResendMailAdapter("re_test", { client: clientAnswering(0).client }).send(MAIL)).outcome).toBe("failed");
  });
});

describe("the mail service", () => {
  test("sends through the first provider that accepts, handing over to the next when one refuses", async () => {
    const failing = new FakeAdapter("first", "failed");
    const working = new FakeAdapter("second", "sent");
    const unused = new FakeAdapter("third", "sent");

    expect(await new MailService([failing, working, unused]).send(MAIL)).toMatchObject({ outcome: "sent", adapter: "second" });
    expect([failing.sends, working.sends, unused.sends]).toEqual([1, 1, 0]);
  });

  test("with every provider refusing, says limited if any refused for its limits, so a busy day reads apart from a broken one", async () => {
    expect((await new MailService([new FakeAdapter("a", "limited"), new FakeAdapter("b", "failed")]).send(MAIL)).outcome).toBe("limited");
    expect((await new MailService([new FakeAdapter("a", "failed")]).send(MAIL)).outcome).toBe("failed");
    expect(new MailService([]).isReady).toBe(false);
    expect(await new MailService([]).send(MAIL)).toEqual({ outcome: "failed", adapter: null, status: 0, ms: 0 });
  });
});
