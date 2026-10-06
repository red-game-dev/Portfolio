import { FC } from "react";

import tw from "twin.macro";

import { BlueprintSection } from "@/components/Blueprint";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import { BlueprintLabels, BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { SectionIntros } from "@/types/sections-intros";

interface EngineRoomProps {
  intro: SectionIntros;
  blueprintSection: BlueprintSectionId;
  labels: BlueprintLabels;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Body = tw.div`mt-[25px] lg:mt-[35px]`;

// Under the floor of the game world: how the games and game platforms were actually built.
export const EngineRoom: FC<EngineRoomProps> = ({ intro, blueprintSection, labels }: EngineRoomProps) => (
  <Section id={SECTION_IDS.engineRoom}>
    <SectionText intro={intro} />
    <Body>
      <BlueprintSection section={blueprintSection} labels={labels} />
    </Body>
  </Section>
);
