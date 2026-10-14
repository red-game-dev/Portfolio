import type { Mailer } from "@/packages/server/mail";
import type { Limiter } from "@/packages/server/quota";

import { ContactOutcome, ContactRefusal, ContactStatus } from "../domain/types";
import { isContactRequest } from "../guards/isContactRequest";
import { ContactRoute, contactMail } from "../mappers/contactMail";
import { contactProblems } from "../validators/contactProblems";

// A ceiling on sends per day that spends one at a time, gives one back for a send that failed, and can be read.
export interface SendCeiling {
  hasRoom(): Promise<boolean>;
  take(): Promise<boolean>;
  refund(): Promise<void>;
}

// Whether mail has been failing lately, so the form offers the visitor's own email app from the start rather than
// letting every visitor write a message that fails.
export interface SendHealth {
  isDown(): Promise<boolean>;
  reportDown(): Promise<void>;
}

// One send, for the log: what became of it, which provider tried last and its status (null when nothing was sent) and
// how long it took. Nothing about the visitor or the message.
export interface SendRecord {
  outcome: "sent" | ContactRefusal;
  adapter: string | null;
  providerStatus: number | null;
  ms: number;
}

export interface ContactServiceOptions {
  // What sends the mail (a mail service over the providers set up) and where to, or null when the site has none.
  mailer: Mailer | null;
  route: ContactRoute | null;
  visitor: Limiter;
  day: SendCeiling;
  health?: SendHealth;
  onSend?: (record: SendRecord) => void;
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
    const { mailer, route, day, health } = this.options;

    return { isOpen: mailer !== null && route !== null && !(await health?.isDown()) && await day.hasRoom() };
  }

  public async send(body: unknown, visitor: string): Promise<ContactOutcome> {
    const { mailer, route, day } = this.options;

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

    if (!mailer || !route) {
      return { error: "unavailable" };
    }

    if (!(await this.options.visitor.take(visitor))) {
      return { error: "limited" };
    }

    if (!(await day.take())) {
      return { error: "full" };
    }

    const sent = await mailer.send(contactMail(body, route));
    const result: ContactOutcome = sent.outcome === "sent" ? { ok: true } : { error: sent.outcome === "limited" ? "full" : "failed" };

    this.options.onSend?.({ outcome: "ok" in result ? "sent" : result.error, adapter: sent.adapter, providerStatus: sent.adapter ? sent.status : null, ms: sent.ms });

    if ("ok" in result) {
      return result;
    }

    await day.refund();

    // A refusal that is not the providers' limits (a revoked key, a sender no longer verified) is likely to repeat.
    if (sent.outcome === "failed") {
      await this.options.health?.reportDown();
    }

    return result;
  }
}
