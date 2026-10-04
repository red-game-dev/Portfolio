import { SECTION_IDS } from "@/config/sections";

export type ZoneId = "matrix" | "ai" | "universe" | "mmo";

// The page as one journey. Each zone starts at a section and runs until the next zone starts.
export const ZONE_BOUNDARIES: Array<{ zone: ZoneId; startsAt: string }> = [
  { zone: "matrix", startsAt: "section-started" },
  { zone: "ai", startsAt: "section-skills-ProgrammingLanguagesFrameworksSkills" },
  { zone: "universe", startsAt: "section-skills-DesignSkills" },
  { zone: "mmo", startsAt: SECTION_IDS.roster },
];
