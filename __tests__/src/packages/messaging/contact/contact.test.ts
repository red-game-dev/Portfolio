import {
  CONTACT_ART, contactArt, CONTACT_LIMITS, ContactChannel, ContactDelivery, contactHtml, contactMail, contactProblems, ContactService, Delivery, EmailArt,
  EmailLook, EmailTheme, EmailWords, isContactRequest, MAILTO_MOST, MailtoChannel, SendCeiling, SendHealth, SendRecord,
} from "@/packages/messaging/contact";
import type { Mail, Mailer, MailOutcome } from "@/packages/server/mail";

const ROUTE = { sender: { name: "Site", user: "site", domain: "example.test" }, to: "inbox@example.test", site: "example.test" };
const MESSAGE = { kind: "message" as const, message: "Hello, I would like to talk about a role.", email: "visitor@example.test", name: "Ada", subject: "Hiring: CTO" };

// A mailer that keeps what it was asked to send and the keys it was given, answering as told.
const mailerAnswering = (outcome: MailOutcome) => {
  const sent: Array<{ mail: Mail; key?: string }> = [];
  const mailer: Mailer = { send: async (mail, key) => {
    sent.push({ mail, key });

    return { outcome, attempts: [{ adapter: "fake", outcome, status: { sent: 200, limited: 429, rejected: 403, failed: 0 }[outcome], ms: 240 }], ms: 240 };
  } };

  return { mailer, sent };
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

// Whether sending is marked down, as the store would keep it.
const healthKept = () => {
  const kept = { isDown: false, reports: 0, clears: 0 };
  const health: SendHealth = {
    isDown: async () => kept.isDown,
    reportDown: async () => {
      kept.isDown = true;
      kept.reports += 1;
    },
    clear: async () => {
      kept.isDown = false;
      kept.clears += 1;
    },
  };

  return { health, kept };
};

const visitorAllowing = (isAllowed: boolean) => ({ take: async () => isAllowed });

const serviceWith = (outcome: MailOutcome, room = 5) => {
  const { mailer, sent } = mailerAnswering(outcome);
  const { day, counts } = ceiling(room);
  const { health, kept } = healthKept();
  const records: SendRecord[] = [];
  const service = new ContactService({ mailer, route: ROUTE, visitor: visitorAllowing(true), day, health, onSend: (record) => records.push(record) });

  return { service, sent, counts, kept, records };
};

describe("the site's messages and feedback", () => {
  test("a request has its kind, its message as text, and any other field as text", () => {
    expect(isContactRequest(MESSAGE)).toBe(true);
    expect(isContactRequest({ kind: "feedback", message: "Nice site, more case studies please.", key: "k-1234567" })).toBe(true);
    expect(isContactRequest({ kind: "spam", message: "x" })).toBe(false);
    expect(isContactRequest({ kind: "message", message: 4 })).toBe(false);
    expect(isContactRequest({ kind: "message", message: "hi", email: 1 })).toBe(false);
    expect(isContactRequest({ kind: "message", message: "hi", key: 5 })).toBe(false);
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

  test("is sent under its key once it is valid and neither the visitor nor the day has run out, logged without the visitor", async () => {
    const { mailer, sent } = mailerAnswering("sent");
    const { day } = ceiling(1);
    const records: SendRecord[] = [];
    const service = new ContactService({ mailer, route: ROUTE, visitor: visitorAllowing(true), day, onSend: (record) => records.push(record) });

    expect(await service.status()).toEqual({ isOpen: true });
    expect(await service.send({ ...MESSAGE, key: "msg-1234567" }, "visitor")).toEqual({ ok: true });
    expect(sent[0].key).toBe("msg-1234567");
    expect(records).toEqual([{ outcome: "sent", attempts: [{ adapter: "fake", outcome: "sent", status: 200, ms: 240 }], ms: 240 }]);
    expect(JSON.stringify(records)).not.toContain("visitor@example.test");
    expect(await service.status()).toEqual({ isOpen: false });
    expect(await service.send(MESSAGE, "visitor")).toEqual({ error: "full" });
    expect(sent).toHaveLength(1);

    // A key that could not name a message is not passed on.
    const loose = mailerAnswering("sent");

    await new ContactService({ mailer: loose.mailer, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day }).send({ ...MESSAGE, key: "bad key!" }, "v");
    expect(loose.sent[0].key).toBeUndefined();
  });

  test("a bot that fills the hidden field is told it was sent, and nothing is", async () => {
    const { service, sent } = serviceWith("sent");

    expect(await service.send({ ...MESSAGE, website: "https://spam.example" }, "bot")).toEqual({ ok: true });
    expect(sent).toEqual([]);
  });

  test("refuses what is not valid, what it cannot send, and a visitor sending too many", async () => {
    const { mailer, sent } = mailerAnswering("sent");
    const open = new ContactService({ mailer, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day });

    expect(await open.send({ kind: "message" }, "visitor")).toEqual({ error: "invalid" });
    expect(await open.send({ kind: "message", message: "hi" }, "visitor")).toEqual({ error: "invalid", problems: ["messageShort", "emailMissing"] });
    expect(await new ContactService({ mailer: null, route: ROUTE, visitor: visitorAllowing(true), day: ceiling(10).day }).send(MESSAGE, "v"))
      .toEqual({ error: "unavailable" });
    expect(await new ContactService({ mailer, route: null, visitor: visitorAllowing(true), day: ceiling(10).day }).status()).toEqual({ isOpen: false });
    expect(await new ContactService({ mailer, route: ROUTE, visitor: visitorAllowing(false), day: ceiling(10).day }).send(MESSAGE, "v"))
      .toEqual({ error: "limited" });
    expect(sent).toEqual([]);
  });

  test("a send that does not go gives its place in the day back; the providers' limits read as the day being full", async () => {
    const failing = serviceWith("failed");

    expect(await failing.service.send(MESSAGE, "visitor")).toEqual({ error: "failed" });
    expect(failing.counts).toEqual({ taken: 1, refunded: 1 });
    expect(await serviceWith("limited").service.send(MESSAGE, "visitor")).toEqual({ error: "full" });

    const throwing = new ContactService({
      mailer: { send: async () => {
        throw new Error("gone");
      } },
      route: ROUTE, visitor: visitorAllowing(true), day: ceiling(5).day,
    });

    expect(await throwing.send(MESSAGE, "visitor")).toEqual({ error: "failed" });
  });

  test("only a definite rejection marks sending down for a while; no answer is a blip; a send that goes clears it", async () => {
    const blip = serviceWith("failed");

    await blip.service.send(MESSAGE, "visitor");
    expect(blip.kept.isDown).toBe(false);

    const rejected = serviceWith("rejected");

    expect(await rejected.service.status()).toEqual({ isOpen: true });
    expect(await rejected.service.send(MESSAGE, "visitor")).toEqual({ error: "failed" });
    expect(await rejected.service.status()).toEqual({ isOpen: false });

    const healed = serviceWith("sent");

    healed.kept.isDown = true;
    await healed.service.send(MESSAGE, "visitor");
    expect(healed.kept.isDown).toBe(false);
  });
});

describe("the email a message becomes", () => {
  const JOURNEY = ["#4bffa5", "#4fd8ff", "#b896ff", "#ff5fa2", "#ffc45c", "#c4d2ff"];
  const THEME: EmailTheme = {
    background: "#0b0b0b", panel: "#101010", border: "#1e1e1e", heading: "#ffffff", text: "#d6dcd9", muted: "#8a948f",
    accents: { message: "#4bffa5", feedback: "#c4d2ff" }, journey: JOURNEY, font: "Roboto, sans-serif", mono: "monospace", siteUrl: "https://www.example.test",
  };
  const WORDS: EmailWords = { kinds: { message: "Message", feedback: "Feedback" }, from: "From", anonymous: "Anonymous", reply: "Reply goes back.", footer: "Sent on" };
  const ART: Record<"message" | "feedback", EmailArt> = {
    message: { moving: "https://art.test/message.gif?v=1", still: "https://art.test/message-still.gif?v=1" },
    feedback: { moving: "https://art.test/feedback.gif?v=1", still: "https://art.test/feedback-still.gif?v=1" },
  };
  const LOOK: EmailLook = { theme: THEME, words: WORDS };

  test("looks as the site does, in the accent of its kind, saying who sent it and that a reply goes back only when it can", () => {
    const message = contactHtml(MESSAGE, "Hiring: CTO", "Ada <visitor@example.test>", LOOK);
    const feedback = contactHtml({ kind: "feedback", message: "More case studies, please." }, "Feedback", null, LOOK);

    expect(message).toContain("mso-line-height-rule:exactly;font-size:0;background:#4bffa5;");
    expect(message).toContain(">Message<");
    expect(message).toContain("Hiring: CTO");
    expect(message).toContain("Reply goes back.");
    expect(message).toContain("example.test");
    expect(feedback).toContain("background:#c4d2ff;");
    expect(feedback).toContain("Anonymous");
    expect(feedback).not.toContain("Reply goes back.");
  });

  test("tops the panel with its kind's art where it is given, the bar at rest in its place for a reader who asked for less motion", () => {
    const message = contactHtml(MESSAGE, "Hiring: CTO", null, { ...LOOK, art: ART });
    const feedback = contactHtml({ kind: "feedback", message: "More case studies, please." }, "Feedback", null, { ...LOOK, art: ART });

    expect(message).toContain('<picture><source srcset="https://art.test/message-still.gif?v=1" media="(prefers-reduced-motion: reduce)">' +
      '<img src="https://art.test/message.gif?v=1"');
    // Drawn across the panel at its own height, however wide the screen.
    expect(message).toContain(`width="${CONTACT_ART.width * 2}" height="${CONTACT_ART.height}" alt=""`);
    expect(message).toContain(`style="display:block;width:100%;height:${CONTACT_ART.height}px;`);
    expect(message).not.toContain("mso-line-height-rule:exactly;font-size:0;background:#4bffa5;");
    expect(feedback).toContain('<img src="https://art.test/feedback.gif?v=1"');
  });

  test("moves lightly where a mail app plays CSS, never for a reader who asked for less, and hides nothing where motion is stripped", () => {
    const html = contactHtml(MESSAGE, "Hiring: CTO", null, { ...LOOK, art: ART });
    const style = /<style>([\s\S]*)<\/style>/.exec(html)?.[1] ?? "";

    expect(style).toContain("@keyframes rg-rise");
    expect(style).toContain("@media (prefers-reduced-motion: reduce) { .rg-rise { animation: none !important; } }");
    expect(style.match(/@keyframes/g)).toHaveLength(1);
    // The panel's look stands inline, so a mail app that drops the style block loses nothing, and nothing ever fades.
    expect(html).toMatch(/class="rg-rise"[^>]*style="[^"]*border-left:2px solid #4bffa5/);
    expect(style).not.toContain("opacity");
  });

  test("gives the message more room on a phone", () => {
    const html = contactHtml(MESSAGE, "Hiring: CTO", null, LOOK);

    expect(html).toContain("@media (max-width: 480px)");
    expect(html).toMatch(/class="rg-frame"[^>]*style="padding:32px 16px;"/);
    expect(html.match(/class="rg-pad"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(html).toMatch(/class="rg-note" style="padding:16px 18px;/);
  });

  test("wraps a long unbroken word, such as a link, rather than widening the email past the screen", () => {
    const html = contactHtml({ ...MESSAGE, message: `See https://example.test/${"a".repeat(150)}` }, "Hiring", "Ada <a@b.test>", LOOK);

    expect(html).toMatch(/overflow-wrap:anywhere;">See https/);
    expect(html).toMatch(/<h1 style="[^"]*overflow-wrap:anywhere;">Hiring<\/h1>/);
    expect(html).toMatch(/overflow-wrap:anywhere;">\n<span[^>]*>From<\/span> Ada/);
  });

  test("escapes everything a visitor wrote, keeping their line breaks, so nothing in a message can change the email", () => {
    const html = contactHtml({ ...MESSAGE, message: "Hi\n<script>alert(1)</script> & \"quotes\"" }, "<b>Hiring</b>", "Ada <a@b.test>", LOOK);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Hiring</b>");
    expect(html).toContain("Hi<br>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;");
    expect(html).toContain("Ada &lt;a@b.test&gt;");
  });

  test("escapes a hostile name and subject on the way the site really sends, through the mail it builds", () => {
    const hostile = { ...MESSAGE, name: "<img src=x onerror=alert(1)>", subject: "\"><script>x</script>" };
    const html = contactMail(hostile, { ...ROUTE, look: LOOK }).html ?? "";
    const withArt = contactMail(hostile, { ...ROUTE, look: { ...LOOK, art: ART } }).html ?? "";

    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;x&lt;/script&gt;");
    // With the art, its own picture is the only image.
    expect(withArt.match(/<img/g)).toHaveLength(1);
    expect(withArt).not.toContain("<script");
  });

  test("goes with the plain text where the site gives it a look, and as plain text alone where it does not", () => {
    expect(contactMail(MESSAGE, { ...ROUTE, look: LOOK }).html).toContain("<!doctype html>");
    expect(contactMail(MESSAGE, ROUTE).html).toBeUndefined();
  });
});

describe("the art along the email's top bar", () => {
  const JOURNEY = ["#4bffa5", "#4fd8ff", "#b896ff", "#ff5fa2", "#ffc45c", "#c4d2ff"];
  const { moving, still } = contactArt("#4bffa5", JOURNEY, "#101010");
  const { width, height, bar } = CONTACT_ART;
  const colourAt = (indices: Uint8Array, x: number, y: number) => moving.palette[indices[y * width + x]];
  const barColours = (indices: Uint8Array) => new Set(Array.from({ length: width }, (_, x) => colourAt(indices, x, 0).join()));

  test("starts and ends as the bar at rest, the accent over a glow, which is all a mail app that plays no GIF shows", () => {
    const first = moving.frames[0].indices;
    const last = moving.frames[moving.frames.length - 1].indices;

    expect(barColours(first)).toEqual(new Set(["75,255,165"]));
    expect(Array.from(last)).toEqual(Array.from(first));
    expect(colourAt(first, width / 2, bar)).not.toEqual([16, 16, 16]);
    expect(still.frames).toEqual([moving.frames[0]]);
  });

  test("passes a light through the journey's colours on the way, from the accent's end of it", () => {
    const middle = moving.frames[Math.floor(moving.frames.length / 2)].indices;
    const colours = barColours(middle);

    expect(colours.size).toBeGreaterThan(10);
    // At its heart the light reaches the far end of the journey, Beyond's blue lit towards white.
    expect([...colours].some((colour) => colour.split(",").map(Number)[2] > 230)).toBe(true);
  });

  test("meets the panel without a seam, its last row the panel itself in every frame", () => {
    const foot = new Set(moving.frames.flatMap(({ indices }) => Array.from({ length: width }, (_, x) => colourAt(indices, x, height - 1).join())));

    expect(foot).toEqual(new Set(["16,16,16"]));
  });

  test("plays once, in under the five seconds past which WCAG 2.2.2 asks for a way to stop it", () => {
    const total = moving.frames.reduce((sum, { delayMs }) => sum + delayMs, 0);

    expect(moving.loops).toBeUndefined();
    expect(total).toBeLessThan(5000);
    expect(moving.palette.length).toBeLessThanOrEqual(256);
  });

  test("starts from feedback's own end of the journey, so its light opens in Beyond's blue", () => {
    const feedback = contactArt("#c4d2ff", JOURNEY, "#101010").moving;

    expect(feedback.palette[feedback.frames[0].indices[0]]).toEqual([196, 210, 255]);
  });
});

describe("delivering a message from the browser", () => {
  // A channel answering as told.
  class Answering extends ContactChannel {
    public delivered = 0;

    constructor(public readonly id: string, private readonly open: boolean | null | Error, private readonly answer: Delivery | Error) {
      super();
    }

    public async isOpen(): Promise<boolean | null> {
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

  test("the fallback hands the visitor a mail link with their message, short enough for every mail app", async () => {
    const channel = new MailtoChannel("inbox@example.test", "Feedback on your site");

    expect(channel.linkFor({ message: "  Shall we talk?  ", subject: "Hiring: CTO & more" }))
      .toBe("mailto:inbox@example.test?subject=Hiring%3A%20CTO%20%26%20more&body=Shall%20we%20talk%3F");
    expect(channel.linkFor({ message: "a".repeat(MAILTO_MOST + 500) })).toMatch(new RegExp(`subject=Feedback%20on%20your%20site&body=a{${MAILTO_MOST}}$`));
    expect(await channel.isOpen()).toBe(true);
    expect(await channel.deliver({ kind: "feedback", message: "Hi there, nice site." })).toMatchObject({ kind: "link" });
  });

  test("sends straight through the site, never waiting on a read of whether it can, and stops at fields to fix", async () => {
    const closedButWorking = new Answering("site", false, { kind: "sent" });

    expect(await new ContactDelivery([closedButWorking], fallback()).deliver(MESSAGE)).toEqual({ kind: "sent" });
    expect(closedButWorking.delivered).toBe(1);

    const invalid = new Answering("site", true, { kind: "refused", refusal: "invalid", problems: ["emailMissing"] });

    expect(await new ContactDelivery([invalid], fallback()).deliver(MESSAGE)).toEqual({ kind: "invalid", problems: ["emailMissing"] });
  });

  test("hands a refused or broken send to the fallback with why, and a refusal with nothing to fix as failed, never silent", async () => {
    const full = await new ContactDelivery([new Answering("site", true, { kind: "refused", refusal: "full", problems: [] })], fallback()).deliver(MESSAGE);

    expect(full).toMatchObject({ kind: "fallback", refusal: "full", href: expect.stringContaining("mailto:inbox@example.test") });
    expect(await new ContactDelivery([new Answering("site", true, new Error("gone"))], fallback()).deliver(MESSAGE))
      .toMatchObject({ kind: "fallback", refusal: "failed" });
    expect(await new ContactDelivery([new Answering("site", true, { kind: "refused", refusal: "invalid", problems: [] })], fallback()).deliver(MESSAGE))
      .toMatchObject({ kind: "fallback", refusal: "failed" });
    expect(await new ContactDelivery([], fallback()).deliver(MESSAGE)).toMatchObject({ kind: "fallback", refusal: null });
  });

  test("says the site is open, closed, or that there is no telling, when the send button stays", async () => {
    const statusOf = (open: boolean | null | Error) => new ContactDelivery([new Answering("site", open, { kind: "sent" })], fallback()).status();

    expect(await statusOf(true)).toBe("open");
    expect(await statusOf(false)).toBe("closed");
    expect(await statusOf(null)).toBe("unknown");
    expect(await statusOf(new Error("offline"))).toBe("unknown");
    expect(await new ContactDelivery([], fallback()).status()).toBe("unknown");
  });
});
