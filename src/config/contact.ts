import { SITE_URL } from "@/config/site";

// The site's messages and feedback. They are sent through a mail provider, from an address on the domain it has verified
// (the site's own where it names none), to the inbox in CONTACT_INBOX, which is kept in Vercel's environment rather
// than here. A visitor may send a few an hour, and the site at most the free plan's 100 a
// day; past either, the form offers the visitor's own email app instead.
const SITE_DOMAIN = new URL(SITE_URL).hostname.replace(/^www\./, "");

export const CONTACT_CONFIG = {
  // The mail providers the site sends through, in the order they are tried, from those `services/contact/server.ts`
  // knows; MAIL_PROVIDERS in the environment (comma separated) sets another order or another provider without a release.
  mailProviders: ["resend"],
  senderName: "Redeemer Pace's site",
  senderUser: "site",
  domain: SITE_DOMAIN,
  site: SITE_DOMAIN,
  // After the mail providers reject a send for certain (a revoked key, a sender no longer verified), the form offers the
  // visitor's own email app from the start for this long, rather than letting every visitor write a message that fails.
  downMs: 10 * 60 * 1000,
  perVisitor: { limit: 5, windowMs: 60 * 60 * 1000 },
  perDay: 100,
} as const;
