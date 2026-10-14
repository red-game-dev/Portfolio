// The site's messages and feedback. They are sent from an address on the domain Resend has verified (its integration
// sets RESEND_EMAIL_DOMAIN; the site's own domain where it does not), to the inbox in CONTACT_INBOX, which is kept in
// Vercel's environment rather than here. A visitor may send a few an hour, and the site at most the free plan's 100 a
// day; past either, the form offers the visitor's own email app instead.
export const CONTACT_CONFIG = {
  senderName: "Redeemer Pace's site",
  senderUser: "site",
  domain: "redgame.dev",
  site: "redgame.dev",
  perVisitor: { limit: 5, windowMs: 60 * 60 * 1000 },
  perDay: 100,
} as const;
