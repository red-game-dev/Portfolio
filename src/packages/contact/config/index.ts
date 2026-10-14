// How long each part of a message may be, in characters. A message needs a sentence to be worth sending, and stays
// short enough for an email.
export const CONTACT_LIMITS = {
  messageLeast: 10,
  messageMost: 4000,
  nameMost: 100,
  emailMost: 254,
  subjectMost: 120,
} as const;
