import { ApiClient } from "@/packages/http/api-client";
import { Mail, MailAdapter, MailAttempt, MailOutcome, MailService, ResendMailAdapter } from "@/packages/server/mail";

const MAIL: Mail = {
  sender: { name: "Site", user: "site", domain: "example.test" },
  to: "inbox@example.test",
  subject: "[example.test] Hello",
  text: "Hi there",
  replyTo: "visitor@example.test",
};

// A client that keeps the config it was made with and the posts it was asked to make, answering with `status`.
const clientAnswering = (status: number, data: unknown = null) => {
  const calls: { config: unknown; posts: Array<{ path: string; body: unknown; options: unknown }> } = { config: null, posts: [] };
  const instance = {
    post: async (path: string, body: unknown, options: unknown) => {
      calls.posts.push({ path, body, options });

      return status === 200 ? { ok: true, status, data: { id: "email-1" } } : { ok: false, status, message: "refused", isCancelled: false, data };
    },
  };
  const client = { withConfig: (config: unknown) => {
    calls.config = config;

    return instance;
  } } as unknown as ApiClient;

  return { client, calls };
};

// An adapter answering each try with the next outcome (the last repeats), counting its tries and the keys it was given.
class FakeAdapter extends MailAdapter {
  public keys: Array<string | undefined> = [];

  constructor(public readonly id: string, private readonly outcomes: Array<MailOutcome | Error>) {
    super();
  }

  public async send(_: Mail, idempotencyKey?: string): Promise<MailAttempt> {
    const outcome = this.outcomes[Math.min(this.keys.length, this.outcomes.length - 1)];

    this.keys.push(idempotencyKey);

    if (outcome instanceof Error) {
      throw outcome;
    }

    return { adapter: this.id, outcome, status: { sent: 200, limited: 429, rejected: 403, failed: 0 }[outcome], ms: 5 };
  }
}

describe("mail adapters", () => {
  test("Resend's adapter posts to its API with its key, no retries of its own, from the domain it verified, keyed and timed", async () => {
    const { client, calls } = clientAnswering(200);
    let now = 1000;
    const adapter = new ResendMailAdapter("re_test", { domain: "mail.example.test", client, now: () => (now += 120) });

    expect(await adapter.send(MAIL, "key-1")).toEqual({ adapter: "resend", outcome: "sent", status: 200, ms: 120 });
    expect(calls.config).toMatchObject({ baseURL: "https://api.resend.com", headers: { Authorization: "Bearer re_test" }, retry: { retries: 0 } });
    expect(calls.posts[0]).toEqual({
      path: "/emails",
      body: { from: "Site <site@mail.example.test>", to: MAIL.to, subject: MAIL.subject, text: MAIL.text, reply_to: MAIL.replyTo },
      options: { headers: { "Idempotency-Key": "key-1" } },
    });

    await new ResendMailAdapter("re_test", { client }).send({ ...MAIL, html: "<p>Hi there</p>", replyTo: undefined });
    expect(calls.posts[1].body).toMatchObject({ html: "<p>Hi there</p>", text: MAIL.text });
    expect(calls.posts[1].body).toMatchObject({ from: "Site <site@example.test>" });
    expect(calls.posts[1].body).not.toHaveProperty("reply_to");
    expect(calls.posts[1].options).toEqual({ headers: {} });
  });

  test("a provider's limits read as limited, a refusal of who is sending as rejected, and anything else as maybe gone", async () => {
    const outcomeFor = async (status: number) => (await new ResendMailAdapter("re_test", { client: clientAnswering(status).client }).send(MAIL)).outcome;

    expect(await outcomeFor(429)).toBe("limited");
    expect(await outcomeFor(401)).toBe("rejected");
    expect(await outcomeFor(403)).toBe("rejected");
    // A key still being worked on, or reused for another email, refuses this email alone, and it may have gone.
    expect(await outcomeFor(409)).toBe("failed");
    expect(await outcomeFor(422)).toBe("failed");
    expect(await outcomeFor(500)).toBe("failed");
    expect(await outcomeFor(0)).toBe("failed");
  });
});

describe("the mail service", () => {
  test("hands a definite refusal to the next provider, keeping every try", async () => {
    const limited = new FakeAdapter("first", ["limited"]);
    const rejected = new FakeAdapter("second", ["rejected"]);
    const working = new FakeAdapter("third", ["sent"]);
    const result = await new MailService([limited, rejected, working]).send(MAIL, "key-1");

    expect(result.outcome).toBe("sent");
    expect(result.attempts.map((attempt) => `${attempt.adapter}:${attempt.outcome}`)).toEqual(["first:limited", "second:rejected", "third:sent"]);
  });

  test("tries a provider that gave no answer once more with the same key, after a pause, and never hands it on, which could send it twice", async () => {
    const flaky = new FakeAdapter("flaky", ["failed", "sent"]);
    const next = new FakeAdapter("next", ["sent"]);
    const pauses: number[] = [];
    const pause = async (ms: number) => {
      pauses.push(ms);
    };

    expect((await new MailService([flaky, next], { pause }).send(MAIL, "key-1")).outcome).toBe("sent");
    expect(flaky.keys).toEqual(["key-1", "key-1"]);
    expect(next.keys).toEqual([]);
    expect(pauses).toEqual([750]);

    const down = new FakeAdapter("down", ["failed"]);
    const spare = new FakeAdapter("spare", ["sent"]);
    const result = await new MailService([down, spare], { pause }).send(MAIL, "key-2");

    expect(result.outcome).toBe("failed");
    expect(spare.keys).toEqual([]);

    // Without a key a second try could send it twice, so there is none.
    const unkeyed = new FakeAdapter("unkeyed", ["failed", "sent"]);

    expect((await new MailService([unkeyed], { pause }).send(MAIL)).outcome).toBe("failed");
    expect(unkeyed.keys).toHaveLength(1);
  });

  test("counts a provider that throws as failing, and starts no new try past its deadline", async () => {
    expect(await new MailService([new FakeAdapter("broken", [new Error("SDK blew up")])], { pause: async () => undefined }).send(MAIL))
      .toMatchObject({ outcome: "failed", attempts: [{ adapter: "broken", outcome: "failed", status: 0 }] });

    let now = 0;
    const slow = new FakeAdapter("slow", ["limited"]);
    const late = new FakeAdapter("late", ["sent"]);
    const service = new MailService([slow, late], { deadlineMs: 1000, now: () => (now += 600) });

    expect((await service.send(MAIL)).attempts.map((attempt) => attempt.adapter)).toEqual(["slow"]);
  });

  test("with every provider refusing for certain, says limited if any refused for its limits, so a busy day reads apart from a broken one", async () => {
    expect((await new MailService([new FakeAdapter("a", ["limited"]), new FakeAdapter("b", ["rejected"])]).send(MAIL)).outcome).toBe("limited");
    expect((await new MailService([new FakeAdapter("a", ["rejected"])]).send(MAIL)).outcome).toBe("rejected");
    expect(new MailService([]).isReady).toBe(false);
    expect(await new MailService([]).send(MAIL)).toMatchObject({ outcome: "failed", attempts: [] });
  });
});
