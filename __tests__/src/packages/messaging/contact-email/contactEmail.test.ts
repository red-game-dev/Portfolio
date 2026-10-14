import { contactMail, ContactRoute } from "@/packages/messaging/contact";
import { CONTACT_ART, contactArt, CONTACT_AVATAR, contactAvatar, contactHtml, EmailArtwork, EmailLook, EmailTheme, EmailWords } from "@/packages/messaging/contact-email";

const ROUTE: ContactRoute = { sender: { name: "Site", user: "site", domain: "example.test" }, to: "inbox@example.test", site: "example.test" };
const MESSAGE = { kind: "message" as const, message: "Hello, I would like to talk about a role.", email: "visitor@example.test", name: "Ada", subject: "Hiring: CTO" };

// The route as the site builds it, its email drawn in a look.
const routeWith = (look: EmailLook): ContactRoute => ({ ...ROUTE, html: (request, subject, from) => contactHtml(request, subject, from, look) });

describe("the email a message becomes", () => {
  const JOURNEY = ["#4bffa5", "#4fd8ff", "#b896ff", "#ff5fa2", "#ffc45c", "#c4d2ff"];
  const THEME: EmailTheme = {
    background: "#0b0b0b", panel: "#101010", border: "#1e1e1e", heading: "#ffffff", text: "#d6dcd9", muted: "#8a948f",
    accents: { message: "#4bffa5", feedback: "#c4d2ff" }, journey: JOURNEY, font: "Roboto, sans-serif", mono: "monospace", siteUrl: "https://www.example.test",
  };
  const WORDS: EmailWords = { kinds: { message: "Message", feedback: "Feedback" }, from: "From", anonymous: "Anonymous", reply: "Reply goes back.", footer: "Sent on" };
  const ART: EmailArtwork = {
    bars: {
      message: { moving: "https://art.test/message.gif?v=1", still: "https://art.test/message-still.gif?v=1" },
      feedback: { moving: "https://art.test/feedback.gif?v=1", still: "https://art.test/feedback-still.gif?v=1" },
    },
    avatar: { moving: "https://art.test/avatar.gif?v=1", still: "https://art.test/avatar-still.gif?v=1" },
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
    // Drawn across the panel at its own height, however wide the screen, and as wide as the panel inside its border.
    expect(message).toContain(`width="${CONTACT_ART.width * 2 - 2}" height="${CONTACT_ART.height}" alt=""`);
    expect(message).toContain(`style="display:block;width:100%;height:${CONTACT_ART.height}px;`);
    expect(message).not.toContain("mso-line-height-rule:exactly;font-size:0;background:#4bffa5;");
    // The bar is drawn under the art too, so held back images or art that fails to come still leave the bar.
    expect(message).toContain(`background-image:linear-gradient(#4bffa5,#4bffa5);background-size:100% ${CONTACT_ART.bar}px;background-repeat:no-repeat;`);
    expect(feedback).toContain('<img src="https://art.test/feedback.gif?v=1"');
  });

  test("puts my portrait before the site's name, revealing where it can, at rest for less motion and in classic Outlook", () => {
    const html = contactHtml(MESSAGE, "Hiring: CTO", null, { ...LOOK, art: ART });
    const { shown } = CONTACT_AVATAR;

    expect(html).toContain(`<!--[if mso]><img src="https://art.test/avatar-still.gif?v=1" width="${shown}" height="${shown}" alt=""`);
    expect(html).toContain('<!--[if !mso]><!--><picture><source srcset="https://art.test/avatar-still.gif?v=1" media="(prefers-reduced-motion: reduce)">' +
      `<img src="https://art.test/avatar.gif?v=1" width="${shown}" height="${shown}" alt=""`);
    expect(html).toMatch(/avatar\.gif\?v=1"[^>]*border-radius:50%;"><\/picture><!--<!\[endif\]--><\/td><td style="vertical-align:middle;[^"]*">example\.test\n<span/);
    // Without a portrait, the site's name stands alone as before.
    expect(contactHtml(MESSAGE, "Hiring: CTO", null, { ...LOOK, art: { bars: ART.bars } })).not.toContain("avatar");
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
    const html = contactMail(hostile, routeWith(LOOK)).html ?? "";
    const withArt = contactMail(hostile, routeWith({ ...LOOK, art: ART })).html ?? "";

    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;x&lt;/script&gt;");
    // With the art, its own pictures are the only images: the bar, and the portrait (twice, the still for classic Outlook).
    expect(withArt.match(/<img[^>]*>/g)).toHaveLength(3);
    expect(withArt.match(/<img[^>]*>/g)?.every((tag) => tag.startsWith('<img src="https://art.test/'))).toBe(true);
    expect(withArt).not.toContain("<script");
  });

  test("goes with the plain text where the site gives it a look, and as plain text alone where it does not", () => {
    expect(contactMail(MESSAGE, routeWith(LOOK)).html).toContain("<!doctype html>");
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

describe("my portrait beside the email's header", () => {
  // A 32 by 32 portrait, light in the middle and dark at the edges, as a face against a night sky.
  const size = 32;
  const portrait = {
    width: size,
    height: size,
    pixels: Uint8Array.from({ length: size * size * 3 }, (_, index) => {
      const pixel = Math.floor(index / 3);
      const from = Math.hypot((pixel % size) - size / 2, Math.floor(pixel / size) - size / 2);

      return Math.max(20, Math.round(230 - from * 12));
    }),
  };
  const { moving, still } = contactAvatar(portrait, "#4bffa5", "#101010");
  const colourAt = (indices: Uint8Array, x: number, y: number) => [...moving.palette[indices[y * size + x]]];

  test("reveals the portrait as the site does, from binary in the accent to the picture, played once within five seconds", () => {
    const first = moving.frames[0].indices;
    const total = moving.frames.reduce((sum, { delayMs }) => sum + delayMs, 0);

    expect(Array.from({ length: size * size }, (_, pixel) => colourAt(first, pixel % size, Math.floor(pixel / size)))
      .some(([red, green, blue]) => green > 60 && green > red * 1.4 && green > blue)).toBe(true);
    expect(moving.loops).toBeUndefined();
    expect(total).toBeLessThan(5000);
    expect(moving.palette.length).toBeLessThanOrEqual(256);
  });

  test("rests on the picture, round, ringed in the accent and set on the panel, which is all the still shows", () => {
    const last = moving.frames[moving.frames.length - 1].indices;

    expect(colourAt(last, size / 2, size / 2)).toEqual([230, 230, 230]);
    // The corners are the panel itself, so the round picture meets the email without a seam.
    expect([colourAt(last, 0, 0), colourAt(last, size - 1, 0), colourAt(last, 0, size - 1), colourAt(last, size - 1, size - 1)])
      .toEqual([[16, 16, 16], [16, 16, 16], [16, 16, 16], [16, 16, 16]]);
    // The ring at the edge leans to the accent's green.
    const [red, green] = colourAt(last, size / 2, 1);

    expect(green).toBeGreaterThan(red + 40);
    expect(still.frames).toEqual([moving.frames[moving.frames.length - 1]]);
  });
});
