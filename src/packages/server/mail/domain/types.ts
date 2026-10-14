// Who an email is from: a name, and the part of the address before the @. The domain is one the sending provider has
// verified, so the adapter that sends it supplies it where it names one, and `domain` stands in where it does not.
export interface MailSender {
  name: string;
  user: string;
  domain: string;
}

// One email: who it is from, to, its subject and plain text, and where a reply goes.
export interface Mail {
  sender: MailSender;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

// What became of a send: accepted, refused for now because the provider's limits are reached, or failed (a bad key,
// a sender not verified, the provider down).
export type MailOutcome = "sent" | "limited" | "failed";

// The outcome, which adapter it came from (null when none could try), the provider's HTTP status (0 when no answer
// came) and how long it took, for the log.
export interface MailResult {
  outcome: MailOutcome;
  adapter: string | null;
  status: number;
  ms: number;
}

// What sends mail, as a caller sees it: one adapter, or the service that tries several.
export interface Mailer {
  send(mail: Mail, idempotencyKey?: string): Promise<MailResult>;
}
