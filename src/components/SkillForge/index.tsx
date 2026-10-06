import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { Station } from "@/components/SkillForge/Station";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS } from "@/config/sections";
import { DEFAULT_RARITY_TIERS } from "@/packages/insights/skills";
import { ForgeStation } from "@/services/skills";
import { ForgeContent } from "@/types/forge";
import { SectionIntros } from "@/types/sections-intros";

interface SkillForgeProps {
  intro: SectionIntros;
  stations: ForgeStation[];
  content: ForgeContent;
}

const RARITY_COLOURS = { legendary: "#ffc45c", epic: "#b388ff", rare: "#5aa9ff", common: "#9aa0a6" };

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for the "Full stack" link on the first screen.
const Anchor = tw.span`absolute top-0 left-0`;

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

const Stations = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

// The skills as a forge: no self ratings, only rarity earned from years of real use.
export const SkillForge: FC<SkillForgeProps> = ({ intro, stations, content }: SkillForgeProps) => (
  <Section id="section-skills">
    <Anchor id={ROLE_ANCHORS.fullStack} aria-hidden="true" />
    <SectionText intro={intro} />
    <Legend aria-label={content.legendYears}>
      {DEFAULT_RARITY_TIERS.map((tier) => (
        <LegendItem key={tier.rarity} colour={RARITY_COLOURS[tier.rarity]}>
          {`${content.rarity[tier.rarity]} ${tier.minYears > 0 ? `${tier.minYears}+ yrs` : content.untracked}`}
        </LegendItem>
      ))}
    </Legend>
    <Stations>
      {stations.map((station) => (
        <Station key={station.id} {...station} content={content} />
      ))}
    </Stations>
  </Section>
);
