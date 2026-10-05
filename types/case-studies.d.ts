import { Industry } from "@/types/industry";

export type Audience = "payments" | "ai" | "architecture";

// The group a case study sits in on the page.
export type CaseStudyDomain = "architecture" | "payments" | "web3" | "igaming" | "games" | "mobile" | "security" | "ai";

export interface CaseStudy {
  domain: CaseStudyDomain;
  // A finer label, shown above the title.
  area: string;
  title: string;
  summary: string[];
  points: string[];
  tags: string[];
  // Which reader it is most relevant to, for the filtered views.
  audiences: Audience[];
  // The rule kept after the fight, shown as the boss's loot.
  loot: string;
  // Sectors it applies to, for the industry filter. Left out where naming one would attribute it.
  industries?: Industry[];
}

export interface DiagramNode {
  name: string;
  detail: string;
}

export interface PlatformDiagrams {
  adapters: {
    title: string;
    core: string;
    contracts: string;
    seams: DiagramNode[];
    caption: string;
  };
  moneyFlow: {
    title: string;
    steps: DiagramNode[];
    inputs: DiagramNode[];
    caption: string;
  };
}

export interface CaseStudyFilters {
  allLabel: string;
  label: string;
  domains: Record<CaseStudyDomain, string>;
}

// A kind of system built more than once, with the places it was built.
export interface ExpertiseTile {
  name: string;
  detail: string;
  places: string[];
}

export interface ExpertiseContent {
  tiles: ExpertiseTile[];
  exampleTitle: string;
  exampleDescription: string;
}
