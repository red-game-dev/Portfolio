export { CONTACT_LIMITS } from "./config";
export { CONTACT_STATUS } from "./domain/types";
export { isContactRequest } from "./guards/isContactRequest";
export { contactMail } from "./mappers/contactMail";
export { ContactService } from "./services/ContactService";
export { contactProblems } from "./validators/contactProblems";
export type { ContactKind, ContactOutcome, ContactProblem, ContactRefusal, ContactRequest, ContactStatus } from "./domain/types";
export type { ContactRoute } from "./mappers/contactMail";
export type { ContactServiceOptions, SendCeiling, SendHealth, SendRecord } from "./services/ContactService";
