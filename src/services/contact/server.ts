import { CONTACT_CONFIG } from "@/config/contact";
import { ContactService, SendRecord } from "@/packages/messaging/contact";
import { ResendMailSender } from "@/packages/server/mail";
import { DailyQuota, SlidingWindowLimiter } from "@/packages/server/quota";
import { sharedStore } from "@/services/store/server";
import { visitorOf } from "@/services/store/visitor";

let service: ContactService | null = null;

const DOWN_KEY = "contact:down";

// One JSON line per send on stdout, which Vercel keeps as the function's logs: the outcome, the provider's status and
// the time it took, never who sent it or what it said.
const logSend = (record: SendRecord) => process.stdout.write(`${JSON.stringify({ event: "contact.send", ...record })}\n`);

// The contact service, built once: Resend from RESEND_API_KEY and the domain it verified from RESEND_EMAIL_DOMAIN (both
// set by Vercel's Marketplace), the owner's inbox from CONTACT_INBOX, and the shared store for the limits. Without a
// key or an inbox the service is still built, and says it cannot send, so the form offers the visitor's own email app.
export const getContactService = (): ContactService => {
  if (!service) {
    const store = sharedStore("contact");
    const apiKey = process.env.RESEND_API_KEY;
    const inbox = process.env.CONTACT_INBOX;
    const from = `${CONTACT_CONFIG.senderName} <${CONTACT_CONFIG.senderUser}@${process.env.RESEND_EMAIL_DOMAIN || CONTACT_CONFIG.domain}>`;

    service = new ContactService({
      sender: apiKey ? new ResendMailSender(apiKey) : null,
      route: inbox ? { from, to: inbox, site: CONTACT_CONFIG.site } : null,
      visitor: new SlidingWindowLimiter(store, "contact:rate:visitor", CONTACT_CONFIG.perVisitor),
      day: new DailyQuota(store, "contact:sent", CONTACT_CONFIG.perDay),
      health: {
        isDown: async () => (await store.get(DOWN_KEY)) !== null,
        reportDown: () => store.set(DOWN_KEY, "1", CONTACT_CONFIG.downMs),
      },
      onSend: logSend,
    });
  }

  return service;
};

// Whoever is sending, as a salted hash of their connection, renewed daily: the store never holds an address.
export const contactVisitor = (address: string, now = Date.now()): Promise<string> => visitorOf(sharedStore("contact"), "contact", address, now);
