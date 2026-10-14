import { CONTACT_LIMITS, contactMail, contactProblems, ContactService, isContactRequest, SendCeiling } from "@/packages/contact";
import type { Mail, MailOutcome, MailSender } from "@/packages/server/mail";

const ROUTE = { from: "Site <site@example.test>", to: "inbox@example.test", site: "example.test" };
const MESSAGE = { kind: "message" as const, message: "Hello, I would like to talk about a role.", email: "visitor@example.test", name: "Ada", subject: "Hiring: CTO" };

// A sender that keeps what it was asked to send and answers as told.
const senderAnswering = (outcome: MailOutcome) => {
  const sent: Mail[] = [];
  const sender: MailSender = { send: async (mail) => {
    sent.push(mail);

    return outcome;
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

    expect(mail).toMatchObject({ from: ROUTE.from, to: ROUTE.to, subject: "[example.test] Hiring: CTO", replyTo: "visitor@example.test" });
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
    const service = new ContactService({ sender, route: ROUTE, visitor: visitorAllowing(true), day });

    expect(await service.status()).toEqual({ isOpen: true });
    expect(await service.send(MESSAGE, "visitor")).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(await service.status()).toEqual({ isOpen: false });
    expect(await service.send(MESSAGE, "visitor")).toEqual({ error: "full" });
    expect(sent).toHaveLength(1);
  });

  test("a bot that fills the hidden field is told it was sent, and nothing is", async () => {
    const { sender, sent } = senderAnswering("sent");
    const service = new ContactService({ sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day });

    expect(await service.send({ ...MESSAGE, website: "https://spam.example" }, "bot")).toEqual({ ok: true });
    expect(sent).toEqual([]);
  });

  test("refuses what is not valid, what it cannot send, and a visitor sending too many", async () => {
    const { sender, sent } = senderAnswering("sent");
    const open = new ContactService({ sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day });

    expect(await open.send({ kind: "message" }, "visitor")).toEqual({ error: "invalid" });
    expect(await open.send({ kind: "message", message: "hi" }, "visitor")).toEqual({ error: "invalid", problems: ["messageShort", "emailMissing"] });
    expect(await new ContactService({ sender: null, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day }).send(MESSAGE, "v"))
      .toEqual({ error: "unavailable" });
    expect(await new ContactService({ sender, route: null, visitor: visitorAllowing(true), day: ceiling(10).day }).status()).toEqual({ isOpen: false });
    expect(await new ContactService({ sender, route: ROUTE, visitor: visitorAllowing(false), day: ceiling(10).day }).send(MESSAGE, "v"))
      .toEqual({ error: "limited" });
    expect(sent).toEqual([]);
  });

  test("a send that fails gives its place in the day back; the provider's own limit reads as the day being full", async () => {
    const failing = ceiling(5);
    const failed = new ContactService({ sender: senderAnswering("failed").sender, route: ROUTE, visitor: visitorAllowing(true), day: failing.day });

    expect(await failed.send(MESSAGE, "visitor")).toEqual({ error: "failed" });
    expect(failing.counts).toEqual({ taken: 1, refunded: 1 });

    const limited = new ContactService({ sender: senderAnswering("limited").sender, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day });

    expect(await limited.send(MESSAGE, "visitor")).toEqual({ error: "full" });
  });
});
