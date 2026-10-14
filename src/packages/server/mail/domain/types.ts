// One email: who it is from (a sender the provider has verified, "Name <address>"), to, its subject and plain text,
// and where a reply goes.
export interface Mail {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

// What became of a send: accepted, refused for now because the provider's limits are reached, or failed (a bad key,
// a sender not verified, the provider down).
export type MailOutcome = "sent" | "limited" | "failed";

// The port a mail provider answers.
export interface MailSender {
  send(mail: Mail, idempotencyKey?: string): Promise<MailOutcome>;
}
