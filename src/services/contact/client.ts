import { CONTACT_STATUS, ContactRefusal, ContactRequest } from "@/packages/contact";
import { ApiClient } from "@/packages/http/api-client";

const ENDPOINT = "/api/contact/";

// Whether the site can send a message now; false when it cannot be reached either, so the form offers the visitor's
// own email app from the start.
export const contactIsOpen = async (): Promise<boolean> => {
  const result = await ApiClient.global().get<unknown>(ENDPOINT);

  return result.ok && typeof result.data === "object" && result.data !== null && "isOpen" in result.data && result.data.isOpen === true;
};

// A refusal from its status (the form checks a message with the same rules before sending, so it knows what was
// wrong); a server that cannot be reached, or answers with anything else, failed. Full and unavailable read alike to a
// visitor: the site cannot send it now.
const refusalOf = (status: number): ContactRefusal => {
  const found = (Object.keys(CONTACT_STATUS) as ContactRefusal[]).find((refusal) => refusal !== "unavailable" && CONTACT_STATUS[refusal] === status);

  return found ?? "failed";
};

// What became of a message: sent, or why not.
export const sendContact = async (request: ContactRequest): Promise<{ ok: true } | { error: ContactRefusal }> => {
  const result = await ApiClient.global().post<unknown>(ENDPOINT, request);

  return result.ok ? { ok: true } : { error: refusalOf(result.status) };
};
