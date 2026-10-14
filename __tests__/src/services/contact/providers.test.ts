/**
 * @jest-environment node
 */
import { createHash } from "crypto";

import { EMAIL_THEME } from "@/config/contact";
import { SITE_URL } from "@/config/site";
import { contactMail } from "@/packages/messaging/contact";
import { ResendMailAdapter } from "@/packages/server/mail";
import { artOrigin, artVersion, emailArt, emailArtLinks } from "@/services/contact/art";
import { contactRoute, MAIL_ADAPTERS, mailAdapters } from "@/services/contact/server";

describe("the mail providers the site can send through", () => {
  const environment = { ...process.env };

  afterEach(() => {
    process.env = { ...environment };
  });

  test("each is built from its own environment, or is not there without its key", () => {
    delete process.env.RESEND_API_KEY;
    expect(MAIL_ADAPTERS.resend()).toBeNull();
    expect(mailAdapters(["resend"])).toEqual([]);

    process.env.RESEND_API_KEY = "re_test";
    expect(MAIL_ADAPTERS.resend()).toBeInstanceOf(ResendMailAdapter);
  });

  test("are tried in the order MAIL_PROVIDERS gives, those unknown or not set up left out", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.MAIL_PROVIDERS = "nobody, resend";

    expect(mailAdapters().map((adapter) => adapter.id)).toEqual(["resend"]);
  });
});

describe("where a message goes", () => {
  test("to the inbox it is given, styled as the site looks, so no email goes out as plain text alone", () => {
    const route = contactRoute("inbox@example.test");
    const mail = route && contactMail({ kind: "message", subject: "Hiring", email: "visitor@example.test", message: "Hello there, a role for you." }, route);

    // From the portfolio, which is what a reader sees in their inbox: "Redeemer Pace's portfolio <portfolio@...>".
    expect(route?.sender).toMatchObject({ name: "Redeemer Pace's portfolio", user: "portfolio" });
    expect(mail?.to).toBe("inbox@example.test");
    expect(mail?.html).toContain(EMAIL_THEME.accents.message);
    expect(mail?.html).toContain(`<img src="${SITE_URL}/api/email/message.gif?v=${artVersion()}"`);
    expect(mail?.html).toContain(`src="${SITE_URL}/api/email/portrait.gif?v=${artVersion()}"`);
  });

  test("nowhere without an inbox, when the service says it cannot send", () => {
    expect(contactRoute("")).toBeNull();
  });
});

describe("the art in the emails", () => {
  test("is each kind's light along the bar and my portrait's reveal, each with its rest, as GIFs drawn once, and nothing else", () => {
    const moving = emailArt("message.gif");
    const still = emailArt("feedback-still.gif");

    expect(Buffer.from(moving ?? []).subarray(0, 6)
      .toString()).toBe("GIF89a");
    expect(emailArt("message.gif")).toBe(moving);
    expect(still?.length).toBeLessThan(moving?.length ?? 0);
    // Light enough for an email: a few tens of kilobytes for the motion.
    expect(moving?.length).toBeLessThan(60_000);
    expect(Buffer.from(emailArt("portrait.gif") ?? []).subarray(0, 6)
      .toString()).toBe("GIF89a");
    expect(emailArt("portrait-still.gif")?.length).toBeLessThan(emailArt("portrait.gif")?.length ?? 0);
    // The portrait's reveal stays light for a whole picture, under a hundred and fifty kilobytes.
    expect(emailArt("portrait.gif")?.length).toBeLessThan(150_000);
    expect(emailArt("../server.ts")).toBeNull();
    expect(emailArt("message.png")).toBeNull();
    expect(emailArt("other.gif")).toBeNull();
  });

  test("is fetched from the preview itself while the site is a preview, so its emails show what it would ship, else from the site", () => {
    expect(artOrigin("preview", "portfolio-abc.vercel.app")).toBe("https://portfolio-abc.vercel.app");
    expect(artOrigin("production", "portfolio-abc.vercel.app")).toBe(SITE_URL);
    expect(artOrigin(undefined, undefined)).toBe(SITE_URL);
  });

  test("lives at addresses carrying a version read from its own bytes, so new art is never hidden behind what an inbox has kept", () => {
    const hash = createHash("sha256");

    ["message.gif", "message-still.gif", "feedback.gif", "feedback-still.gif", "portrait.gif", "portrait-still.gif"]
      .forEach((name) => hash.update(emailArt(name) ?? new Uint8Array()));

    const version = hash.digest("hex").slice(0, 8);

    expect(artVersion()).toBe(version);
    expect(emailArtLinks("https://art.test")).toEqual({
      bars: {
        message: { moving: `https://art.test/api/email/message.gif?v=${version}`, still: `https://art.test/api/email/message-still.gif?v=${version}` },
        feedback: { moving: `https://art.test/api/email/feedback.gif?v=${version}`, still: `https://art.test/api/email/feedback-still.gif?v=${version}` },
      },
      portrait: { moving: `https://art.test/api/email/portrait.gif?v=${version}`, still: `https://art.test/api/email/portrait-still.gif?v=${version}` },
    });
  });

  test("never stops an email going out: art that cannot be drawn leaves the plain bar", () => {
    expect(emailArtLinks("https://art.test", () => {
      throw new Error("no art");
    })).toBeUndefined();
  });
});
