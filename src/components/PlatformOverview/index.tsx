import { FC, useCallback } from "react";

import tw, { styled } from "twin.macro";

import { BlueprintSection } from "@/components/Blueprint";
import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import { Anchor, Section } from "@/components/Section";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { Tab, TabCount, TabList } from "@/components/Tabs";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import useTabs from "@/hooks/useTabs";
import { honourHidden } from "@/styles/mixins";
import { BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { ExpertiseContent } from "@/types/case-studies";
import { SectionIntros } from "@/types/sections-intros";

interface PlatformOverviewProps {
  intro: SectionIntros;
  expertise: ExpertiseContent;
  // Which drawings this section shows, fetched as it nears the screen.
  blueprintSection: BlueprintSectionId;
}

const Groups = tw.div`mt-[25px] lg:mt-[35px] mb-[25px] flex flex-col gap-[14px]`;

const Tiles = styled.ul(() => [
  tw`list-none m-0 p-0 grid gap-[14px] md:grid-cols-2 xl:grid-cols-3`,
  honourHidden,
]);

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

// Expertise across the career: each tile is a kind of system built at several companies, grouped by kind
// under tabs, and my own platform follows as one worked example, not the only one. Every group stays in
// the page, the closed ones hidden.
export const PlatformOverview: FC<PlatformOverviewProps> = ({ intro, expertise, blueprintSection }: PlatformOverviewProps) => {
  const switcher = useSwitch();
  const { play } = switcher;
  const onSelect = useCallback((next: number, previous: number) => play(next > previous ? 1 : -1), [play]);
  const { active, listProps, tabProps, panelProps } = useTabs({ count: expertise.tileGroups.length, onSelect });

  return (
  <Section id={SECTION_IDS.platform}>
    <Anchor id={ROLE_ANCHORS.enterprise} aria-hidden="true" />
    <SectionText intro={intro} />
    <Groups>
      <TabList {...listProps} aria-label={intro.title} data-scroll-x>
        {expertise.tileGroups.map((group, index) => (
          <Tab key={group.label} {...tabProps(index)} isOn={index === active}>
            {group.label}
            <TabCount isOn={index === active} aria-hidden="true">{group.tiles.length}</TabCount>
          </Tab>
        ))}
      </TabList>
      <SwitchStage switcher={switcher}>
      {expertise.tileGroups.map((group, index) => (
        <Tiles key={group.label} {...panelProps(index)}>
          {group.tiles.map((tile) => (
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
      ))}
      </SwitchStage>
    </Groups>
    <Kinds>
      <KindsTitle>{expertise.architectureKindsTitle}</KindsTitle>
      <KindList>
        {expertise.architectureKinds.map((kind) => <Kind key={kind}>{kind}</Kind>)}
      </KindList>
    </Kinds>
    <Panel>
      <PanelTitle>{expertise.exampleTitle}</PanelTitle>
      <PanelText>{expertise.exampleDescription}</PanelText>
    </Panel>
    <Example>
      <BlueprintSection section={blueprintSection} />
    </Example>
  </Section>
  );
};
