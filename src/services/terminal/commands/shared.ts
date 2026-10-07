import { SOCIAL_URLS } from "@/config/social";
import { PortfolioData } from "@/data/resume";
import { toMonthIndex } from "@/packages/insights/career";
import { SkillRecord } from "@/packages/insights/skills";
import { Command, TerminalDialog } from "@/packages/interaction/terminal";
import { createContactDialog } from "@/services/contact";
import { createRosterLevels, RosterLevels } from "@/services/roster";
import { createForgeStations } from "@/services/skills";
import { DetailFigure, DetailFigureId } from "@/types/details";
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
  // A proof figure from "Who I am", by what it counts.
  figure: (id: DetailFigureId) => DetailFigure | undefined;
  // Every tracked skill, most years first, as the forge reckons them. Worked out the first time it is asked.
  rankedSkills: () => SkillRecord[];
}

const rankSkills = (data: PortfolioData) => {
  const records = new Map<string, SkillRecord>();

  createForgeStations(data).flatMap((station) => station.items)
.filter((item) => item.isTracked)
.forEach((item) => {
    records.set(item.name, item);
  });

  return [...records.values()].sort((first, second) => second.months - first.months || first.name.localeCompare(second.name));
};

export const createCommandContext = (data: PortfolioData): CommandContext => {
  let ranked: SkillRecord[] | null = null;

  return {
    data,
    experience: [...data.experience].sort((first, second) => toMonthIndex(second.from) - toMonthIndex(first.from)),
    rosterLevels: createRosterLevels(data.roster),
    linkedIn: SOCIAL_URLS.linkedIn(data.socialMedia.byUsername.linkedIn),
    contactDialog: createContactDialog(data),
    commandsByName: new Map(),
    figure: (id) => data.details.proof.find((figure) => figure.id === id),
    rankedSkills: () => {
      ranked = ranked ?? rankSkills(data);

      return ranked;
    },
  };
};
