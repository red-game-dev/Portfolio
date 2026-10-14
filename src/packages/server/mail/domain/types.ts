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

// What became of a send: accepted; refused for now because the provider's limits are reached; rejected, a definite
// refusal that will happen again until someone changes something (a revoked key, a sender not verified); or failed, no
// answer or the provider's own error, when it may or may not have gone.
export type MailOutcome = "sent" | "limited" | "rejected" | "failed";

// One provider's try: which, what became of it, its HTTP status (0 when no answer came) and how long it took.
export interface MailAttempt {
  adapter: string;
  outcome: MailOutcome;
  status: number;
  ms: number;
}

// What became of an email across every provider tried, for the caller and the log.
export interface MailResult {
  outcome: MailOutcome;
  attempts: MailAttempt[];
  ms: number;
}

// What sends mail, as a caller sees it. `idempotencyKey` names the email once, so a retry of it is sent at most once.
export interface Mailer {
  send(mail: Mail, idempotencyKey?: string): Promise<MailResult>;
}
