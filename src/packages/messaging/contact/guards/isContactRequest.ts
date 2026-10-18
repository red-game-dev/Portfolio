import { isRecord } from "@/packages/core/domain";

import { ContactRequest } from "../domain/types";

const isOptionalText = (value: unknown) => value === undefined || typeof value === "string";

// Whether a body has the shape of a request: its kind, its message as text, and any other field as text.
export const isContactRequest = (value: unknown): value is ContactRequest => {
  if (!isRecord(value)) {
    return false;
  }

  return (value.kind === "message" || value.kind === "feedback") && typeof value.message === "string" &&
    isOptionalText(value.name) && isOptionalText(value.email) && isOptionalText(value.subject) && isOptionalText(value.website) &&
    isOptionalText(value.key);
};
