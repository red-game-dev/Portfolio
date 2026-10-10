import { PortfolioAiUsage } from "@/types/ai-usage";
import { BlueprintLabels } from "@/types/blueprints";
import { CarouselLabels } from "@/types/carousel";
import { CaseStudy, CaseStudyFilters, ExpertiseContent } from "@/types/case-studies";
import { CodeReviewContent } from "@/types/code-review";
import { CvDocument } from "@/types/cv-document";
import { Detail } from "@/types/details";
import { IGamingContent, Web3Content } from "@/types/domains";
import { ForgeContent, TalentsContent } from "@/types/forge";
import { ArenaContent, BossLabels, Duels, FinaleContent, HudLabels, JourneyTrailContent } from "@/types/game";
import { Github } from "@/types/general";
import { Headline } from "@/types/headline";
import { HistoryLabels } from "@/types/history";
import { LensContent } from "@/types/lens";
import { MenuContent } from "@/types/menu";
import { ProjectDetail, ProjectMapContent } from "@/types/projects";
import { Recommendation } from "@/types/recommendations";
import { Resume } from "@/types/resume";
import { Roster } from "@/types/roster";
import { SectionIntroMap } from "@/types/sections-intros";
import { ServiceActions, ServiceGroup } from "@/types/services";
import { SkillArea, SkillLists } from "@/types/skills";
import { TerminalContent } from "@/types/terminal";
import { TimelapseContent } from "@/types/timelapse";
import { PreferencesContent } from "@/types/preferences";

// A document the site offers, and what its link says.
export interface DocumentLink {
  url: string;
  label: string;
}

// The shape of everything the site says. The content lives in src/data/portfolio, one file per part of
// the page, gathered into portfolioData by src/data/resume.ts.
export interface PortfolioData {
  intro: string;
  headline: Headline;
  terminal: TerminalContent;
  cover: string;
  cv: string;
  fullResume: DocumentLink;
  cvDocument: CvDocument;
  typingsTitles: string[];
  details: Detail;
  github: Github[];
  stackoverflow: string;
  sections: SectionIntroMap;
  serviceGroups: ServiceGroup[];
  serviceActions: ServiceActions;
  education: Resume[];
  experience: Resume[];
  historyLabels: HistoryLabels;
  skills: SkillLists;
  skillAreas: SkillArea[];
  roster: Roster;
  forge: ForgeContent;
  talents: TalentsContent;
  projects: ProjectDetail[];
  projectMap: ProjectMapContent;
  caseStudies: CaseStudy[];
  caseStudyFilters: CaseStudyFilters;
  duels: Duels;
  bossLabels: BossLabels;
  hud: HudLabels;
  journeyTrail: JourneyTrailContent;
  lens: LensContent;
  arena: ArenaContent;
  finale: FinaleContent;
  blueprintLabels: BlueprintLabels;
  carouselLabels: CarouselLabels;
  // Every startup I founded or co-founded, listed in History or not.
  foundedTotal: number;
  menu: MenuContent;
  preferences: PreferencesContent;
  expertise: ExpertiseContent;
  codeReview: CodeReviewContent;
  web3: Web3Content;
  igaming: IGamingContent;
  recommendations: Recommendation[];
  aiUsage: PortfolioAiUsage;
  timelapse: TimelapseContent;
  socialMedia: {
    byUsername: {
      twitter: string;
      instagram: string;
      facebook: string;
      linkedIn: string;
    };
    byProjectsUsername: {
      gameYt: string;
    };
  };
}
