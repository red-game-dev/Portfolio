import { ContactRequest } from "../domain/types";

const isOptionalText = (value: unknown) => value === undefined || typeof value === "string";

// Whether a body has the shape of a request: its kind, its message as text, and any other field as text.
export const isContactRequest = (value: unknown): value is ContactRequest => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (body.kind === "message" || body.kind === "feedback") && typeof body.message === "string" &&
    isOptionalText(body.name) && isOptionalText(body.email) && isOptionalText(body.subject) && isOptionalText(body.website) && isOptionalText(body.key);
};
