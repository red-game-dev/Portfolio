import { aiUsageContent } from "@/data/portfolio/aiUsage";
import { caseStudiesContent } from "@/data/portfolio/caseStudies";
import { cvDocumentContent } from "@/data/portfolio/cvDocument";
import { domainsContent } from "@/data/portfolio/domains";
import { gameContent } from "@/data/portfolio/game";
import { historyContent } from "@/data/portfolio/history";
import { navigationContent } from "@/data/portfolio/navigation";
import { preferencesContent } from "@/data/portfolio/preferences";
import { profileContent } from "@/data/portfolio/profile";
import { projectsContent } from "@/data/portfolio/projects";
import { rosterContent } from "@/data/portfolio/roster";
import { sectionsContent } from "@/data/portfolio/sections";
import { servicesContent } from "@/data/portfolio/services";
import { skillsContent } from "@/data/portfolio/skills";
import { terminalContent } from "@/data/portfolio/terminal";
import { timelapseContent } from "@/data/portfolio/timelapse";
import { PortfolioData } from "@/types/portfolio";

export type { PortfolioData } from "@/types/portfolio";

// Everything the site says, in one object the page slices into its sections. Each part of the page keeps
// its words in its own file under src/data/portfolio; the type in types/portfolio.d.ts holds them together.
export const portfolioData: PortfolioData = {
  ...profileContent,
  ...terminalContent,
  ...timelapseContent,
  ...sectionsContent,
  ...servicesContent,
  ...historyContent,
  ...skillsContent,
  ...rosterContent,
  ...projectsContent,
  ...caseStudiesContent,
  ...gameContent,
  ...domainsContent,
  ...aiUsageContent,
  ...navigationContent,
  ...cvDocumentContent,
  ...preferencesContent,
};
