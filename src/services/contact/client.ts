import { ContactDelivery } from "@/packages/messaging/contact";
import { SiteChannel } from "@/packages/messaging/contact-site";
import { contactFallback } from "@/services/contact/fallback";

const ENDPOINT = "/api/contact/";

// How the forms deliver a message: the site's own server, then the fallback, the visitor's own email app. The site's
// channel is one instance for the page, so its answer to whether it can send is shared by every form. Loaded only when
// a form first needs it, so the page never carries the network client.
const site = new SiteChannel(ENDPOINT);

export const createContactDelivery = (address: string, subject: string): ContactDelivery => new ContactDelivery([site], contactFallback(address, subject));
