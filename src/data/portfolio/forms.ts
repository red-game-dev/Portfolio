import { PortfolioData } from "@/types/portfolio";

// The site's forms: a message in the contact and hire cards, and feedback at the end of the journey.
export const formsContent: Pick<PortfolioData, "forms"> = {
  forms: {
    message: {
      heading: "Or write to me here",
      intro: "It comes straight to my inbox, and my reply goes to the email you give.",
      name: "Your name",
      email: "Your email",
      message: "Your message",
      send: "Send message",
      sent: "Sent. I usually reply {time}.",
    },
    feedback: {
      heading: "What could I do better?",
      subject: "Feedback on your site",
      intro: "What the site lacks, what I could improve, what you would want to see. Anonymous unless you add your email.",
      email: "Your email, if you would like a reply",
      message: "Your feedback",
      send: "Send feedback",
      sent: "Thank you. I read every one.",
    },
    shared: {
      required: "required",
      optional: "optional",
      sending: "Sending",
      privacy: "Sent to me by email through a mail service. This site keeps nothing, and your address only travels with the message if you add it.",
      ownApp: "Write it in your own email app",
      trap: "Leave this empty",
      closed: "The site cannot send messages right now. Your own email app can, with what you wrote already in it.",
      check: "Some fields need fixing, marked above.",
      limited: "That is a lot of messages in a short time. Try again later, or send it from your own email app.",
      failed: "It did not go through. Your own email app can send it instead, with what you wrote already in it.",
      problems: {
        messageShort: "Write at least {least} characters.",
        messageLong: "Keep it under {most} characters.",
        emailMissing: "Add your email so I can write back.",
        emailInvalid: "That email address does not look right.",
        nameLong: "Keep your name under {most} characters.",
        subjectLong: "The subject is too long.",
      },
    },
  },
};
