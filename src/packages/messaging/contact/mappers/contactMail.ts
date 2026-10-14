import type { Mail, MailSender } from "@/packages/server/mail";

import { ContactRequest } from "../domain/types";
import { contactHtml, EmailTheme, EmailWords } from "./contactHtml";

// Where a message comes from and goes: the site's sender, the owner's inbox, the site's name for the subject, and how
// the email looks (without it, plain text alone).
export interface ContactRoute {
  sender: MailSender;
  to: string;
  site: string;
  look?: { theme: EmailTheme; words: EmailWords };
}

// Text with no line breaks, for a subject or a header line a visitor wrote.
const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

// The email a request becomes: the subject the visitor wrote under (or "Feedback"), the message, and who it is from
// when they said, with replies going straight back to them; in plain text, and as the site looks where it is given.
export const contactMail = (request: ContactRequest, route: ContactRoute): Mail => {
  const name = oneLine(request.name ?? "");
  const email = oneLine(request.email ?? "");
  const subject = request.kind === "feedback" ? "Feedback" : oneLine(request.subject ?? "") || "Message";
  const from = [name, email && `<${email}>`].filter(Boolean).join(" ") || "Anonymous";

  return {
    sender: route.sender,
    to: route.to,
    subject: `[${route.site}] ${subject}`,
    text: `${request.message.trim()}\n\nFrom: ${from}\nSent with the ${request.kind === "feedback" ? "feedback" : "message"} form on ${route.site}`,
    ...(route.look ? { html: contactHtml(request, subject, from === "Anonymous" ? null : from, route.look.theme, route.look.words) } : {}),
    ...(email ? { replyTo: email } : {}),
  };
};
