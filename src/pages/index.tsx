import React from "react";

import { About } from "@/components/About";
import { Cover } from "@/components/Cover";
import { Projects } from "@/components/Projects";
import { Resume } from "@/components/Resume";
import { Services } from "@/components/Services";
import { Skills } from "@/components/Skills";
import { Text } from "@/components/Text";
import { portfolioData  } from "@/data/resume";
import Layout from "@/layouts/Layout";

export default function Home() {
  return (
    <Layout title="Redeemer Pace">
      <Cover intro={portfolioData.intro} image={portfolioData.cover} />
      <About
        {...portfolioData.details}
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
      <Skills skills={portfolioData.skills.expertise} intro={portfolioData.sections.expertise} isCircle={true} />
      <Projects projects={portfolioData.projects} intro={portfolioData.sections.projects} />
      <Text
        title="Custom Text"
        paragraphs={
          [
            "Test 1",
            "Test 2"
          ]
        }
      />
    </Layout>
  );
}

