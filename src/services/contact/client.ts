import { ContactDelivery, MailtoChannel, SiteChannel } from "@/packages/messaging/contact";

const ENDPOINT = "/api/contact/";

// How the forms deliver a message: the site's own server first, then the visitor's own email app, which always works.
// The site's channel is one instance for the page, so its answer to whether it can send is shared by every form.
const site = new SiteChannel(ENDPOINT);

export const createContactDelivery = (address: string, subject: string): ContactDelivery => new ContactDelivery([site, new MailtoChannel(address, subject)]);
