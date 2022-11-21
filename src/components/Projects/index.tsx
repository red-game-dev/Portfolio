import { FC } from "react";

import tw from "twin.macro";

import { Project } from "@/components/Projects/Project";
import { Text } from "@/components/Text";
import { ProjectDetail } from "@/types/projects";
import { SectionIntros } from "@/types/sections-intros";


interface ProjectsProps {
  projects: ProjectDetail[];
  intro: SectionIntros;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

const ClearContainer = tw.div`clear-both`;

const List = tw.div`relative mx-[-50px] p-[25px] lg:p-[35px] flex flex-row flex-wrap justify-evenly`;

export const Projects: FC<ProjectsProps> = ({ projects = [], intro }: ProjectsProps) => (
    <Section id="section-projects">
      <Content>
        <Text title={intro.title} paragraphs={intro.description} isSection={false} />
        <List>
          {projects.map((project: any, index: number) => (<Project
            key={`${project.title.replace(/\s/, "")}-${index}`}
            {...project}
            withRandomBorder={index % 3 === 0}
            isFullBorder={((project.length - 1 / 2) % 1) > 0 && index === (project.length - 1)}
            isFullWidth={((project.length - 1 / 2) % 1) > 0 && index === (project.length - 1)}
          />))}
        </List>
        <ClearContainer />
      </Content>
    </Section>
  );
