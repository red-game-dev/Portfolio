import { ApiClient, ApiClientConfig } from "@/packages/http/api-client";

import { Mail, MailOutcome, MailResult } from "../domain/types";
import { MailAdapter } from "./MailAdapter";

// Long enough for a provider to answer, short enough that a visitor waiting on a form is not left hanging.
const TIMEOUT_MS = 8000;

export interface HttpMailAdapterOptions {
  domain?: string;
  client?: ApiClient;
  now?: () => number;
}

// What every provider with an HTTP API shares: its own instance of the shared client (the provider's base URL and
// key, a timeout, and no retries, since a retried send could arrive twice; an idempotency key covers a retry on
// purpose), the post, and its answer read as an outcome, timed. A provider says only where it posts, how an email
// becomes its body, and, if its statuses differ, what they mean.
export abstract class HttpMailAdapter<TBody> extends MailAdapter {
  protected readonly client: ApiClient;
  private readonly now: () => number;
  protected abstract readonly path: string;

  constructor(config: ApiClientConfig, { domain, client = ApiClient.global(), now = Date.now }: HttpMailAdapterOptions = {}) {
    super(domain);
    this.client = client.withConfig({ timeout: TIMEOUT_MS, ...config, retry: { retries: 0 } });
    this.now = now;
  }

  public async send(mail: Mail, idempotencyKey?: string): Promise<MailResult> {
    const started = this.now();
    const result = await this.client.post<unknown, TBody>(this.path, this.bodyOf(mail), idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {});

    return { outcome: result.ok ? "sent" : this.outcomeOf(result.status), adapter: this.id, status: result.status, ms: this.now() - started };
  }

  // A provider's refusal: its limits (429) for now, anything else failed. A provider whose statuses differ says so here.
  protected outcomeOf(status: number): MailOutcome {
    return status === 429 ? "limited" : "failed";
  }

  protected abstract bodyOf(mail: Mail): TBody;
}
