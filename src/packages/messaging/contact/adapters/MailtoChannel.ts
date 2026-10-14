import { ContactChannel, Delivery } from "../core/ContactChannel";
import { ContactRequest } from "../domain/types";

// The most of a message a mail link carries: some mail apps refuse a longer link.
export const MAILTO_MOST = 1800;

// The channel that always works: the visitor's own email app, opened on a message to `address` under the request's
// subject (or `subject`) with what they wrote already in it. It delivers by handing them the link.
export class MailtoChannel extends ContactChannel {
  public readonly id = "mailto";
  private readonly address: string;
  private readonly subject: string;

  constructor(address: string, subject: string) {
    super();
    this.address = address;
    this.subject = subject;
  }

  public linkFor(request: Pick<ContactRequest, "message" | "subject">): string {
    const subject = request.subject || this.subject;

    return `mailto:${this.address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(request.message.trim().slice(0, MAILTO_MOST))}`;
  }

  public isOpen(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public deliver(request: ContactRequest): Promise<Delivery> {
    return Promise.resolve({ kind: "link", href: this.linkFor(request) });
  }
}
