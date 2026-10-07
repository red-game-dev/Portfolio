import { SOCIAL_URLS } from "@/config/social";
import { PortfolioData } from "@/data/resume";
import { toMonthIndex } from "@/packages/insights/career";
import { Command, TerminalDialog } from "@/packages/interaction/terminal";
import { createContactDialog } from "@/services/contact";
import { createRosterLevels, RosterLevels } from "@/services/roster";
import { Resume } from "@/types/resume";

// How help groups the commands, in the order it lists them.
export const GROUPS = {
  me: "Get to know me",
  work: "See the work",
  contact: "Get in touch",
  red: "Ask me to do it",
  around: "Get around",
  fun: "Just for fun",
  terminal: "Terminal",
} as const;

export const PERIOD = "{from} to {to}";
export const PRESENT = "now";

export const matches = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

// What every group of commands reads from, worked out once.
export interface CommandContext {
  data: PortfolioData;
  // Newest first.
  experience: Resume[];
  rosterLevels: RosterLevels;
  linkedIn: string;
  contactDialog: TerminalDialog;
  // Every command by name, filled in once they all exist, for cat to run the one a file stands for.
  commandsByName: Map<string, Command>;
}

export const createCommandContext = (data: PortfolioData): CommandContext => ({
  data,
  experience: [...data.experience].sort((first, second) => toMonthIndex(second.from) - toMonthIndex(first.from)),
  rosterLevels: createRosterLevels(data.roster),
  linkedIn: SOCIAL_URLS.linkedIn(data.socialMedia.byUsername.linkedIn),
  contactDialog: createContactDialog(data),
  commandsByName: new Map(),
});
