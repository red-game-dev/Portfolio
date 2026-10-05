import { Audience } from "@/types/case-studies";
import { Industry } from "@/types/industry";

// Section anchors shared by the section, the Menu scroll-spy and the SEO breadcrumb, so they cannot
// drift apart. Older sections still hardcode theirs; move them here as they are touched.
export const SECTION_IDS = {
  aiUsage: "section-ai-usage",
  arena: "section-arena",
  caseStudies: "section-case-studies",
  codeReview: "section-code-review",
  duels: "section-duels",
  igaming: "section-igaming",
  platform: "section-platform",
  roster: "section-roster",
  skillAreas: "section-skills-areas",
  web3: "section-web3",
} as const;

// Links an application can point at, for example https://redgame.dev/#for-payments.
export const AUDIENCE_ANCHORS: Record<Audience, string> = {
  payments: "for-payments",
  ai: "for-ai-engineering",
  architecture: "for-architecture",
};

// More role links from the first screen, each landing on the section that backs the role.
export const ROLE_ANCHORS = {
  leadership: "for-leadership",
  fullStack: "for-full-stack",
  games: "for-games",
  web3: "for-web3",
} as const;

// #industry-fintech and so on filter My History and the boss fights to one sector.
const INDUSTRY_PREFIX = "industry-";

export const industryAnchor = (industry: Industry) => `${INDUSTRY_PREFIX}${industry}`;

export const industryFromHash = (hash: string, industries: Industry[]): Industry | null => {
  const anchor = hash.replace(/^#/, "");

  return industries.find((industry) => industryAnchor(industry) === anchor) ?? null;
};
