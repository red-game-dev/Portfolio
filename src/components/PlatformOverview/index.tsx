import { FC } from "react";

import tw from "twin.macro";

import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import { PlatformDiagrams } from "@/components/PlatformOverview/PlatformDiagrams";
import { Text } from "@/components/Text";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { ExpertiseContent, PlatformDiagrams as PlatformDiagramsContent } from "@/types/case-studies";
import { SectionIntros } from "@/types/sections-intros";

interface PlatformOverviewProps {
  intro: SectionIntros;
  expertise: ExpertiseContent;
  diagrams: PlatformDiagramsContent;
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

// Expertise across the career: each tile is a kind of system built at several companies, and my own
// platform follows as one worked example, not the only one.
export const PlatformOverview: FC<PlatformOverviewProps> = ({ intro, expertise, diagrams }: PlatformOverviewProps) => (
  <Section id={SECTION_IDS.platform}>
    <Anchor id={ROLE_ANCHORS.enterprise} aria-hidden="true" />
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
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
    <Panel>
      <PanelTitle>{expertise.exampleTitle}</PanelTitle>
      <PanelText>{expertise.exampleDescription}</PanelText>
      <Example>
        <PlatformDiagrams {...diagrams} />
      </Example>
    </Panel>
  </Section>
);
