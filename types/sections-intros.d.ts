import { Lens } from "@/config/lenses";
import { SkillGroup } from "@/types/skills";

export interface SectionIntros {
  title: string;
  description: string[];
  // The same section introduced for another reader. Titles never change, so the menu and the trail
  // always name a section the same way.
  lenses?: Partial<Record<Lens, string[]>>;
}

// Every section with an intro, including one per skill group for the forge's stations.
export type SectionIntroKey = SkillGroup | "terminal" | "history" | "services" | "aiUsage" | "skillAreas" | "caseStudies" | "web3"
  | "igaming" | "codeReview" | "platform" | "engineRoom" | "arena" | "duels" | "forge" | "talents" | "roster" | "projects" | "recommendations";

export type SectionIntroMap = Record<SectionIntroKey, SectionIntros>;
