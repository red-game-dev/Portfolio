import { keysOf } from "@/packages/core/domain";

// A message to the site's owner, to be answered, or feedback, which may stay anonymous.
export type ContactKind = "message" | "feedback";

// What a visitor sends. `website` is a field people never see: only a bot fills it in. `key` names the message once, so
// a send of it retried (by the visitor, or by the server) arrives at most once.
export interface ContactRequest {
  kind: ContactKind;
  message: string;
  name?: string;
  email?: string;
  subject?: string;
  website?: string;
  key?: string;
}

// What can be wrong with a request, field by field.
export const CONTACT_PROBLEMS = ["messageShort", "messageLong", "emailMissing", "emailInvalid", "nameLong", "subjectLong"] as const;

export type ContactProblem = typeof CONTACT_PROBLEMS[number];

// Why a request was not sent: not valid, too many from this visitor, the day's sends used up, no way to send set up,
// or the provider failed. Every refusal but an invalid one leaves the visitor their own email app.
export type ContactRefusal = "invalid" | "limited" | "full" | "unavailable" | "failed";

export type ContactOutcome = { ok: true } | { error: ContactRefusal; problems?: ContactProblem[] };

// The HTTP status for each refusal, one map for the server and the client.
export const CONTACT_STATUS: Record<ContactRefusal, number> = { invalid: 400, limited: 429, full: 503, unavailable: 503, failed: 502 };

// Every refusal, so a value can be checked to be one.
export const CONTACT_REFUSALS: readonly ContactRefusal[] = keysOf(CONTACT_STATUS);

// Whether the site can send a message now (it has a way to send, and the day's sends are not used up).
export interface ContactStatus {
  isOpen: boolean;
}
