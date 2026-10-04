import { FC } from "react";

import tw from "twin.macro";

import { TagGroups } from "@/components/TagGroups";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { SectionIntros } from "@/types/sections-intros";
import { SkillArea } from "@/types/skills";

interface SkillAreasProps {
  intro: SectionIntros;
  areas: SkillArea[];
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid
border-[rgba(255, 255, 255, 0.07)]`;

export const SkillAreas: FC<SkillAreasProps> = ({ intro, areas }: SkillAreasProps) => (
  <Section id={SECTION_IDS.skillAreas}>
    <Content>
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <TagGroups groups={areas} headingLevel="h3" columns={2} />
    </Content>
  </Section>
);
