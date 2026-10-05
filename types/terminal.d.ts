// Something a visitor can ask me to do, such as "red migrate app". Services and case studies are named by
// their titles, so the answer always points at real content on the page.
export interface TerminalIntent {
  phrase: string;
  aliases: string[];
  title: string;
  pitch: string;
  // Printed one by one as the request is "worked on".
  scan: string[];
  services: string[];
  cases: string[];
  // The email subject the contact action prefills.
  subject: string;
}

export interface TerminalRed {
  summary: string;
  usage: string;
  questTitle: string;
  hireTitle: string;
  rolesHeading: string;
  // "{input}" and "{role}" are replaced with what was typed.
  unknownIntent: string;
  unknownRole: string;
  hireSubject: string;
  scanDone: string;
  opening: string;
  labels: {
    services: string;
    proof: string;
    abilities: string;
    guilds: string;
    recommendations: string;
    level: string;
    email: string;
    linkedIn: string;
    cv: string;
    caseStudies: string;
    close: string;
  };
  intents: TerminalIntent[];
}

export interface TerminalContent {
  prompt: string;
  welcome: string[];
  suggestions: string[];
  helpTitle: string;
  // "{name}" is replaced with what was typed.
  unknownCommand: string;
  inputLabel: string;
  shortcutHint: string;
  red: TerminalRed;
}
