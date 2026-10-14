import { CONTACT_CONFIG, EMAIL_THEME } from "@/config/contact";
import { formsContent } from "@/data/portfolio/forms";
import { ContactRoute, ContactService, SendRecord } from "@/packages/messaging/contact";
import { contactHtml, EmailLook } from "@/packages/messaging/contact-email";
import { MailAdapter, MailService, ResendMailAdapter } from "@/packages/server/mail";
import { DailyQuota, SlidingWindowLimiter } from "@/packages/server/quota";
import { emailArtLinks } from "@/services/contact/art";
import { sharedStore } from "@/services/store/server";
import { visitorOf } from "@/services/store/visitor";

let service: ContactService | null = null;

const DOWN_KEY = "contact:down";

// One JSON line per send on stdout, which Vercel keeps as the function's logs: the outcome, every provider's try and the
// time it took, never who sent it or what it said.
const logSend = (record: SendRecord) => process.stdout.write(`${JSON.stringify({ event: "contact.send", ...record })}\n`);

// Every mail provider the site knows, as its adapter, each built from its own environment, or null where that has no
// key. The mail service tries them in the order MAIL_PROVIDERS (comma separated) or `CONTACT_CONFIG.mailProviders`
// gives, so switching or adding a fallback is configuration; a new provider is an `HttpMailAdapter` in
// packages/server/mail and a line here, and neither the contact service nor the form changes.
export const MAIL_ADAPTERS: Record<string, () => MailAdapter | null> = {
  // Resend, through Vercel's Marketplace: the key, and the domain it verified to send from.
  resend: () => (process.env.RESEND_API_KEY ? new ResendMailAdapter(process.env.RESEND_API_KEY, { domain: process.env.RESEND_EMAIL_DOMAIN }) : null),
};

// The adapters in the order they are tried, those not set up left out.
export const mailAdapters = (order = process.env.MAIL_PROVIDERS?.split(",") ?? CONTACT_CONFIG.mailProviders): MailAdapter[] =>
  order.map((id) => MAIL_ADAPTERS[id.trim()]?.() ?? null).filter((adapter): adapter is MailAdapter => adapter !== null);

// Where a message goes: from the site's sender to the owner's inbox (CONTACT_INBOX), styled as the site looks, with the
// art along its top bar and my portrait; none without an inbox.
export const contactRoute = (inbox = process.env.CONTACT_INBOX): ContactRoute | null => {
  if (!inbox) {
    return null;
  }

  const look: EmailLook = { theme: EMAIL_THEME, words: formsContent.forms.email, art: emailArtLinks() };

  return {
    sender: { name: CONTACT_CONFIG.senderName, user: CONTACT_CONFIG.senderUser, domain: CONTACT_CONFIG.domain },
    to: inbox,
    site: CONTACT_CONFIG.site,
    html: (request, subject, from) => contactHtml(request, subject, from, look),
  };
};

// The contact service, built once: the mail service over the providers set up, the owner's inbox from CONTACT_INBOX,
// and the shared store for the limits. With no provider set up or no inbox the service is still built, and says it
// cannot send, so the form offers the visitor's own email app.
export const getContactService = (): ContactService => {
  if (!service) {
    const store = sharedStore("contact");
    const mail = new MailService(mailAdapters());

    service = new ContactService({
      mailer: mail.isReady ? mail : null,
      route: contactRoute(),
      visitor: new SlidingWindowLimiter(store, "contact:rate:visitor", CONTACT_CONFIG.perVisitor),
      day: new DailyQuota(store, "contact:sent", CONTACT_CONFIG.perDay),
      health: {
        isDown: async () => Boolean(await store.get(DOWN_KEY)),
        reportDown: () => store.set(DOWN_KEY, "1", CONTACT_CONFIG.downMs),
        // An empty value gone at once: one round trip, as reading it first would be.
        clear: () => store.set(DOWN_KEY, "", 1),
      },
      onSend: logSend,
    });
  }

  return service;
};

// Whoever is sending, as a salted hash of their connection, renewed daily: the store never holds an address.
export const contactVisitor = (address: string, now = Date.now()): Promise<string> => visitorOf(sharedStore("contact"), "contact", address, now);
