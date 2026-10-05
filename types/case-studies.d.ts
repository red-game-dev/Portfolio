export type Audience = "payments" | "ai" | "architecture";

export interface CaseStudy {
  // The domain it sits in, shown above the title.
  area: string;
  title: string;
  summary: string[];
  points: string[];
  tags: string[];
  // Which reader it is most relevant to, for the filtered views.
  audiences: Audience[];
  // The rule kept after the fight, shown as the boss's loot.
  loot: string;
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
}
