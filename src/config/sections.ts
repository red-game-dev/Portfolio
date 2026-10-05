import { Audience } from "@/types/case-studies";

// Section anchors shared by the section, the Menu scroll-spy and the SEO breadcrumb, so they cannot
// drift apart. Older sections still hardcode theirs; move them here as they are touched.
export const SECTION_IDS = {
  aiUsage: "section-ai-usage",
  arena: "section-arena",
  caseStudies: "section-case-studies",
  codeReview: "section-code-review",
  duels: "section-duels",
  platform: "section-platform",
  roster: "section-roster",
  skillAreas: "section-skills-areas",
} as const;

// Links an application can point at, for example https://redgame.dev/#for-payments.
export const AUDIENCE_ANCHORS: Record<Audience, string> = {
  payments: "for-payments",
  ai: "for-ai-engineering",
  architecture: "for-architecture",
};
