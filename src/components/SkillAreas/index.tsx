import { FC, useCallback } from "react";

import tw, { styled } from "twin.macro";

import { Tag } from "@/components/Controls";
import { Section } from "@/components/Section";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { hiddenPanel, Tab, TabCount, TabList } from "@/components/Tabs";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import useTabs from "@/hooks/useTabs";
import { SectionIntros } from "@/types/sections-intros";
import { SkillArea } from "@/types/skills";

interface SkillAreasProps {
  intro: SectionIntros;
  areas: SkillArea[];
}

const Content = tw.div`relative text-base ml-[-1px] p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid
border-[rgba(255, 255, 255, 0.07)]`;

// A row that scrolls sideways on a phone, a column beside the open area on a desktop.
const Layout = tw.div`mt-[22px] flex flex-col lg:flex-row gap-[16px] lg:gap-[28px]`;

const Panels = styled(SwitchStage)(() => [tw`flex-1 min-w-0`]);

const Panel = styled.section(() => [tw`min-w-0`, hiddenPanel]);

const AreaTitle = tw.h3`m-[0 0 12px 0] text-base font-semibold text-white`;

const Tags = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-2`;


// Too many areas to read as one wall of tags, so one area is open at a time. Every area stays in the page,
// the closed ones hidden, so search engines and find in page still reach them.
export const SkillAreas: FC<SkillAreasProps> = ({ intro, areas }: SkillAreasProps) => {
  const switcher = useSwitch();
  const { play } = switcher;
  const onSelect = useCallback((next: number, previous: number) => play(next > previous ? 1 : -1), [play]);
  const { active, listProps, tabProps, panelProps } = useTabs({ count: areas.length, onSelect });

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
                <AreaTitle>{area.label}</AreaTitle>
                <Tags>
                  {area.items.map((item) => <Tag isWrapping key={item}>{item}</Tag>)}
                </Tags>
              </Panel>
            ))}
          </Panels>
        </Layout>
      </Content>
    </Section>
  );
};
