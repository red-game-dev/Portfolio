import { ApiClient, ApiClientConfig, ApiFailure } from "@/packages/http/api-client";

import { Mail, MailAttempt, MailOutcome } from "../domain/types";
import { MailAdapter } from "./MailAdapter";

// Long enough for a provider to answer, short enough that the mail service can retry within its deadline.
const TIMEOUT_MS = 6000;

export interface HttpMailAdapterOptions {
  domain?: string;
  client?: ApiClient;
  now?: () => number;
}

// What every provider with an HTTP API shares: its own instance of the shared client (the provider's base URL and
// key, a timeout, and no retries of its own: the mail service retries, with the email's idempotency key), the post,
// and its answer read as an outcome, timed. A provider says where it posts, how an email becomes its body, which header
// takes an idempotency key, and, if its answers differ, what they mean.
export abstract class HttpMailAdapter<TBody> extends MailAdapter {
  protected readonly client: ApiClient;
  // The header a provider takes an idempotency key in, for one that does: it then sends an email with the same key at
  // most once. None, and the key is not sent.
  protected readonly idempotencyHeader: string | null = null;
  private readonly now: () => number;
  protected abstract readonly path: string;

  constructor(config: ApiClientConfig, { domain, client = ApiClient.global(), now = Date.now }: HttpMailAdapterOptions = {}) {
    super(domain);
    this.client = client.withConfig({ timeout: TIMEOUT_MS, ...config, retry: { retries: 0 } });
    this.now = now;
  }

  public async send(mail: Mail, idempotencyKey?: string): Promise<MailAttempt> {
    const started = this.now();
    const headers: Record<string, string> = idempotencyKey && this.idempotencyHeader ? { [this.idempotencyHeader]: idempotencyKey } : {};
    const result = await this.client.post<unknown, TBody>(this.path, this.bodyOf(mail), { headers });

    return { adapter: this.id, outcome: result.ok ? "sent" : this.outcomeOf(result), status: result.status, ms: this.now() - started };
  }

  // A provider's refusal, from its status (and its body, for one that says more there): its limits (429) for now, any
  // other refusal (4xx) definite, and no answer or its own error (5xx) failed, when the email may or may not have gone.
  protected outcomeOf(failure: ApiFailure): MailOutcome {
    if (failure.status === 429) {
      return "limited";
    }

    return failure.status >= 400 && failure.status < 500 ? "rejected" : "failed";
  }

  protected abstract bodyOf(mail: Mail): TBody;
}
