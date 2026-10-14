import { CONTACT_LIMITS } from "../config";
import { ContactProblem, ContactRequest } from "../domain/types";

// An address with something either side of one @ and a dot in its domain: enough to catch a slip, without refusing a
// real address a stricter rule would.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// What is wrong with a request: a message too short or too long, a message without the email to answer it (feedback
// may stay anonymous), an email that cannot be one, a name or subject too long. None, and it may be sent.
export const contactProblems = (request: ContactRequest): ContactProblem[] => {
  const message = request.message.trim();
  const email = request.email?.trim() ?? "";
  const problems: ContactProblem[] = [];

  if (message.length < CONTACT_LIMITS.messageLeast) {
    problems.push("messageShort");
  } else if (message.length > CONTACT_LIMITS.messageMost) {
    problems.push("messageLong");
  }

  if (!email && request.kind === "message") {
    problems.push("emailMissing");
  } else if (email && (email.length > CONTACT_LIMITS.emailMost || !EMAIL.test(email))) {
    problems.push("emailInvalid");
  }

  if ((request.name?.trim().length ?? 0) > CONTACT_LIMITS.nameMost) {
    problems.push("nameLong");
  }

  if ((request.subject?.trim().length ?? 0) > CONTACT_LIMITS.subjectMost) {
    problems.push("subjectLong");
  }

  return problems;
};
