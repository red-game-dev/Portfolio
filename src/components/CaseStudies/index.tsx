import { FC } from "react";

import tw from "twin.macro";

import { BoxTile } from "@/components/BoxTile";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { CaseStudy } from "@/types/case-studies";
import { SectionIntros } from "@/types/sections-intros";

interface CaseStudiesProps {
  intro: SectionIntros;
  caseStudies: CaseStudy[];
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010]
border-[1px] border-r-[0px] border-solid border-[#1E1E1E] border-t-[transparent]`;

const List = tw.div`flex flex-wrap flex-row justify-center`;

export const CaseStudies: FC<CaseStudiesProps> = ({ intro, caseStudies }: CaseStudiesProps) => (
  <Section id={SECTION_IDS.caseStudies}>
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
    <Content>
      <List>
        {caseStudies.map((caseStudy, index) => (
          <BoxTile
            key={caseStudy.title}
            withRandomBorder={index % 3 === 0}
            isFullBorder={caseStudies.length % 2 > 0 && index === caseStudies.length - 1}
            subtitle={caseStudy.area}
            activeSubtitle={true}
            title={caseStudy.title}
            description={caseStudy.summary}
            bullets={caseStudy.points}
            tags={caseStudy.tags}
          />
        ))}
      </List>
    </Content>
  </Section>
);
