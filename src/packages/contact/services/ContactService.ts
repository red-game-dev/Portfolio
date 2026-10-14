import type { MailSender } from "@/packages/server/mail";
import type { Limiter } from "@/packages/server/quota";

import { ContactOutcome, ContactStatus } from "../domain/types";
import { isContactRequest } from "../guards/isContactRequest";
import { ContactRoute, contactMail } from "../mappers/contactMail";
import { contactProblems } from "../validators/contactProblems";

// A ceiling on sends per day that spends one at a time, gives one back for a send that failed, and can be read.
export interface SendCeiling {
  hasRoom(): Promise<boolean>;
  take(): Promise<boolean>;
  refund(): Promise<void>;
}

export interface ContactServiceOptions {
  // The way to send and where to, or null when the site has none set up.
  sender: MailSender | null;
  route: ContactRoute | null;
  visitor: Limiter;
  day: SendCeiling;
}

// The site's messages and feedback: a request is guarded, checked for a bot, validated, counted against the visitor
// and against the day, and only then sent. A bot that fills the field people never see is told it was sent, and
// nothing is. Every refusal but an invalid request leaves the visitor their own email app.
export class ContactService {
  private readonly options: ContactServiceOptions;

  constructor(options: ContactServiceOptions) {
    this.options = options;
  }

  public async status(): Promise<ContactStatus> {
    const { sender, route, day } = this.options;

    return { isOpen: sender !== null && route !== null && await day.hasRoom() };
  }

  public async send(body: unknown, visitor: string): Promise<ContactOutcome> {
    const { sender, route, day } = this.options;

    if (!isContactRequest(body)) {
      return { error: "invalid" };
    }

    if (body.website) {
      return { ok: true };
    }

    const problems = contactProblems(body);

    if (problems.length > 0) {
      return { error: "invalid", problems };
    }

    if (!sender || !route) {
      return { error: "unavailable" };
    }

    if (!(await this.options.visitor.take(visitor))) {
      return { error: "limited" };
    }

    if (!(await day.take())) {
      return { error: "full" };
    }

    const outcome = await sender.send(contactMail(body, route));

    if (outcome === "sent") {
      return { ok: true };
    }

    await day.refund();

    return { error: outcome === "limited" ? "full" : "failed" };
  }
}
