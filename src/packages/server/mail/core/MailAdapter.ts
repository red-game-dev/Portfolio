import { Mail, MailAttempt } from "../domain/types";

// What every mail provider's adapter shares: its id for the log, the domain it has verified to send from (if it says),
// and the sender's address built on that domain. An adapter makes one try; the mail service decides what comes next.
export abstract class MailAdapter {
  protected readonly domain?: string;
  public abstract readonly id: string;

  constructor(domain?: string) {
    this.domain = domain;
  }

  protected fromOf(mail: Mail): string {
    return `${mail.sender.name} <${mail.sender.user}@${this.domain || mail.sender.domain}>`;
  }

  public abstract send(mail: Mail, idempotencyKey?: string): Promise<MailAttempt>;
}
