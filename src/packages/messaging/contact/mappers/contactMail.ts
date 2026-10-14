import type { Mail, MailSender } from "@/packages/server/mail";

import { ContactRequest } from "../domain/types";

// The email as HTML, given the request, the subject it goes under and who it is from (null when they did not say). The
// site gives it (`messaging/contact-email`), so the look and its art stay out of this package, which the page carries.
export type ContactHtml = (request: ContactRequest, subject: string, from: string | null) => string;

// Where a message comes from and goes: the site's sender, the owner's inbox, the site's name for the subject, and how
// the email looks (without it, plain text alone).
export interface ContactRoute {
  sender: MailSender;
  to: string;
  site: string;
  html?: ContactHtml;
}

// Text with no line breaks, for a subject or a header line a visitor wrote.
const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

// The subject in the inbox: the form's own, then the site's name after a bar ("Hiring: CTO | redgame.dev"), unless it
// already names the site, so a reply reads "Re: Hiring: CTO | redgame.dev" to the visitor.
const inboxSubject = (subject: string, site: string) => (subject.toLowerCase().includes(site.toLowerCase()) ? subject : `${subject} | ${site}`);

// The email a request becomes: the subject the form sent it under (or "Feedback" or "Message"), the message, and who it
// is from when they said, with replies going straight back to them; in plain text, and as the site looks where it is
// given.
export const contactMail = (request: ContactRequest, route: ContactRoute): Mail => {
  const name = oneLine(request.name ?? "");
  const email = oneLine(request.email ?? "");
  const subject = oneLine(request.subject ?? "") || (request.kind === "feedback" ? "Feedback" : "Message");
  const from = [name, email && `<${email}>`].filter(Boolean).join(" ") || "Anonymous";

  return {
    sender: route.sender,
    to: route.to,
    subject: inboxSubject(subject, route.site),
    text: `${request.message.trim()}\n\nFrom: ${from}\nSent with the ${request.kind === "feedback" ? "feedback" : "message"} form on ${route.site}`,
    ...(route.html ? { html: route.html(request, subject, name || email ? from : null) } : {}),
    ...(email ? { replyTo: email } : {}),
  };
};
