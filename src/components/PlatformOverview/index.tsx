import { FC } from "react";

import tw from "twin.macro";

import { BlueprintList } from "@/components/Blueprint";
import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { Blueprint, BlueprintLabels } from "@/types/blueprints";
import { ExpertiseContent } from "@/types/case-studies";
import { SectionIntros } from "@/types/sections-intros";

interface PlatformOverviewProps {
  intro: SectionIntros;
  expertise: ExpertiseContent;
  blueprints: Blueprint[];
  blueprintLabels: BlueprintLabels;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for the "Enterprise Architect" link on the first screen.
const Anchor = tw.span`absolute top-0 left-0`;

const Tiles = tw.ul`list-none m-0 mt-[25px] lg:mt-[35px] mb-[25px] p-0 grid gap-[14px] md:grid-cols-2 xl:grid-cols-3`;

const Tile = tw.li`flex flex-col gap-[10px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const TileName = tw.h3`m-0 text-base font-semibold text-white`;

const TileDetail = tw.p`m-0 text-sm text-[#bbb] break-words`;

const Places = tw.ul`list-none m-0 mt-auto p-0 flex flex-row flex-wrap gap-[6px]`;

const Place = tw.li`text-xs leading-none text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[6px] px-[10px] border-[1px] border-solid
border-[var(--accent-muted)]`;

const Example = tw.div`mt-[22px]`;

const Kinds = tw.section`flex flex-col gap-[10px] mb-[25px]`;

const KindsTitle = tw.h3`m-0 text-base font-semibold text-white`;

const KindList = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const Kind = tw.li`text-xs leading-none text-white bg-[#161616] rounded-[2px] py-[7px] px-[10px] border-[1px] border-solid border-[#2a2a2a]`;

// Expertise across the career: each tile is a kind of system built at several companies, and my own
// platform follows as one worked example, not the only one.
export const PlatformOverview: FC<PlatformOverviewProps> = ({ intro, expertise, blueprints, blueprintLabels }: PlatformOverviewProps) => (
  <Section id={SECTION_IDS.platform}>
    <Anchor id={ROLE_ANCHORS.enterprise} aria-hidden="true" />
    <SectionText intro={intro} />
    <Tiles>
      {expertise.tiles.map((tile) => (
        <Tile key={tile.name}>
          <TileName>{tile.name}</TileName>
          <TileDetail>{tile.detail}</TileDetail>
          <Places>
            {tile.places.map((place) => (
              <Place key={place}>{place}</Place>
            ))}
          </Places>
        </Tile>
      ))}
    </Tiles>
    <Kinds>
      <KindsTitle>{expertise.architectureKindsTitle}</KindsTitle>
      <KindList>
        {expertise.architectureKinds.map((kind) => <Kind key={kind}>{kind}</Kind>)}
      </KindList>
    </Kinds>
    <Panel>
      <PanelTitle>{expertise.exampleTitle}</PanelTitle>
      <PanelText>{expertise.exampleDescription}</PanelText>
      <Example>
        <BlueprintList blueprints={blueprints} labels={blueprintLabels} />
      </Example>
    </Panel>
  </Section>
);
