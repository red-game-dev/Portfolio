/**
 * @jest-environment node
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";

import { EMAIL_THEME } from "@/config/contact";
import { SITE_URL } from "@/config/site";
import portrait from "@/data/email/portrait.json";
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
    expect(mail?.html).toContain(`<img src="${SITE_URL}/api/email/message.gif?v=${artVersion("message")}"`);
    expect(mail?.html).toContain(`src="${SITE_URL}/api/email/portrait.gif?v=${artVersion("portrait")}"`);
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

  test("lives at addresses carrying each piece's version, read from its own bytes, so new art is never hidden behind what an inbox has kept", () => {
    const versionOf = (piece: string) => {
      const hash = createHash("sha256");

      [`${piece}.gif`, `${piece}-still.gif`].forEach((name) => hash.update(emailArt(name) ?? new Uint8Array()));

      return hash.digest("hex").slice(0, 8);
    };
    const linkOf = (piece: string) => ({
      moving: `https://art.test/api/email/${piece}.gif?v=${versionOf(piece)}`,
      still: `https://art.test/api/email/${piece}-still.gif?v=${versionOf(piece)}`,
    });

    expect(artVersion("portrait")).toBe(versionOf("portrait"));
    expect(artVersion("message")).not.toBe(artVersion("portrait"));
    expect(emailArtLinks("https://art.test")).toEqual({ bars: { message: linkOf("message"), feedback: linkOf("feedback") }, portrait: linkOf("portrait") });
  });

  test("never stops an email going out: a portrait that cannot be drawn leaves the bars, and bars that cannot leave the plain bar", () => {
    const failing = (broken: string) => (piece: string) => {
      if (piece === broken) {
        throw new Error("no art");
      }

      return "v1";
    };

    expect(emailArtLinks("https://art.test", failing("portrait"))).toEqual({
      bars: {
        message: { moving: "https://art.test/api/email/message.gif?v=v1", still: "https://art.test/api/email/message-still.gif?v=v1" },
        feedback: { moving: "https://art.test/api/email/feedback.gif?v=v1", still: "https://art.test/api/email/feedback-still.gif?v=v1" },
      },
    });
    expect(emailArtLinks("https://art.test", failing("message"))).toBeUndefined();
  });
});

describe("the portrait in the emails", () => {
  test("is drawn from the profile picture as it is now: run npm run email:portrait when the picture changes", () => {
    const hash = createHash("sha256").update(Uint8Array.from(readFileSync(portrait.source)))
      .digest("hex")
      .slice(0, 16);

    expect(portrait.sourceHash).toBe(hash);
    expect(portrait.width * 4).toBe(portrait.height * 3);
  });
});
