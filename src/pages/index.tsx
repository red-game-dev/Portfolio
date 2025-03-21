import React, { Suspense } from "react";

import dynamic from "next/dynamic";

import { About } from "@/components/About";
import { Cover } from "@/components/Cover";
import { Projects } from "@/components/Projects";
import { Resume } from "@/components/Resume";
import { Services } from "@/components/Services";
import { Skills } from "@/components/Skills";
import { Text } from "@/components/Text";
import { portfolioData } from "@/data/resume";

const Layout = dynamic(() => import("@/layouts/Layout"), {
  suspense: true,
});

export default function Home() {
  return (
    <Suspense>
      <Layout title={portfolioData.details.name}>
        <Cover intro={portfolioData.intro} image={portfolioData.cover} typingsTitles={portfolioData.typingsTitles} />
        <About
          {...portfolioData.details}
          linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn}
          cvUrl={portfolioData.cv}
          github={portfolioData.github}
          stackoverflow={portfolioData.stackoverflow}
        />
        <Services
          services={portfolioData.services}
          intro={portfolioData.sections.services}
        />
        <Resume
          education={portfolioData.education}
          experience={portfolioData.experience}
        />
        <Skills skills={portfolioData.skills.tech} intro={portfolioData.sections.tech} isCircle={true} />
        <Skills skills={portfolioData.skills.tools} intro={portfolioData.sections.tools} isCircle={true} />
        <Skills skills={portfolioData.skills.design} intro={portfolioData.sections.design} />
        <Skills skills={portfolioData.skills.language} intro={portfolioData.sections.language} />
        <Skills skills={portfolioData.skills.teamplayer} intro={portfolioData.sections.teamplayer} />
        <Skills skills={portfolioData.skills.expertise} intro={portfolioData.sections.expertise} isCircle={true} />
        <Projects projects={portfolioData.projects} intro={portfolioData.sections.projects} />
        <Text
          title={portfolioData.sections.recommendations.title}
          paragraphs={portfolioData.sections.recommendations.description}
        />
        <Text
          title={portfolioData.sections.conclusion.title}
          paragraphs={portfolioData.sections.conclusion.description}
        />
      </Layout>
    </Suspense>
  );
}

