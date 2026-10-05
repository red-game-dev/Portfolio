import { FC } from "react";

import tw from "twin.macro";

import { PlatformDiagrams } from "@/components/PlatformOverview/PlatformDiagrams";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { PlatformDiagrams as PlatformDiagramsContent } from "@/types/case-studies";
import { SectionIntros } from "@/types/sections-intros";

interface PlatformOverviewProps {
  intro: SectionIntros;
  diagrams: PlatformDiagramsContent;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Body = tw.div`mt-[25px] lg:mt-[35px]`;

// How the platform is put together, in the chain zone beside the money paths it runs.
export const PlatformOverview: FC<PlatformOverviewProps> = ({ intro, diagrams }: PlatformOverviewProps) => (
  <Section id={SECTION_IDS.platform}>
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
    <Body>
      <PlatformDiagrams {...diagrams} />
    </Body>
  </Section>
);
