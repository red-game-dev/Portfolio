import { ApiClient } from "@/packages/http/api-client";

import { Mail, MailResult, MailSender } from "../domain/types";

const RESEND_URL = "https://api.resend.com";
// Long enough for the provider to answer, short enough that a visitor waiting on the form is not left hanging.
const TIMEOUT_MS = 8000;

// Sends through Resend's API, on an instance of the shared client: its own base URL and key, no retries, since a
// retried send could arrive twice (the idempotency key covers a retry the caller makes on purpose).
export class ResendMailSender implements MailSender {
  private readonly client: ApiClient;

  constructor(apiKey: string, client: ApiClient = ApiClient.global()) {
    this.client = client.withConfig({
      baseURL: RESEND_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: TIMEOUT_MS,
      retry: { retries: 0 },
    });
  }

  public async send(mail: Mail, idempotencyKey?: string): Promise<MailResult> {
    const result = await this.client.post<{ id?: string }>("/emails", {
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }, idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {});

    if (result.ok) {
      return { outcome: "sent", status: result.status };
    }

    return { outcome: result.status === 429 ? "limited" : "failed", status: result.status };
  }
}
