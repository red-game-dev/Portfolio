import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { Panel, PanelTitle } from "@/components/Panel";
import { Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { media } from "@/styles/mixins";
import { TalentsContent } from "@/types/forge";
import { SectionIntros } from "@/types/sections-intros";

interface TalentsProps {
  intro: SectionIntros;
  talents: string[];
  content: TalentsContent;
}

const Panels = tw.div`grid gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px] lg:grid-cols-[2fr 1fr]`;

// Passive talents, as in an MMO talent tree: always on, no numbers. They light up in turn when seen.
const Tree = styled.ul(({ isActive }: { isActive: boolean }) => [
  tw`list-none m-0 p-0 grid gap-[10px] grid-cols-1 md:grid-cols-2`,
  css`
    & > li {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      font-size: 14px;
      color: #eee;
      background: #0d0d0d;
      border: 1px solid #1e1e1e;
      transition: border-color 0.4s ease, box-shadow 0.4s ease;
      transition-delay: inherit;
    }

    & > li::before {
      content: "";
      flex-shrink: 0;
      width: 18px;
      height: 20px;
      clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
      background: ${isActive ? "var(--accent)" : "var(--accent-muted)"};
      transition: background 0.4s ease;
      transition-delay: inherit;
    }

    & > li:hover {
      border-color: var(--accent-muted);
    }

    ${media.reducedMotion} {
      & > li,
      & > li::before {
        transition: none;
      }
    }
  `,
]);

const Languages = tw.ul`list-none m-0 p-0 flex flex-col gap-[10px]`;

const Language = tw.li`flex flex-row justify-between gap-[10px] py-[10px] px-[12px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E] text-sm text-[#eee]`;

const Level = tw.span`font-semibold text-[var(--accent)]`;

export const Talents: FC<TalentsProps> = ({ intro, talents, content }: TalentsProps) => {
  const treeRef = useRef<HTMLUListElement>(null);
  const isActive = useInView(treeRef, { threshold: 0.2 });

  return (
    <Section id={SECTION_IDS.talents}>
      <SectionText intro={intro} />
      <Panels>
        <Panel>
          <PanelTitle>{content.talentsLabel}</PanelTitle>
          <Tree ref={treeRef} isActive={isActive}>
            {talents.map((talent, index) => (
              <li key={talent} style={{ transitionDelay: `${index * 80}ms` }}>{talent}</li>
            ))}
          </Tree>
        </Panel>
        <Panel>
          <PanelTitle>{content.languagesLabel}</PanelTitle>
          <Languages>
            {content.languages.map((language) => (
              <Language key={language.name}>
                {language.name}
                <Level>{language.level}</Level>
              </Language>
            ))}
          </Languages>
        </Panel>
      </Panels>
    </Section>
  );
};
