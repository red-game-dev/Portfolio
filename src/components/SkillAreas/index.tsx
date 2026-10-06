import { FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import useTabs from "@/hooks/useTabs";
import { SectionIntros } from "@/types/sections-intros";
import { SkillArea } from "@/types/skills";

interface SkillAreasProps {
  intro: SectionIntros;
  areas: SkillArea[];
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid
border-[rgba(255, 255, 255, 0.07)]`;

// A row that scrolls sideways on a phone, a column beside the open area on a desktop.
const Layout = tw.div`mt-[22px] flex flex-col lg:flex-row gap-[16px] lg:gap-[28px]`;

const TabList = styled.div(() => [
  tw`flex flex-row lg:flex-col gap-[6px] overflow-x-auto lg:overflow-visible pb-[4px] lg:pb-0 lg:w-[240px] flex-shrink-0`,
  css`
    scrollbar-width: thin;
  `,
]);

const Tab = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`flex flex-row items-center justify-between gap-[12px] flex-shrink-0 min-h-[36px] px-[12px] py-[7px] cursor-pointer text-left
     text-xs md:text-sm font-semibold whitespace-nowrap lg:whitespace-normal rounded-[2px] border-[1px] border-solid`,
  isOn ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[#ccc] bg-[#0d0d0d] border-[#262626]`,
  css`
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--accent);
      color: ${isOn ? "#101010" : "#fff"};
    }
  `,
]);

const Count = styled.span(({ isOn }: { isOn: boolean }) => [
  tw`text-[11px] font-medium`,
  isOn ? tw`text-[#101010]` : tw`text-[#777]`,
]);

const reveal = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

const Panel = styled.section(() => [
  tw`flex-1 min-w-0`,
  css`
    &[hidden] {
      display: none;
    }

    &:not([hidden]) {
      animation: ${reveal} 0.25s ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      &:not([hidden]) {
        animation: none;
      }
    }
  `,
]);

const AreaTitle = tw.h3`m-[0 0 12px 0] text-base font-semibold text-white`;

const Tags = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-2`;

const Tag = tw.li`text-xs leading-snug text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[7px] px-[11px]
border-[1px] border-solid border-[var(--accent-muted)]`;

// Too many areas to read as one wall of tags, so one area is open at a time. Every area stays in the page,
// the closed ones hidden, so search engines and find in page still reach them.
export const SkillAreas: FC<SkillAreasProps> = ({ intro, areas }: SkillAreasProps) => {
  const { active, listProps, tabProps, panelProps } = useTabs({ count: areas.length });

  return (
    <Section id={SECTION_IDS.skillAreas}>
      <Content>
        <SectionText intro={intro} />
        <Layout>
          <TabList {...listProps} aria-label={intro.title}>
            {areas.map((area, index) => (
              <Tab key={area.label} {...tabProps(index)} isOn={index === active}>
                <span>{area.label}</span>
                <Count isOn={index === active} aria-hidden="true">{area.items.length}</Count>
              </Tab>
            ))}
          </TabList>
          {areas.map((area, index) => (
            <Panel key={area.label} {...panelProps(index)}>
              <AreaTitle>{area.label}</AreaTitle>
              <Tags>
                {area.items.map((item) => <Tag key={item}>{item}</Tag>)}
              </Tags>
            </Panel>
          ))}
        </Layout>
      </Content>
    </Section>
  );
};
