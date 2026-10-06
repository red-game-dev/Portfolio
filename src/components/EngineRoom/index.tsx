import { FC } from "react";

import tw from "twin.macro";

import { BlueprintList } from "@/components/Blueprint";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { Blueprint, BlueprintLabels } from "@/types/blueprints";
import { SectionIntros } from "@/types/sections-intros";

interface EngineRoomProps {
  intro: SectionIntros;
  blueprints: Blueprint[];
  labels: BlueprintLabels;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Body = tw.div`mt-[25px] lg:mt-[35px]`;

// Under the floor of the game world: how the games and game platforms were actually built.
export const EngineRoom: FC<EngineRoomProps> = ({ intro, blueprints, labels }: EngineRoomProps) => (
  <Section id={SECTION_IDS.engineRoom}>
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
    <Body>
      <BlueprintList blueprints={blueprints} labels={labels} />
    </Body>
  </Section>
);
