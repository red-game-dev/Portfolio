import { Lens } from "@/config/lenses";
import { DetailFigureId } from "@/types/details";

// A stat on a character select card, out of LENS_STAT_MAX.
export interface LensStat {
  name: string;
  value: number;
}

export interface LensCard {
  lens: Lens;
  // Who the view is for, in plain words.
  name: string;
  // The game class the view plays as.
  characterClass: string;
  tagline: string;
  perks: string[];
  stats: LensStat[];
}

export interface RoadmapStage {
  name: string;
  detail: string;
}

// Skills shown with their years, looked up by name in the skill forge so the years are never typed twice.
export interface SkillPick {
  label: string;
  names: string[];
}

// A role a recruiter can be hiring for: the glance then leads with why I fit it, the years in the roles that
// match and the skills it asks for. Every line comes from content elsewhere on the page.
export interface HireLens {
  id: string;
  label: string;
  fit: string;
  roleClasses: string[];
  skillGroups: SkillPick[];
}

export interface RecruiterGlanceContent {
  title: string;
  description: string;
  hiringLabel: string;
  // The chip that shows the glance for every role at once.
  everyRoleLabel: string;
  hires: HireLens[];
  rolesLabel: string;
  roles: string[];
  // Roster classes whose years are shown, computed from real dates.
  yearsLabel: string;
  roleClasses: string[];
  workLabel: string;
  skillsLabel: string;
  skillGroups: SkillPick[];
  // "{years} yrs": the unit after a skill's years.
  yearsFormat: string;
  industriesLabel: string;
  recentLabel: string;
  recentCount: number;
  // "{from} to {to}", with nowLabel for a role still running.
  rangeFormat: string;
  nowLabel: string;
}

export interface PlaybookStage {
  name: string;
  example: string;
}

export interface ProductPlaybookContent {
  title: string;
  description: string;
  // Proof figures from "Who I am", picked by id so the numbers live in one place.
  proofIds: DetailFigureId[];
  levelsLabel: string;
  levelClasses: string[];
  // "Level {level}, since {since}"
  levelFormat: string;
  venturesLabel: string;
  // "since {year}"
  ventureSince: string;
  venturesNote: string;
  monetisationLabel: string;
  monetisation: string[];
  growthLabel: string;
  growth: string[];
  stagesLabel: string;
  stages: PlaybookStage[];
}

// Boss fights read as case studies outside the full view.
export interface CaseLabels {
  kind: string;
  problem: string;
  decisions: string;
  takeaway: string;
  // "{count}" is replaced.
  showSolution: string;
  hideSolution: string;
}

export interface LensContent {
  chooser: {
    title: string;
    description: string;
    select: string;
  };
  cards: LensCard[];
  // The short names the header switch uses.
  names: Record<Lens, string>;
  switchLabel: string;
  glance: {
    recruiter: RecruiterGlanceContent;
    product: ProductPlaybookContent;
  };
  caseLabels: CaseLabels;
  // The service group the product view puts first.
  productServiceGroup: string;
  entrances: {
    recruiter: { title: string };
    product: { title: string; stages: RoadmapStage[] };
    engineer: { lines: string[]; granted: string };
  };
}
