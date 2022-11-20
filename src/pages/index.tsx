import React from "react";

import { About } from "@/components/About";
import { Cover } from "@/components/Cover";
import { Projects } from "@/components/Projects";
import { Resume } from "@/components/Resume";
import { Services } from "@/components/Services";
import { Skills } from "@/components/Skills";
import { Text } from "@/components/Text";

import { portfolioData  } from "../data/resume";
import Layout from "../layouts/Layout";

export default function Home() {
  return (
    <Layout title="Redeemer Pace">
      <Cover intro={portfolioData.intro} />
      <About
        {...portfolioData.details}
      />
      <Services
        services={portfolioData.services}
      />
      <Resume
        education={portfolioData.education}
        experience={portfolioData.experience}
      />
      <Skills title="Tech Skills" skills={portfolioData.skills.tech} isCircle={true} />
      <Skills title="Tools Skills" skills={portfolioData.skills.tools} isCircle={true} />
      <Skills title="Design Skills" skills={portfolioData.skills.design} />
      <Skills title="Language Skills" skills={portfolioData.skills.language} />
      <Skills title="Knowladge Skills" skills={portfolioData.skills.expertise} isCircle={true} />
      <Projects projects={portfolioData.projects} />
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

