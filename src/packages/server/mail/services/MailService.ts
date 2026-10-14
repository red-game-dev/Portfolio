import { MailAdapter } from "../core/MailAdapter";
import { Mail, Mailer, MailResult } from "../domain/types";

// Sends mail through its adapters in order: the first that accepts it sends it, and a provider that refuses (its limits
// reached, or failing) hands it to the next, as a route falls back to the next. With none set up, or all refusing, the
// last answer is the result: limited if any refused only for its limits, so the caller can tell a busy day from a
// broken one.
export class MailService implements Mailer {
  private readonly adapters: readonly MailAdapter[];

  constructor(adapters: readonly MailAdapter[]) {
    this.adapters = adapters;
  }

  // Whether any provider is set up to send at all.
  public get isReady(): boolean {
    return this.adapters.length > 0;
  }

  public async send(mail: Mail, idempotencyKey?: string): Promise<MailResult> {
    let last: MailResult = { outcome: "failed", adapter: null, status: 0, ms: 0 };
    let wasLimited = false;

    for (const adapter of this.adapters) {
      last = await adapter.send(mail, idempotencyKey);

      if (last.outcome === "sent") {
        return last;
      }

      wasLimited ||= last.outcome === "limited";
    }

    return wasLimited ? { ...last, outcome: "limited" } : last;
  }
}
