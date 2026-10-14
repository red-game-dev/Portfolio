import { HttpMailAdapter, HttpMailAdapterOptions } from "../core/HttpMailAdapter";
import { Mail } from "../domain/types";

const RESEND_URL = "https://api.resend.com";

interface ResendBody {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  reply_to?: string;
}

// Resend: its API's base URL and key, its idempotency header, and an email as the body its /emails endpoint takes.
export class ResendMailAdapter extends HttpMailAdapter<ResendBody> {
  public readonly id = "resend";
  protected readonly path = "/emails";
  // Resend sends an email with the same key at most once, within a day.
  protected readonly idempotencyHeader = "Idempotency-Key";

  constructor(apiKey: string, options: HttpMailAdapterOptions = {}) {
    super({ baseURL: RESEND_URL, headers: { Authorization: `Bearer ${apiKey}` } }, options);
  }

  protected bodyOf(mail: Mail): ResendBody {
    return {
      from: this.fromOf(mail),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    };
  }
}
