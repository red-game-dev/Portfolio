import { questsDone } from "@/components/Finale/Voyage/quests";
import type { ArmoryView, CareerView, EconomyView, ProgressView } from "@/packages/games/voyage";

// The hangar's six tabs, each with its sections in the order they show, and its accent.
export type HangarTabId = "pilot" | "quests" | "ship" | "cargo" | "log" | "settings";

export type HangarSectionId =
  "overview" | "quests" | "completed" | "sheet" | "loadout" | "forge" | "style" | "hold" | "plans" | "codex" | "badges" | "ledger" | "settings";

export interface HangarTabSpec {
  id: HangarTabId;
  sections: readonly HangarSectionId[];
  accent: string;
}

export const HANGAR_TABS: readonly HangarTabSpec[] = [
  { id: "pilot", sections: ["overview"], accent: "#ffd76a" },
  { id: "quests", sections: ["quests", "completed"], accent: "#ff9f5a" },
  { id: "ship", sections: ["sheet", "loadout", "forge", "style"], accent: "#4fd8ff" },
  { id: "cargo", sections: ["hold", "plans"], accent: "#7dffcf" },
  { id: "log", sections: ["codex", "badges", "ledger"], accent: "#c58bff" },
  { id: "settings", sections: ["settings"], accent: "#c4d2ff" },
];

// Where the hangar opens: a tab, and a section inside it.
export interface HangarPlace {
  tab: HangarTabId;
  section: HangarSectionId;
}

export const tabOf = (section: HangarSectionId): HangarTabId => HANGAR_TABS.find((tab) => tab.sections.includes(section))?.id ?? "pilot";

export const placeOf = (section: HangarSectionId): HangarPlace => ({ tab: tabOf(section), section });

export const FIRST_PLACE: HangarPlace = { tab: "pilot", section: "overview" };

const SECTIONS = new Set<string>(HANGAR_TABS.flatMap((tab) => tab.sections));

// Whether something read back is a section this code knows, to open the hangar where it was last left.
export const isHangarSection = (value: unknown): value is HangarSectionId => typeof value === "string" && SECTIONS.has(value);

// The codex finds, badges and quests done a pilot has already seen in the hangar, so only newer ones are marked. Quests
// were counted later, so a count kept before has none.
export interface HangarSeen {
  codex: number;
  badges: number;
  quests?: number;
}

export const isHangarSeen = (value: unknown): value is HangarSeen => typeof value === "object" && value !== null &&
  typeof (value as HangarSeen).codex === "number" && typeof (value as HangarSeen).badges === "number" &&
  ["number", "undefined"].includes(typeof (value as HangarSeen).quests);

export interface HangarViews {
  economy: EconomyView;
  career: CareerView | null;
  gear: ArmoryView | null;
  progress: ProgressView | null;
}

export const badgesWon = (progress: ProgressView | null): number => progress?.achievements.filter(({ at }) => at !== null).length ?? 0;

// What the pilot has seen now, for marking it seen.
export const seenNow = ({ career, progress }: HangarViews): Required<HangarSeen> =>
  ({ codex: career?.found ?? 0, badges: badgesWon(progress), quests: career ? questsDone(career) : 0 });

// The sections with something that can be done now: a talent point to spend, a quest done (and a new one come) since
// the quests were last looked at, the next upgrade paid for, a slot of the bar left empty while there is something
// to put in it, a weapon that can be forged, a plan that can be made, and codex finds and badges newer than those seen.
export const sectionDots = (views: HangarViews, seen: HangarSeen): Set<HangarSectionId> => {
  const { economy, career, gear, progress } = views;
  const dots = new Set<HangarSectionId>();
  const onBar = new Set(economy.bar.flatMap(({ slot }) => (slot ? [`${slot.kind}:${slot.id}`] : [])));
  const offBar = [
    ...economy.boosts.map(({ id }) => `boost:${id}`),
    ...economy.cargo.filter(({ isUsable }) => isUsable).map(({ id }) => `item:${id}`),
    ...(gear?.pieces.filter(({ slot }) => slot === "weapon").map(({ uid }) => `weapon:${uid}`) ?? []),
  ].filter((key) => !onBar.has(key));

  if ((progress?.talents.left ?? 0) > 0) {
    dots.add("overview");
  }

  if (career && questsDone(career) > (seen.quests ?? questsDone(career))) {
    dots.add("quests");
  }

  if (economy.next?.shortfall.isReady) {
    dots.add("sheet");
  }

  if (economy.bar.some(({ slot }) => slot === null) && offBar.length > 0) {
    dots.add("loadout");
  }

  if (gear?.forge.some(({ isKnown, grades }) => isKnown && grades.some(({ isReady }) => isReady))) {
    dots.add("forge");
  }

  if (economy.recipes.some(({ isKnown, shortfall }) => isKnown && shortfall.isReady)) {
    dots.add("plans");
  }

  if ((career?.found ?? 0) > seen.codex) {
    dots.add("codex");
  }

  if (badgesWon(progress) > seen.badges) {
    dots.add("badges");
  }

  return dots;
};

// The tab a sideways swipe moves to: the next or the one before, stopping at either end.
export const swipeTab = (tab: HangarTabId, direction: -1 | 1): HangarTabId => {
  const index = HANGAR_TABS.findIndex(({ id }) => id === tab);

  return HANGAR_TABS[Math.min(HANGAR_TABS.length - 1, Math.max(0, index + direction))].id;
};
