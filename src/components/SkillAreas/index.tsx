import { CSSProperties, FC, useCallback, useLayoutEffect, useRef } from "react";

import tw, { styled } from "twin.macro";

import { BlueprintSection } from "@/components/Blueprint";
import { Tag } from "@/components/Controls";
import { Panel as Intro, PanelText, PanelTitle } from "@/components/Panel";
import { Section } from "@/components/Section";
import { aimBurst } from "@/components/SkillAreas/burst";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { AREA_EFFECTS } from "@/components/SwitchStage/config";
import { Tab, TabCount, TabList } from "@/components/Tabs";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import useTabs from "@/hooks/useTabs";
import { honourHidden } from "@/styles/mixins";
import { BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { SectionIntros } from "@/types/sections-intros";
import { SkillArea, SkillAreaExamples } from "@/types/skills";

interface SkillAreasProps {
  intro: SectionIntros;
  areas: SkillArea[];
  examples: SkillAreaExamples;
  // Which drawings follow the areas, fetched as they near the screen.
  blueprintSection: BlueprintSectionId;
}

const Content = tw.div`relative text-base ml-[-1px] p-[18px] md:p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid
border-[rgba(255, 255, 255, 0.07)]`;

// A row that scrolls sideways on a phone, a column beside the open area on a desktop.
const Layout = tw.div`mt-[22px] flex flex-col lg:flex-row gap-[16px] lg:gap-[28px]`;

const Panels = styled(SwitchStage)(() => [tw`flex-1 min-w-0`]);

const Panel = styled.section(() => [tw`min-w-0`, honourHidden]);

const AreaTitle = tw.h3`m-[0 0 12px 0] text-base font-semibold text-white`;

const Tags = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-2`;

const Examples = tw.div`mt-[25px]`;

// Lined up with the areas' frame above it.
const ExamplesIntro = styled(Intro)(() => [tw`ml-[-1px] border-r-[0px]`]);

const Drawings = tw.div`mt-[22px]`;

// An item's place in the area, for a switch that brings them in one after another, and a scattered place (a stride
// coprime with the count) for one that brings them in at random, the same way every time.
const placeOf = (index: number, count: number) => ({ "--i": index, "--s": (index * 7) % Math.max(count, 1) } as CSSProperties);

// Too many areas to read as one wall of tags, so one area is open at a time. Every area stays in the page,
// the closed ones hidden, so search engines and find in page still reach them. The drawings after them show
// several areas at work together in one platform.
export const SkillAreas: FC<SkillAreasProps> = ({ intro, areas, examples, blueprintSection }: SkillAreasProps) => {
  const switcher = useSwitch();
  const { play } = switcher;
  const direction = useRef<1 | -1>(1);
  // Each area opens in the way of the universe it belongs to on the journey.
  const onSelect = useCallback((next: number, previous: number) => {
    direction.current = next > previous ? 1 : -1;
    play(direction.current, undefined, AREA_EFFECTS[areas[next].universe]);
  }, [play, areas]);
  const { active, listProps, tabProps, panelProps } = useTabs({ count: areas.length, onSelect });
  const tabId = tabProps(active).id;
  const panelId = panelProps(active).id;
  const hasSwitched = useRef(false);

  // Before paint on every switch (not the first render, which plays nothing): measure the opening area's skills for
  // its switch, where each stands from the tab picked and across the panel.
  useLayoutEffect(() => {
    const tab = document.getElementById(tabId);
    const panel = document.getElementById(panelId);

    if (hasSwitched.current && tab && panel) {
      aimBurst(tab, panel, direction.current);
    }

    hasSwitched.current = true;
  }, [tabId, panelId]);

  return (
    <Section id={SECTION_IDS.skillAreas}>
      <Content>
        <SectionText intro={intro} />
        <Layout>
          <TabList {...listProps} layout="column" aria-label={intro.title} data-scroll-x>
            {areas.map((area, index) => (
              <Tab key={area.label} {...tabProps(index)} isOn={index === active}>
                <span>{area.label}</span>
                <TabCount isOn={index === active} aria-hidden="true">{area.items.length}</TabCount>
              </Tab>
            ))}
          </TabList>
          <Panels switcher={switcher}>
            {areas.map((area, index) => (
              <Panel key={area.label} {...panelProps(index)}>
                <AreaTitle data-switch-item style={placeOf(0, area.items.length + 1)}>{area.label}</AreaTitle>
                <Tags>
                  {area.items.map((item, place) => (
                    <Tag isWrapping key={item} data-switch-item style={placeOf(place + 1, area.items.length + 1)}>{item}</Tag>
                  ))}
                </Tags>
              </Panel>
            ))}
          </Panels>
        </Layout>
      </Content>
      <Examples>
        <ExamplesIntro>
          <PanelTitle>{examples.title}</PanelTitle>
          <PanelText>{examples.description}</PanelText>
        </ExamplesIntro>
        <Drawings>
          <BlueprintSection section={blueprintSection} />
        </Drawings>
      </Examples>
    </Section>
  );
};
