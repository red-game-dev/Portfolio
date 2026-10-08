import { SECTION_IDS } from "@/config/sections";
import { PortfolioData } from "@/data/resume";

export interface TrailSection {
  id: string;
  title: string;
}

// Every section in page order with the title the reader sees, taken from the same intros the sections
// render, so the trail can never name a section differently from the page.
export const createJourneyTrail = (data: PortfolioData): TrailSection[] => [
  { id: SECTION_IDS.cover, title: data.journeyTrail.titles.started },
  { id: SECTION_IDS.about, title: data.journeyTrail.titles.about },
  { id: SECTION_IDS.terminal, title: data.sections.terminal.title },
  { id: SECTION_IDS.services, title: data.sections.services.title },
  { id: SECTION_IDS.history, title: data.sections.history.title },
  { id: SECTION_IDS.aiUsage, title: data.sections.aiUsage.title },
  { id: SECTION_IDS.web3, title: data.sections.web3.title },
  { id: SECTION_IDS.skillAreas, title: data.sections.skillAreas.title },
  { id: SECTION_IDS.platform, title: data.sections.platform.title },
  { id: SECTION_IDS.codeReview, title: data.sections.codeReview.title },
  { id: SECTION_IDS.igaming, title: data.sections.igaming.title },
  { id: SECTION_IDS.roster, title: data.sections.roster.title },
  { id: SECTION_IDS.forge, title: data.sections.forge.title },
  { id: SECTION_IDS.talents, title: data.sections.talents.title },
  { id: SECTION_IDS.caseStudies, title: data.sections.caseStudies.title },
  { id: SECTION_IDS.duels, title: data.sections.duels.title },
  { id: SECTION_IDS.projects, title: data.sections.projects.title },
  { id: SECTION_IDS.engineRoom, title: data.sections.engineRoom.title },
  { id: SECTION_IDS.recommendations, title: data.sections.recommendations.title },
  { id: SECTION_IDS.arena, title: data.sections.arena.title },
  { id: SECTION_IDS.finale, title: data.finale.kicker },
  { id: SECTION_IDS.timelapse, title: data.sections.timelapse.title },
];
