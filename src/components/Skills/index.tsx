import { FC } from "react";

import tw, { styled } from "twin.macro";

import { CircularProgress } from "@/components/Progress/Circular";
import { LinearProgress } from "@/components/Progress/Linear";
import { Text } from "@/components/Text";
import useCollision from "@/hooks/useCollision";
import { SectionIntros } from "@/types/sections-intros";
import { Skill } from "@/types/skills";

interface SkillsProps {
  intro: SectionIntros;
  skills: Skill[];
  isCircle?: boolean;
}

interface ListProps {
  isCircle?: boolean;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

const List = styled.ul(({ isCircle }: ListProps) => [
  tw`list-none text-sm p-0`,
  isCircle && tw`flex flex-row flex-wrap justify-evenly `
]);

export const Skills: FC<SkillsProps> = ({ intro, skills = [] as Skill[], isCircle = false }: SkillsProps) => {
  const [isVisibleElement] = useCollision(`section-skills-${intro.title.replace(/\s/, "")}`);

  return (
    <Section id={`section-skills-${intro.title.replace(/\s/, "")}`}>
      <Content>
        <Text title={intro.title} paragraphs={intro.description} isSection={false} />
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
