import { FC } from "react";

import tw from "twin.macro";

import { Project } from "@/components/Projects/Project";

interface ProjectsProps {
  projects: Project[];
}

interface Project {
  image: string;
  title: string;
  category: string;
  intro: string;
  list: string[];
  techStack: string;
  link: string;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

const Title = tw.div`relative m-[0 0 30px 0] lg:m-[0 0 35px 0] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const ClearContainer = tw.div`clear-both`;

const List = tw.div`relative mx-[-50px] flex flex-row flex-wrap justify-evenly`;

export const Projects: FC<ProjectsProps> = ({ projects = [] }: ProjectsProps) => (
    <Section id="section-portfolio">
      <Content>
        <Title>Projects</Title>
        <List>
          {projects.map((project: any, index: number) => (<Project key={index} {...project} />))}
        </List>
        <ClearContainer />
      </Content>
    </Section>
  );
