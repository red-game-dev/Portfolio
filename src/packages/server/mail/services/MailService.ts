import { MailAdapter } from "../core/MailAdapter";
import { Mail, MailAttempt, Mailer, MailOutcome, MailResult } from "../domain/types";

export interface MailServiceOptions {
  // No new try starts after this long, so the whole send ends well within what the caller waits.
  deadlineMs?: number;
  // How long to wait before trying the same provider again, so the try does not land while the first is still running.
  retryPauseMs?: number;
  now?: () => number;
  pause?: (ms: number) => Promise<void>;
}

const DEADLINE_MS = 12 * 1000;
const RETRY_PAUSE_MS = 750;

const pauseFor = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

// Sends mail through its adapters in order. A definite refusal (a provider's limits, or a rejection) hands the email to
// the next provider; no answer or a provider's own error may mean it went, so it is tried once more on the same
// provider with the same idempotency key, which sends it at most once, and never handed to another provider, which
// could send it twice. An adapter that throws counts as failing. Every try is kept, for the log.
export class MailService implements Mailer {
  private readonly adapters: readonly MailAdapter[];
  private readonly deadlineMs: number;
  private readonly retryPauseMs: number;
  private readonly now: () => number;
  private readonly pause: (ms: number) => Promise<void>;

  constructor(adapters: readonly MailAdapter[], { deadlineMs = DEADLINE_MS, retryPauseMs = RETRY_PAUSE_MS, now = Date.now, pause = pauseFor }: MailServiceOptions = {}) {
    this.adapters = adapters;
    this.deadlineMs = deadlineMs;
    this.retryPauseMs = retryPauseMs;
    this.now = now;
    this.pause = pause;
  }

  // Whether any provider is set up to send at all.
  public get isReady(): boolean {
    return this.adapters.length > 0;
  }

  public async send(mail: Mail, idempotencyKey?: string): Promise<MailResult> {
    const started = this.now();
    const attempts: MailAttempt[] = [];
    const isLate = () => this.now() - started >= this.deadlineMs;
    const result = (outcome: MailOutcome): MailResult => ({ outcome, attempts, ms: this.now() - started });

    for (const adapter of this.adapters) {
      if (attempts.length > 0 && isLate()) {
        break;
      }

      let attempt = await this.attempt(adapter, mail, idempotencyKey);

      attempts.push(attempt);

      if (attempt.outcome === "failed" && idempotencyKey && !isLate()) {
        await this.pause(this.retryPauseMs);
        attempt = await this.attempt(adapter, mail, idempotencyKey);
        attempts.push(attempt);
      }

      if (attempt.outcome === "sent" || attempt.outcome === "failed") {
        return result(attempt.outcome);
      }
    }

    // Every provider refused for certain: limited if any refused only for its limits, so a busy day reads apart from a
    // broken setup.
    if (attempts.length === 0) {
      return result("failed");
    }

    return result(attempts.some((attempt) => attempt.outcome === "limited") ? "limited" : "rejected");
  }

  private async attempt(adapter: MailAdapter, mail: Mail, idempotencyKey?: string): Promise<MailAttempt> {
    const started = this.now();

    try {
      return await adapter.send(mail, idempotencyKey);
    } catch {
      return { adapter: adapter.id, outcome: "failed", status: 0, ms: this.now() - started };
    }
  }
}
