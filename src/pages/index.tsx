import { About } from "@/components/About";
import { AiUsage } from "@/components/AiUsage";
import { Arena } from "@/components/Arena";
import { CaseStudies } from "@/components/CaseStudies";
import { Cover } from "@/components/Cover";
import { Duels } from "@/components/Duels";
import { History } from "@/components/History";
import { PlatformOverview } from "@/components/PlatformOverview";
import { Projects } from "@/components/Projects";
import { Recommendations } from "@/components/Recommendations";
import { Roster } from "@/components/Roster";
import { Services } from "@/components/Services";
import { SkillAreas } from "@/components/SkillAreas";
import { SkillForge } from "@/components/SkillForge";
import { Talents } from "@/components/Talents";
import { Terminal } from "@/components/Terminal";
import { Text } from "@/components/Text";
import { portfolioData } from "@/data/resume";
import Layout from "@/layouts/Layout";
import { aiUsageService } from "@/services/ai-usage";
import { createForgeStations } from "@/services/skills";
import { createPortfolioTerminal } from "@/services/terminal/portfolioTerminal";

// Runs at build time during static generation, so content that fails validation fails the build.
const aiUsage = aiUsageService.getView();
const forgeStations = createForgeStations(portfolioData);

export default function Home() {
  return (
    <Layout title={portfolioData.details.name}>
      <Cover
        intro={portfolioData.intro}
        image={portfolioData.cover}
        typingsTitles={portfolioData.typingsTitles}
        headline={portfolioData.headline}
        cvUrl={portfolioData.cv}
        email={portfolioData.details.email}
      />
      <About
        {...portfolioData.details}
        linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn}
        cvUrl={portfolioData.cv}
        github={portfolioData.github}
        stackoverflow={portfolioData.stackoverflow}
      />
      <Terminal
        intro={portfolioData.sections.terminal}
        content={portfolioData.terminal}
        createSession={createPortfolioTerminal}
      />
      <Services
        groups={portfolioData.serviceGroups}
        actions={portfolioData.serviceActions}
        intro={portfolioData.sections.services}
        email={portfolioData.details.email}
        linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn}
      />
      <History
        intro={portfolioData.sections.history}
        experience={portfolioData.experience}
        education={portfolioData.education}
        labels={portfolioData.historyLabels}
      />
      <AiUsage {...aiUsage} />
      <SkillAreas areas={portfolioData.skillAreas} intro={portfolioData.sections.skillAreas} />
      <PlatformOverview intro={portfolioData.sections.platform} diagrams={portfolioData.platformDiagrams} />
      <Roster intro={portfolioData.sections.roster} {...portfolioData.roster} />
      <SkillForge intro={portfolioData.sections.forge} stations={forgeStations} content={portfolioData.forge} />
      <Talents
        intro={portfolioData.sections.talents}
        talents={portfolioData.skills.teamplayer.map((skill) => skill.name)}
        content={portfolioData.talents}
      />
      <CaseStudies
        caseStudies={portfolioData.caseStudies}
        intro={portfolioData.sections.caseStudies}
        filters={portfolioData.caseStudyFilters}
        audiences={portfolioData.headline.audiences}
        labels={portfolioData.bossLabels}
      />
      <Duels intro={portfolioData.sections.duels} {...portfolioData.duels} />
      <Projects
        projects={portfolioData.projects}
        intro={portfolioData.sections.projects}
        achievementLabel={portfolioData.projectAchievementLabel}
      />
      <Recommendations
        intro={portfolioData.sections.recommendations}
        recommendations={portfolioData.recommendations}
      />
      <Arena intro={portfolioData.sections.arena} content={portfolioData.arena} />
      <Text
        title={portfolioData.sections.conclusion.title}
        paragraphs={portfolioData.sections.conclusion.description}
      />
    </Layout>
  );
}
