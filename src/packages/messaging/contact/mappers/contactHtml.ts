import { escapeHtml } from "@/packages/text/format";

import { ContactRequest } from "../domain/types";

// How the email looks, given by the site so it matches the page: its background, the panel the message sits in, the
// accent for each kind of message, its text colours, the font, and the site's own address.
export interface EmailTheme {
  background: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  accents: Record<ContactRequest["kind"], string>;
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

// The visitor's text as HTML: escaped, its line breaks kept.
const paragraphs = (text: string) => escapeHtml(text.trim()).replace(/\r?\n/g, "<br>");

// The email as the site looks: a dark panel under a bar in the kind's accent, the site's name, the kind as a badge, the
// subject, the message on its own darker panel, who sent it (a reply goes straight back to them), and the form it came
// from. Laid out in tables with the styles inline, as mail apps need, and everything the visitor wrote escaped, so
// nothing in a message can change the email. A light touch of motion for the mail apps that play it (Apple's do; most
// strip it): the bar's light runs across it once and the message rises in, nothing at all for a reader who asked for
// less motion, and every style the motion needs already in place without it, so where it is stripped nothing changes.
export const contactHtml = (request: ContactRequest, subject: string, from: string | null, theme: EmailTheme, words: EmailWords): string => {
  const accent = theme.accents[request.kind];
  const site = new URL(theme.siteUrl).hostname.replace(/^www\./, "");
  const preview = escapeHtml(request.message.trim().slice(0, 120));
  const sender = from ? escapeHtml(from) : escapeHtml(words.anonymous);
  const reply = request.email ? `<p style="margin:6px 0 0;color:${theme.muted};font-size:13px;">${escapeHtml(words.reply)}</p>` : "";
  const badgeStyle = `display:inline-block;margin-left:10px;padding:2px 10px;border:1px solid ${accent};border-radius:999px;font-family:${theme.font};` +
    `font-size:11px;color:${accent};`;
  const badge = `<span style="${badgeStyle}">${escapeHtml(words.kinds[request.kind])}</span>`;
  const footerStyle = `margin:0;padding-top:14px;border-top:1px solid ${theme.border};font-family:${theme.font};font-size:12px;color:${theme.muted};`;
  const link = `<a href="${escapeHtml(theme.siteUrl)}" style="color:${accent};text-decoration:none;">${escapeHtml(site)}</a>`;
  const footer = `<p style="${footerStyle}">${escapeHtml(words.footer)} ${link}</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(subject)}</title>
<style>
@keyframes rg-shine { from { background-position: 100% 0; } to { background-position: -100% 0; } }
@keyframes rg-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.rg-bar { background-image: linear-gradient(90deg, ${accent} 0%, ${accent} 40%, #ffffff 50%, ${accent} 60%, ${accent} 100%) !important;
  background-size: 200% 100% !important; animation: rg-shine 1.6s ease-out 0.2s 1 both; }
.rg-rise { animation: rg-rise 0.6s ease-out 0.3s 1 both; }
@media (prefers-reduced-motion: reduce) { .rg-bar, .rg-rise { animation: none !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${theme.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${theme.panel};border:1px solid ${theme.border};">
<tr><td class="rg-bar" height="3" style="height:3px;line-height:3px;font-size:0;background:${accent};">&nbsp;</td></tr>
<tr><td style="padding:22px 28px 0;font-family:${theme.mono};font-size:12px;letter-spacing:0.04em;color:${accent};">${escapeHtml(site)}
${badge}
</td></tr>
<tr><td style="padding:14px 28px 0;font-family:${theme.font};font-size:22px;font-weight:600;line-height:1.3;color:#ffffff;">${escapeHtml(subject)}</td></tr>
<tr><td style="padding:18px 28px 0;">
<table class="rg-rise" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background};border-left:2px solid ${accent};">
<tr><td style="padding:16px 18px;font-family:${theme.font};font-size:15px;line-height:1.6;color:${theme.text};">${paragraphs(request.message)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 28px 0;font-family:${theme.font};font-size:14px;color:${theme.text};">
<span style="color:${theme.muted};">${escapeHtml(words.from)}</span> ${sender}${reply}
</td></tr>
<tr><td style="padding:22px 28px 24px;">
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
};
