import { escapeHtml } from "@/packages/text/format";

import { ContactRequest } from "../domain/types";
import { CONTACT_ART } from "./contactArt";

// How the email looks, given by the site so it matches the page: its background, the panel the message sits in, the
// accent for each kind of message, the colours of the journey a light passes through along the top bar, its text
// colours, the font, and the site's own address.
export interface EmailTheme {
  background: string;
  panel: string;
  border: string;
  heading: string;
  text: string;
  muted: string;
  accents: Record<ContactRequest["kind"], string>;
  journey: readonly string[];
  font: string;
  mono: string;
  siteUrl: string;
}

export interface EmailWords {
  // The badge for each kind of message, the line for who sent it, and the line under it all.
  kinds: Record<ContactRequest["kind"], string>;
  from: string;
  anonymous: string;
  reply: string;
  footer: string;
}

// Where the top bar's art is for a kind of message: the light passing (`contactArt`) and the bar at rest.
export interface EmailArt {
  moving: string;
  still: string;
}

// Everything the email's look is given: the theme, the words, and the art, without which the bar is plain.
export interface EmailLook {
  theme: EmailTheme;
  words: EmailWords;
  art?: Record<ContactRequest["kind"], EmailArt>;
}

// The visitor's text as HTML: escaped, its line breaks kept.
const paragraphs = (text: string) => escapeHtml(text.trim()).replace(/\r?\n/g, "<br>");

// A cell's text breaks inside a word where it must, so one long link cannot widen the email past the screen.
const WRAP = "word-break:break-word;overflow-wrap:anywhere;";

// After the preview line, enough blank space that a mail app's snippet stops there instead of running on into the body.
const PREVIEW_FILL = "&#847;&zwnj;&nbsp;".repeat(60);

// The top bar: its art where there is some, drawn twice as wide as it is made and kept at its own height, the bar at
// rest in its place for a reader who asked for less motion (where a mail app reads that, as Apple's do; Gmail keeps
// only the image inside); else the bar in the accent alone.
const barRow = (accent: string, art: EmailArt | undefined) => {
  if (!art) {
    return `<tr><td aria-hidden="true" height="3" style="height:3px;line-height:3px;mso-line-height-rule:exactly;font-size:0;background:${accent};">&nbsp;</td></tr>`;
  }

  const width = CONTACT_ART.width * 2;
  const { height } = CONTACT_ART;
  const image = `<img src="${escapeHtml(art.moving)}" width="${width}" height="${height}" alt="" ` +
    `style="display:block;width:100%;height:${height}px;border:0;outline:none;">`;
  const still = `<source srcset="${escapeHtml(art.still)}" media="(prefers-reduced-motion: reduce)">`;

  return `<tr><td aria-hidden="true" style="padding:0;line-height:0;font-size:0;"><picture>${still}${image}</picture></td></tr>`;
};

// The email as the site looks: a dark panel under a bar in the kind's accent, the site's name, the kind as a badge, the
// subject, the message on its own darker panel, who sent it (a reply goes straight back to them), and the form it came
// from. Laid out in tables with the styles inline, as mail apps need (and held to 600px in classic Outlook, which
// ignores a maximum width), with less room round the message on a phone, and everything the visitor wrote escaped, so
// nothing in a message can change the email. A light touch of motion: where the art is given, a light passes once along
// the bar through the journey's colours, an image, since a GIF plays where CSS motion is stripped (Gmail); and the
// message rises a little into place in the mail apps that play CSS (Apple's). Neither ever hides anything: the art's
// first and last frames are the bar at rest and the rise moves without fading, and nothing moves for a reader who asked
// for less motion wherever the mail app says so.
export const contactHtml = (request: ContactRequest, subject: string, from: string | null, { theme, words, art }: EmailLook): string => {
  const accent = theme.accents[request.kind];
  const site = new URL(theme.siteUrl).hostname.replace(/^www\./, "");
  const preview = escapeHtml(request.message.trim().slice(0, 120));
  const sender = from ? escapeHtml(from) : escapeHtml(words.anonymous);
  const replyStyle = `margin:6px 0 0;font-family:${theme.font};font-size:13px;color:${theme.muted};`;
  const reply = request.email ? `<p style="${replyStyle}">${escapeHtml(words.reply)}</p>` : "";
  const badgeStyle = `display:inline-block;margin-left:10px;padding:2px 10px;border:1px solid ${accent};border-radius:999px;font-family:${theme.font};` +
    `font-size:11px;color:${accent};`;
  const badge = `<span style="${badgeStyle}">${escapeHtml(words.kinds[request.kind])}</span>`;
  const noteStyle = `padding:16px 18px;font-family:${theme.font};font-size:15px;line-height:1.6;color:${theme.text};${WRAP}`;
  const headingStyle = `margin:0;font-family:${theme.font};font-size:22px;font-weight:600;line-height:1.3;color:${theme.heading};${WRAP}`;
  const footerStyle = `margin:0;padding-top:14px;border-top:1px solid ${theme.border};font-family:${theme.font};font-size:12px;color:${theme.muted};`;
  const link = `<a href="${escapeHtml(theme.siteUrl)}" style="color:${accent};text-decoration:underline;">${escapeHtml(site)}</a>`;
  const footer = `<p style="${footerStyle}">${escapeHtml(words.footer)} ${link}</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(subject)}</title>
<style>
@keyframes rg-rise { from { transform: translateY(8px); } to { transform: none; } }
.rg-rise { animation: rg-rise 0.6s ease-out 0.3s 1 both; }
@media (prefers-reduced-motion: reduce) { .rg-rise { animation: none !important; } }
@media (max-width: 480px) {
  .rg-frame { padding: 16px 8px !important; }
  .rg-pad { padding-left: 18px !important; padding-right: 18px !important; }
  .rg-note { padding: 14px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${theme.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}${PREVIEW_FILL}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background};">
<tr><td class="rg-frame" align="center" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${theme.panel};border:1px solid ${theme.border};">
${barRow(accent, art?.[request.kind])}
<tr><td class="rg-pad" style="padding:22px 28px 0;font-family:${theme.mono};font-size:12px;letter-spacing:0.04em;color:${accent};">${escapeHtml(site)}
${badge}
</td></tr>
<tr><td class="rg-pad" style="padding:14px 28px 0;"><h1 style="${headingStyle}">${escapeHtml(subject)}</h1></td></tr>
<tr><td class="rg-pad" style="padding:18px 28px 0;">
<table class="rg-rise" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background};border-left:2px solid ${accent};">
<tr><td class="rg-note" style="${noteStyle}">${paragraphs(request.message)}</td></tr>
</table>
</td></tr>
<tr><td class="rg-pad" style="padding:18px 28px 0;font-family:${theme.font};font-size:14px;color:${theme.text};${WRAP}">
<span style="color:${theme.muted};">${escapeHtml(words.from)}</span> ${sender}${reply}
</td></tr>
<tr><td class="rg-pad" style="padding:22px 28px 24px;">
${footer}
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
};
