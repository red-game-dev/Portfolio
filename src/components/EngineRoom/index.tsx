import { FC } from "react";

import tw from "twin.macro";

import { BlueprintSection } from "@/components/Blueprint";
import { Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import { BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { SectionIntros } from "@/types/sections-intros";

interface EngineRoomProps {
  intro: SectionIntros;
  blueprintSection: BlueprintSectionId;
}

const Body = tw.div`mt-[25px] lg:mt-[35px]`;

// Under the floor of the game world: how the games and game platforms were actually built.
export const EngineRoom: FC<EngineRoomProps> = ({ intro, blueprintSection }: EngineRoomProps) => (
  <Section id={SECTION_IDS.engineRoom}>
    <SectionText intro={intro} />
    <Body>
      <BlueprintSection section={blueprintSection} />
    </Body>
  </Section>
);
