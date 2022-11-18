import React from "react";

import { About } from "@/components/About";
import { Cover } from "@/components/Cover";
import { Projects } from "@/components/Projects";
import { Resume } from "@/components/Resume";
import { Services } from "@/components/Services";
import { Skills } from "@/components/Skills";

import { Text } from "../components/Text";
import resumeData from "../data/resume.json";
import Layout from "../layouts/Layout";

export default function Home() {
  return (
    <Layout title="Redeemer Pace">
        <Cover intro={resumeData.intro} />
        <About
          description={resumeData.details.description}
          residence={resumeData.details.residence}
          jobType={resumeData.details.jobType}
          phone={resumeData.details.phone}
          email={resumeData.details.email}
          isFlexible={resumeData.details.isFlexible}
        />
        <Services
           services={resumeData.services}
        />
        <Resume
          education={resumeData.education}
          experience={resumeData.experience}
        />
        <Skills title="Design Skills" skills={resumeData.skills.design} />
        <Skills title="Language Skills" skills={resumeData.skills.language}  />
        <Skills title="Coding Skills" skills={resumeData.skills.tech} isCircle={true} />
        <Skills title="Tools Skills" skills={resumeData.skills.tools} isCircle={true} />
        <Skills title="Knowladge Skills" skills={resumeData.skills.expertise} isCircle={true} />
        <Projects projects={resumeData.projects} />
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

