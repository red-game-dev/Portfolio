import { FC } from "react";

import tw, { styled } from "twin.macro";

import { CircularProgress } from "@/components/Progress/Circular";
import { LinearProgress } from "@/components/Progress/Linear";
import useCollision from "@/hooks/useCollision";
import { Skill } from "types/skills";

interface SkillsProps {
  title: string;
  skills: Skill[];
  isCircle?: boolean;
}

interface ListProps {
  isCircle?: boolean;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

const Title = tw.div`relative m-[0 0 30px 0] lg:m-[0 0 35px 0] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const List = styled.ul(({ isCircle }: ListProps) => [
  tw`list-none text-sm p-0`,
  isCircle && tw`flex flex-row flex-wrap justify-evenly `
]);

export const Skills: FC<SkillsProps> = ({ title, skills = [] as Skill[], isCircle = false }: SkillsProps) => {
  const [isVisibleElement] = useCollision(`section-skills-${title.replace(/\s/, "")}`);

  return (
    <Section id={`section-skills-${title.replace(/\s/, "")}`}>
      <Content>
        <Title>{ title }</Title>
        <List isCircle={isCircle}>
            {skills.map((skill: any, index: number) => (
              isCircle
                ? <CircularProgress key={`${skill.name.replace(/\s/, "")}-${index}`}
                    canAnimate={isVisibleElement}
                    title={skill.name}
                    score={skill.score}
                    size={40} />
                : <LinearProgress key={`${skill.name.replace(/\s/, "")}-${index}`}
                    canAnimate={isVisibleElement}
                    title={skill.name}
                    score={skill.score}
                    size={40} />
            ))}
        </List>
      </Content>
    </Section>
  );
};
