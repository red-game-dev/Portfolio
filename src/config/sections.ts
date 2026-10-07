import { Audience } from "@/types/case-studies";
import { Industry } from "@/types/industry";

// Every section's anchor, in one place, so the section, the menu, the trail, the terminal's goto and the
// SEO breadcrumb cannot drift apart. In page order.
export const SECTION_IDS = {
  cover: "section-started",
  // Where the first screen's text starts, below the cover picture.
  intro: "section-intro",
  glance: "section-glance",
  about: "section-about",
  terminal: "section-terminal",
  services: "section-services",
  history: "section-history",
  aiUsage: "section-ai-usage",
  web3: "section-web3",
  skillAreas: "section-skills-areas",
  platform: "section-platform",
  codeReview: "section-code-review",
  igaming: "section-igaming",
  roster: "section-roster",
  forge: "section-skills",
  talents: "section-talents",
  caseStudies: "section-case-studies",
  duels: "section-duels",
  projects: "section-projects",
  engineRoom: "section-engine-room",
  recommendations: "section-recommendations",
  arena: "section-arena",
  finale: "section-finale",
} as const;

export type SectionKey = keyof typeof SECTION_IDS;

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
  enterprise: "for-enterprise-architecture",
  product: "for-product-engineering",
} as const;

// #industry-fintech and so on filter My History and the boss fights to one sector.
const INDUSTRY_PREFIX = "industry-";

export const industryAnchor = (industry: Industry) => `${INDUSTRY_PREFIX}${industry}`;

export const industryFromHash = (hash: string, industries: Industry[]): Industry | null => {
  const anchor = hash.replace(/^#/, "");

  return industries.find((industry) => industryAnchor(industry) === anchor) ?? null;
};
