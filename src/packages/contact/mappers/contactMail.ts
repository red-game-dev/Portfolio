import type { Mail } from "@/packages/server/mail";

import { ContactRequest } from "../domain/types";

// Where a message comes from and goes: the verified sender, the owner's inbox, and the site's name for the subject.
export interface ContactRoute {
  from: string;
  to: string;
  site: string;
}

// Text with no line breaks, for a subject or a header line a visitor wrote.
const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

// The email a request becomes: the subject the visitor wrote under (or "Feedback"), the message, and who it is from
// when they said, with replies going straight back to them.
export const contactMail = (request: ContactRequest, route: ContactRoute): Mail => {
  const name = oneLine(request.name ?? "");
  const email = oneLine(request.email ?? "");
  const subject = request.kind === "feedback" ? "Feedback" : oneLine(request.subject ?? "") || "Message";
  const from = [name, email && `<${email}>`].filter(Boolean).join(" ") || "Anonymous";

  return {
    from: route.from,
    to: route.to,
    subject: `[${route.site}] ${subject}`,
    text: `${request.message.trim()}\n\nFrom: ${from}\nSent with the ${request.kind === "feedback" ? "feedback" : "message"} form on ${route.site}`,
    ...(email ? { replyTo: email } : {}),
  };
};
