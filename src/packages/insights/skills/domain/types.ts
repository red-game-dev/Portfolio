import { Tenure } from "@/packages/insights/career";

export type Rarity = "legendary" | "epic" | "rare" | "common";

// Anything that used skills over a period: a job, a venture, a project.
export interface SkillSource extends Tenure {
  place: string;
  skills: string[];
}

export interface SkillRecord {
  name: string;
  years: number;
  months: number;
  places: string[];
  rarity: Rarity;
  // False when no role or project lists the skill, so no years can be claimed for it.
  isTracked: boolean;
}

export interface RarityTier {
  rarity: Rarity;
  minYears: number;
}
