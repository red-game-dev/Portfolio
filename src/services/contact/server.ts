import { CONTACT_CONFIG } from "@/config/contact";
import { ContactService } from "@/packages/contact";
import { ResendMailSender } from "@/packages/server/mail";
import { DailyQuota, SlidingWindowLimiter } from "@/packages/server/quota";
import { sharedStore } from "@/services/store/server";
import { visitorOf } from "@/services/store/visitor";

let service: ContactService | null = null;

// The contact service, built once: Resend from RESEND_API_KEY (set by Vercel's Marketplace), the owner's inbox from
// CONTACT_INBOX, and the shared store for the limits. Without a key or an inbox the service is still built, and says
// it cannot send, so the form offers the visitor's own email app.
export const getContactService = (): ContactService => {
  if (!service) {
    const store = sharedStore("contact");
    const apiKey = process.env.RESEND_API_KEY;
    const inbox = process.env.CONTACT_INBOX;

    service = new ContactService({
      sender: apiKey ? new ResendMailSender(apiKey) : null,
      route: inbox ? { from: CONTACT_CONFIG.from, to: inbox, site: CONTACT_CONFIG.site } : null,
      visitor: new SlidingWindowLimiter(store, "contact:rate:visitor", CONTACT_CONFIG.perVisitor),
      day: new DailyQuota(store, "contact:sent", CONTACT_CONFIG.perDay),
    });
  }

  return service;
};

// Whoever is sending, as a salted hash of their connection, renewed daily: the store never holds an address.
export const contactVisitor = (address: string, now = Date.now()): Promise<string> => visitorOf(sharedStore("contact"), "contact", address, now);
