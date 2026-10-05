import { SECTION_IDS } from "@/config/sections";
import { PortfolioData } from "@/data/resume";

export interface TrailSection {
  id: string;
  title: string;
}

// Every section in page order with the title the reader sees, taken from the same intros the sections
// render, so the trail can never name a section differently from the page.
export const createJourneyTrail = (data: PortfolioData): TrailSection[] => [
  { id: "section-started", title: data.journeyTrail.titles.started },
  { id: "section-about", title: data.journeyTrail.titles.about },
  { id: "section-terminal", title: data.sections.terminal.title },
  { id: "section-services", title: data.sections.services.title },
  { id: "section-history", title: data.sections.history.title },
  { id: SECTION_IDS.aiUsage, title: data.sections.aiUsage.title },
  { id: SECTION_IDS.web3, title: data.sections.web3.title },
  { id: SECTION_IDS.skillAreas, title: data.sections.skillAreas.title },
  { id: SECTION_IDS.platform, title: data.sections.platform.title },
  { id: SECTION_IDS.codeReview, title: data.sections.codeReview.title },
  { id: SECTION_IDS.igaming, title: data.sections.igaming.title },
  { id: SECTION_IDS.roster, title: data.sections.roster.title },
  { id: "section-skills", title: data.sections.forge.title },
  { id: "section-talents", title: data.sections.talents.title },
  { id: SECTION_IDS.caseStudies, title: data.sections.caseStudies.title },
  { id: SECTION_IDS.duels, title: data.sections.duels.title },
  { id: "section-projects", title: data.sections.projects.title },
  { id: "section-Recommendations", title: data.sections.recommendations.title },
  { id: SECTION_IDS.arena, title: data.sections.arena.title },
  { id: "section-Wow", title: data.finale.kicker },
];
