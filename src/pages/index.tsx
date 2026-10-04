import { About } from "@/components/About";
import { AiUsage } from "@/components/AiUsage";
import { CaseStudies } from "@/components/CaseStudies";
import { Cover } from "@/components/Cover";
import { Projects } from "@/components/Projects";
import { Recommendations } from "@/components/Recommendations";
import { Resume } from "@/components/Resume";
import { Services } from "@/components/Services";
import { SkillAreas } from "@/components/SkillAreas";
import { Skills } from "@/components/Skills";
import { Text } from "@/components/Text";
import { portfolioData } from "@/data/resume";
import Layout from "@/layouts/Layout";
import { aiUsageService } from "@/services/ai-usage";

// Runs at build time during static generation, so content that fails validation fails the build.
const aiUsage = aiUsageService.getView();

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
      <Services
        groups={portfolioData.serviceGroups}
        actions={portfolioData.serviceActions}
        intro={portfolioData.sections.services}
        email={portfolioData.details.email}
        linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn}
      />
      <Resume
        education={portfolioData.education}
        experience={portfolioData.experience}
      />
      <Skills skills={portfolioData.skills.tech} intro={portfolioData.sections.tech} isCircle={true} />
      <Skills skills={portfolioData.skills.tools} intro={portfolioData.sections.tools} isCircle={true} />
      <Skills skills={portfolioData.skills.frontend} intro={portfolioData.sections.frontend} />
      <Skills skills={portfolioData.skills.testing} intro={portfolioData.sections.testing} />
      <Skills skills={portfolioData.skills.integrations} intro={portfolioData.sections.integrations} />
      <Skills skills={portfolioData.skills.observability} intro={portfolioData.sections.observability} />
      <Skills skills={portfolioData.skills.ai} intro={portfolioData.sections.ai} />
      <AiUsage {...aiUsage} />
      <Skills skills={portfolioData.skills.design} intro={portfolioData.sections.design} />
      <Skills skills={portfolioData.skills.language} intro={portfolioData.sections.language} />
      <Skills skills={portfolioData.skills.teamplayer} intro={portfolioData.sections.teamplayer} />
      <Skills skills={portfolioData.skills.expertise} intro={portfolioData.sections.expertise} isCircle={true} />
      <SkillAreas areas={portfolioData.skillAreas} intro={portfolioData.sections.skillAreas} />
      <Projects projects={portfolioData.projects} intro={portfolioData.sections.projects} />
      <CaseStudies
        caseStudies={portfolioData.caseStudies}
        intro={portfolioData.sections.caseStudies}
        diagrams={portfolioData.platformDiagrams}
        filters={portfolioData.caseStudyFilters}
        audiences={portfolioData.headline.audiences}
      />
      <Recommendations
        intro={portfolioData.sections.recommendations}
        recommendations={portfolioData.recommendations}
      />
      <Text
        title={portfolioData.sections.conclusion.title}
        paragraphs={portfolioData.sections.conclusion.description}
      />
    </Layout>
  );
}
