import React from "react";

import { About } from "@/components/About";
import { Cover } from "@/components/Cover";
import { Projects } from "@/components/Projects";
import { Resume } from "@/components/Resume";
import { Services } from "@/components/Services";
import { Skills } from "@/components/Skills";
import { Text } from "@/components/Text";
import { Detail } from "types/details";
import { ProjectDetail } from "types/projects";
import { Skill } from "types/skills";

import resumeData from "../data/resume.json";
import Layout from "../layouts/Layout";

export default function Home() {
  const { image, description, jobType, residence, phone, email, isFlexible } = resumeData.details as unknown as Detail;

  return (
    <Layout title="Redeemer Pace">
      <Cover intro={resumeData.intro} />
      <About
        image={image}
        description={description}
        residence={residence}
        jobType={jobType}
        phone={phone}
        email={email}
        isFlexible={isFlexible}
      />
      <Services
        services={resumeData.services}
      />
      <Resume
        education={resumeData.education}
        experience={resumeData.experience}
      />
      <Skills title="Tech Skills" skills={resumeData.skills.tech as unknown as Skill[]} isCircle={true} />
      <Skills title="Tools Skills" skills={resumeData.skills.tools as unknown as Skill[]} isCircle={true} />
      <Skills title="Design Skills" skills={resumeData.skills.design as unknown as Skill[]} />
      <Skills title="Language Skills" skills={resumeData.skills.language as unknown as Skill[]} />
      <Skills title="Knowladge Skills" skills={resumeData.skills.expertise as unknown as Skill[]} isCircle={true} />
      <Projects projects={resumeData.projects as ProjectDetail[]} />
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

