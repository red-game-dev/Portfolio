import { FC, useCallback } from "react";

import tw, { css, styled } from "twin.macro";

import { Anchor, Section } from "@/components/Section";
import { Station } from "@/components/SkillForge/Station";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { Tab, TabCount, TabList } from "@/components/Tabs";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import useTabs from "@/hooks/useTabs";
import { DEFAULT_RARITY_TIERS } from "@/packages/insights/skills";
import { ForgeStation } from "@/services/skills";
import { honourHidden } from "@/styles/mixins";
import { ForgeContent } from "@/types/forge";
import { SectionIntros } from "@/types/sections-intros";

interface SkillForgeProps {
  intro: SectionIntros;
  stations: ForgeStation[];
  content: ForgeContent;
}

const RARITY_COLOURS = { legendary: "#ffc45c", epic: "#b388ff", rare: "#5aa9ff", common: "#9aa0a6" };

const Legend = tw.ul`list-none m-0 mt-[20px] p-0 flex flex-row flex-wrap gap-[10px] text-xs`;

const LegendItem = styled.li(({ colour }: { colour: string }) => [
  tw`inline-flex flex-row items-center gap-[6px] py-[6px] px-[10px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    color: ${colour};

    &::before {
      content: "";
      width: 8px;
      height: 8px;
      background: ${colour};
    }
  `,
]);

// A row that scrolls sideways on a phone, a column beside the open station on a desktop.
const Layout = tw.div`mt-[25px] lg:mt-[35px] flex flex-col lg:flex-row gap-[16px] lg:gap-[28px]`;

const Stations = styled(SwitchStage)`
  ${tw`flex-1 min-w-0`}
`;

const StationPanel = styled.div`
  ${tw`min-w-0`}
  ${honourHidden}
`;

// The skills as a forge: no self ratings, only rarity earned from years of real use. One station is open at
// a time, so the forge reads in a screen or two rather than fourteen; every station stays in the page, the
// closed ones hidden, so search engines and find in page still reach every skill.
export const SkillForge: FC<SkillForgeProps> = ({ intro, stations, content }: SkillForgeProps) => {
  const switcher = useSwitch();
  const { play } = switcher;
  const onSelect = useCallback((next: number, previous: number) => play(next > previous ? 1 : -1), [play]);
  const { active, listProps, tabProps, panelProps } = useTabs({ count: stations.length, onSelect });

  return (
  <Section id={SECTION_IDS.forge}>
    <Anchor id={ROLE_ANCHORS.fullStack} aria-hidden="true" />
    <SectionText intro={intro} />
    <Legend aria-label={content.legendYears}>
      {DEFAULT_RARITY_TIERS.map((tier) => (
        <LegendItem key={tier.rarity} colour={RARITY_COLOURS[tier.rarity]}>
          {`${content.rarity[tier.rarity]} ${tier.minYears > 0 ? `${tier.minYears}+ yrs` : content.untracked}`}
        </LegendItem>
      ))}
    </Legend>
    <Layout>
      <TabList {...listProps} layout="column" aria-label={intro.title} data-scroll-x>
        {stations.map((station, index) => (
          <Tab key={station.id} {...tabProps(index)} isOn={index === active}>
            <span>{station.title}</span>
            <TabCount isOn={index === active} aria-hidden="true">{station.items.length}</TabCount>
          </Tab>
        ))}
      </TabList>
      <Stations switcher={switcher}>
        {stations.map((station, index) => (
          <StationPanel key={station.id} {...panelProps(index)}>
            <Station {...station} content={content} />
          </StationPanel>
        ))}
      </Stations>
    </Layout>
  </Section>
  );
};
