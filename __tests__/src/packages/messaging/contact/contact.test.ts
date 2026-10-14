import {
  CONTACT_LIMITS, ContactChannel, ContactDelivery, contactMail, contactProblems, ContactService, Delivery, isContactRequest, MAILTO_MOST, MailtoChannel,
  SendCeiling, SendRecord, SiteChannel,
} from "@/packages/messaging/contact";
import { ApiClient } from "@/packages/http/api-client";
import type { Mail, Mailer, MailOutcome } from "@/packages/server/mail";

const ROUTE = { sender: { name: "Site", user: "site", domain: "example.test" }, to: "inbox@example.test", site: "example.test" };
const MESSAGE = { kind: "message" as const, message: "Hello, I would like to talk about a role.", email: "visitor@example.test", name: "Ada", subject: "Hiring: CTO" };

// A sender that keeps what it was asked to send and answers as told.
const senderAnswering = (outcome: MailOutcome, status = outcome === "sent" ? 200 : outcome === "limited" ? 429 : 403) => {
  const sent: Mail[] = [];
  const sender: Mailer = { send: async (mail) => {
    sent.push(mail);

    return { outcome, adapter: "fake", status, ms: 240 };
  } };

  return { sender, sent };
};

// A day's ceiling of `room` sends, counting what is taken and given back.
const ceiling = (room: number) => {
  const counts = { taken: 0, refunded: 0 };
  const day: SendCeiling = {
    hasRoom: async () => counts.taken - counts.refunded < room,
    take: async () => {
      counts.taken += 1;

      return counts.taken - counts.refunded <= room;
    },
    refund: async () => {
      counts.refunded += 1;
    },
  };

  return { day, counts };
};

const visitorAllowing = (isAllowed: boolean) => ({ take: async () => isAllowed });

describe("the site's messages and feedback", () => {
  test("a request has its kind, its message as text, and any other field as text", () => {
    expect(isContactRequest(MESSAGE)).toBe(true);
    expect(isContactRequest({ kind: "feedback", message: "Nice site, more case studies please." })).toBe(true);
    expect(isContactRequest({ kind: "spam", message: "x" })).toBe(false);
    expect(isContactRequest({ kind: "message", message: 4 })).toBe(false);
    expect(isContactRequest({ kind: "message", message: "hi", email: 1 })).toBe(false);
    expect(isContactRequest(null)).toBe(false);
  });

  test("a message needs a sentence and an email to answer; feedback may stay anonymous; nothing too long", () => {
    expect(contactProblems(MESSAGE)).toEqual([]);
    expect(contactProblems({ kind: "feedback", message: "More case studies, please." })).toEqual([]);
    expect(contactProblems({ kind: "message", message: "hi" })).toEqual(["messageShort", "emailMissing"]);
    expect(contactProblems({ kind: "feedback", message: "Good site overall.", email: "not an email" })).toEqual(["emailInvalid"]);
    expect(contactProblems({ ...MESSAGE, message: "x".repeat(CONTACT_LIMITS.messageMost + 1) })).toEqual(["messageLong"]);
    expect(contactProblems({ ...MESSAGE, name: "n".repeat(CONTACT_LIMITS.nameMost + 1), subject: "s".repeat(CONTACT_LIMITS.subjectMost + 1) }))
      .toEqual(["nameLong", "subjectLong"]);
    expect(contactProblems({ ...MESSAGE, message: `   ${"short"}   ` })).toEqual(["messageShort"]);
  });

  test("becomes an email under the visitor's subject, saying who it is from, with replies going straight back", () => {
    const mail = contactMail({ ...MESSAGE, subject: "Hiring:\n CTO" }, ROUTE);

    expect(mail).toMatchObject({ sender: ROUTE.sender, to: ROUTE.to, subject: "[example.test] Hiring: CTO", replyTo: "visitor@example.test" });
    expect(mail.text).toContain(MESSAGE.message);
    expect(mail.text).toContain("From: Ada <visitor@example.test>");

    const feedback = contactMail({ kind: "feedback", message: "More case studies, please." }, ROUTE);

    expect(feedback.subject).toBe("[example.test] Feedback");
    expect(feedback.text).toContain("From: Anonymous");
    expect(feedback.replyTo).toBeUndefined();
  });

  test("is sent once it is valid and neither the visitor nor the day has run out, and the site says whether it can send", async () => {
    const { sender, sent } = senderAnswering("sent");
    const { day } = ceiling(1);
    const service = new ContactService({ mailer: sender, route: ROUTE, visitor: visitorAllowing(true), day });

    expect(await service.status()).toEqual({ isOpen: true });
    expect(await service.send(MESSAGE, "visitor")).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(await service.status()).toEqual({ isOpen: false });
    expect(await service.send(MESSAGE, "visitor")).toEqual({ error: "full" });
    expect(sent).toHaveLength(1);
  });

  test("a bot that fills the hidden field is told it was sent, and nothing is", async () => {
    const { sender, sent } = senderAnswering("sent");
    const service = new ContactService({ mailer: sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day });

    expect(await service.send({ ...MESSAGE, website: "https://spam.example" }, "bot")).toEqual({ ok: true });
    expect(sent).toEqual([]);
  });

  test("refuses what is not valid, what it cannot send, and a visitor sending too many", async () => {
    const { sender, sent } = senderAnswering("sent");
    const open = new ContactService({ mailer: sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day });

    expect(await open.send({ kind: "message" }, "visitor")).toEqual({ error: "invalid" });
    expect(await open.send({ kind: "message", message: "hi" }, "visitor")).toEqual({ error: "invalid", problems: ["messageShort", "emailMissing"] });
    expect(await new ContactService({ mailer: null, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day }).send(MESSAGE, "v"))
      .toEqual({ error: "unavailable" });
    expect(await new ContactService({ mailer: sender, route: null, visitor: visitorAllowing(true), day: ceiling(10).day }).status()).toEqual({ isOpen: false });
    expect(await new ContactService({ mailer: sender, route: ROUTE, visitor: visitorAllowing(false), day: ceiling(10).day }).send(MESSAGE, "v"))
      .toEqual({ error: "limited" });
    expect(sent).toEqual([]);
  });

  test("a send that fails gives its place in the day back; the provider's own limit reads as the day being full", async () => {
    const failing = ceiling(5);
    const failed = new ContactService({ mailer: senderAnswering("failed").sender, route: ROUTE, visitor: visitorAllowing(true), day: failing.day });

    expect(await failed.send(MESSAGE, "visitor")).toEqual({ error: "failed" });
    expect(failing.counts).toEqual({ taken: 1, refunded: 1 });

    const limited = new ContactService({ mailer: senderAnswering("limited").sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day });

    expect(await limited.send(MESSAGE, "visitor")).toEqual({ error: "full" });
  });

  test("logs each send with its outcome, the provider that tried and its status, its time, and nothing about the visitor or the message", async () => {
    const records: SendRecord[] = [];
    const service = new ContactService({
      mailer: senderAnswering("sent").sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day, onSend: (record) => records.push(record),
    });

    await service.send(MESSAGE, "visitor");
    expect(records).toEqual([{ outcome: "sent", adapter: "fake", providerStatus: 200, ms: 240 }]);
    expect(JSON.stringify(records)).not.toContain("visitor@example.test");
  });

  test("after the mail service refuses for a reason other than its limits, the site says it cannot send for a while", async () => {
    let isDown = false;
    const health = { isDown: async () => isDown, reportDown: async () => {
      isDown = true;
    } };
    const limited = new ContactService({ mailer: senderAnswering("limited").sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day, health });

    await limited.send(MESSAGE, "visitor");
    expect(isDown).toBe(false);

    const failing = new ContactService({ mailer: senderAnswering("failed").sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day, health });

    expect(await failing.status()).toEqual({ isOpen: true });
    await failing.send(MESSAGE, "visitor");
    expect(await failing.status()).toEqual({ isOpen: false });
  });

  test("the fallback channel hands the visitor a mail link with their message, short enough for every mail app", async () => {
    const channel = new MailtoChannel("inbox@example.test", "Feedback on your site");

    expect(channel.linkFor({ message: "  Shall we talk?  ", subject: "Hiring: CTO & more" }))
      .toBe("mailto:inbox@example.test?subject=Hiring%3A%20CTO%20%26%20more&body=Shall%20we%20talk%3F");
    expect(channel.linkFor({ message: "a".repeat(MAILTO_MOST + 500) })).toMatch(new RegExp(`subject=Feedback%20on%20your%20site&body=a{${MAILTO_MOST}}$`));
    expect(await channel.isOpen()).toBe(true);
    expect(await channel.deliver({ kind: "feedback", message: "Hi there, nice site." })).toMatchObject({ kind: "link" });
  });
});

describe("the site's channel", () => {
  // A client answering as told, keeping the options of each call.
  const clientWith = (get: unknown, post: unknown) => {
    const calls: Array<{ method: string; options?: unknown }> = [];
    let config: unknown = null;
    const instance = {
      get: async (_: string, options: unknown) => {
        calls.push({ method: "GET", options });

        return get;
      },
      post: async () => {
        calls.push({ method: "POST" });

        return post;
      },
    };

    return { client: { withConfig: (made: unknown) => {
      config = made;

      return instance;
    } } as unknown as ApiClient, calls, configOf: () => config };
  };

  test("asks whether it can send through a read kept and shared a moment, retried once, and never retries a send", async () => {
    const { client, calls, configOf } = clientWith({ ok: true, status: 200, data: { isOpen: true } }, { ok: true, status: 200, data: { ok: true } });
    const channel = new SiteChannel("/api/contact/", client);

    expect(await channel.isOpen()).toBe(true);
    expect(calls[0].options).toEqual({ cacheSeconds: 30, dedupeMs: 2000 });
    expect(configOf()).toMatchObject({ retry: { retries: 1, methods: ["GET"] } });
    expect(await channel.deliver(MESSAGE)).toEqual({ kind: "sent" });
  });

  test("answers with the refusal the server gave, read from its body, and failed when no server answered", async () => {
    const refusing = new SiteChannel("/api/contact/", clientWith(null, {
      ok: false, status: 400, message: "", isCancelled: false, data: { error: "invalid", problems: ["messageShort"] },
    }).client);

    expect(await refusing.deliver(MESSAGE)).toEqual({ kind: "refused", refusal: "invalid", problems: ["messageShort"] });

    const full = new SiteChannel("/api/contact/", clientWith(null, { ok: false, status: 503, message: "", isCancelled: false, data: { error: "full" } }).client);

    expect(await full.deliver(MESSAGE)).toEqual({ kind: "refused", refusal: "full", problems: [] });

    const offline = new SiteChannel("/api/contact/", clientWith({ ok: false, status: 0, message: "", isCancelled: false, data: null },
      { ok: false, status: 0, message: "", isCancelled: false, data: null }).client);

    expect(await offline.isOpen()).toBe(false);
    expect(await offline.deliver(MESSAGE)).toEqual({ kind: "refused", refusal: "failed", problems: [] });
  });
});

describe("delivering a message", () => {
  // A channel answering as told.
  class Answering extends ContactChannel {
    public delivered = 0;

    constructor(public readonly id: string, private readonly open: boolean | Error, private readonly answer: Delivery | Error) {
      super();
    }

    public async isOpen(): Promise<boolean> {
      if (this.open instanceof Error) {
        throw this.open;
      }

      return this.open;
    }

    public async deliver(): Promise<Delivery> {
      this.delivered += 1;

      if (this.answer instanceof Error) {
        throw this.answer;
      }

      return this.answer;
    }
  }

  const fallback = () => new MailtoChannel("inbox@example.test", "Feedback");

  test("sends through the first open channel, and stops at an invalid message", async () => {
    const site = new Answering("site", true, { kind: "sent" });

    expect(await new ContactDelivery([site, fallback()]).deliver(MESSAGE)).toEqual({ kind: "sent" });

    const invalid = new Answering("site", true, { kind: "refused", refusal: "invalid", problems: ["emailMissing"] });

    expect(await new ContactDelivery([invalid, fallback()]).deliver(MESSAGE)).toEqual({ kind: "invalid", problems: ["emailMissing"] });
  });

  test("hands a refused, closed or broken channel's message to the fallback with why, and says it is open only while a sender is", async () => {
    const full = await new ContactDelivery([new Answering("site", true, { kind: "refused", refusal: "full", problems: [] }), fallback()]).deliver(MESSAGE);

    expect(full).toMatchObject({ kind: "fallback", refusal: "full" });
    expect(full.kind === "fallback" && full.href).toContain("mailto:inbox@example.test");

    const closed = new Answering("site", false, { kind: "sent" });

    expect(await new ContactDelivery([closed, fallback()]).deliver(MESSAGE)).toMatchObject({ kind: "fallback", refusal: "unavailable" });
    expect(closed.delivered).toBe(0);
    expect(await new ContactDelivery([new Answering("site", true, new Error("gone")), fallback()]).deliver(MESSAGE))
      .toMatchObject({ kind: "fallback", refusal: "failed" });

    expect(await new ContactDelivery([new Answering("site", true, { kind: "sent" }), fallback()]).isOpen()).toBe(true);
    expect(await new ContactDelivery([new Answering("site", new Error("offline"), { kind: "sent" }), fallback()]).isOpen()).toBe(false);
  });
});
