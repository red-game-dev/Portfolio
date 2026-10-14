// The words of the site's two forms: a message to answer, in the contact and hire cards, and feedback at the end of
// the journey, which may stay anonymous.
export interface MessageFormContent {
  heading: string;
  intro: string;
  name: string;
  email: string;
  message: string;
  send: string;
  // Said once it is on its way: "{time}" is replaced with when replies come.
  sent: string;
}

export interface FeedbackFormContent {
  heading: string;
  // The subject feedback goes under, sent here or from the visitor's own email app.
  subject: string;
  intro: string;
  email: string;
  message: string;
  send: string;
  sent: string;
}

// What both forms share: the field markers, the state while sending, what the site keeps, and what to say when a
// message cannot go through the site, each offering the visitor's own email app.
export interface FormsSharedContent {
  required: string;
  optional: string;
  sending: string;
  privacy: string;
  ownApp: string;
  // A field only a bot sees and fills in: its label.
  trap: string;
  // The site cannot send now: no way to send set up, the day's sends used up, or the mail service refusing.
  closed: string;
  // Said when fields need fixing, while each says what.
  check: string;
  // The day's sends are used up.
  full: string;
  limited: string;
  failed: string;
  problems: {
    messageShort: string;
    messageLong: string;
    emailMissing: string;
    emailInvalid: string;
    nameLong: string;
    subjectLong: string;
  };
}

// What a dialog needs to draw the message form: its words, and the address and reply time it names.
export interface MessageFormSetup {
  words: MessageFormContent;
  shared: FormsSharedContent;
  email: string;
  contactTime: string;
}

export interface FormsContent {
  message: MessageFormContent;
  feedback: FeedbackFormContent;
  shared: FormsSharedContent;
}
