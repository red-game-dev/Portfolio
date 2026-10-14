import { FallbackChannel, MailtoChannel } from "@/packages/messaging/contact";

// The channel that always works: the visitor's own email app. The form draws its link beside the send button from it,
// and the delivery service hands a message to it when the site cannot send, so swapping it here swaps both. Small and
// free of the network, so the page can carry it.
export const contactFallback = (address: string, subject: string): FallbackChannel => new MailtoChannel(address, subject);
