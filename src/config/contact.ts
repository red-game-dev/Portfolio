// The site's messages and feedback. They are sent from an address on the site's own domain, which Resend has to have
// verified (until then a send fails and the form offers the visitor's own email app), to the inbox in CONTACT_INBOX,
// which is kept in Vercel's environment rather than here. A visitor may send a few an hour, and the site at most the
// free plan's 100 a day; past either, the form offers the visitor's own email app instead.
export const CONTACT_CONFIG = {
  from: "Redeemer Pace's site <site@redgame.dev>",
  site: "redgame.dev",
  perVisitor: { limit: 5, windowMs: 60 * 60 * 1000 },
  perDay: 100,
} as const;
