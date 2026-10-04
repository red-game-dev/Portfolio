import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { BoxTile } from "@/components/BoxTile";
import { useAudienceFromHash } from "@/components/CaseStudies/hooks/useAudienceFromHash";
import { PlatformDiagrams } from "@/components/CaseStudies/PlatformDiagrams";
import { Text } from "@/components/Text";
import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { CaseStudy, CaseStudyFilters, PlatformDiagrams as PlatformDiagramsContent } from "@/types/case-studies";
import { AudienceLink } from "@/types/headline";
import { SectionIntros } from "@/types/sections-intros";

interface CaseStudiesProps {
  intro: SectionIntros;
  caseStudies: CaseStudy[];
  diagrams: PlatformDiagramsContent;
  filters: CaseStudyFilters;
  audiences: AudienceLink[];
}

interface ChipProps {
  isSelected: boolean;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Targets for #for-payments and #for-architecture; #for-ai-engineering lives on the AI section.
const Anchor = tw.span`absolute top-0 left-0`;

const Stack = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010]
border-[1px] border-r-[0px] border-solid border-[#1E1E1E]`;

const Filters = tw.div`flex flex-row flex-wrap items-center gap-[8px] p-[20px] md:p-0 md:mb-[10px] text-sm text-[#999]`;

const Chip = styled.button(({ isSelected }: ChipProps) => [
  tw`cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full border-[1px] border-solid border-[#2f6b4d] bg-[#1d1d1d]
     text-[#4bffa5]`,
  css`
    transition: color 0.2s ease, background-color 0.2s ease;
  `,
  isSelected && tw`bg-[#4bffa5] text-[#101010]`,
]);

const List = tw.div`flex flex-wrap flex-row justify-center`;

export const CaseStudies: FC<CaseStudiesProps> = ({ intro, caseStudies, diagrams, filters, audiences }: CaseStudiesProps) => {
  const [audience, setAudience] = useAudienceFromHash();
  const visible = audience ? caseStudies.filter((caseStudy) => caseStudy.audiences.includes(audience)) : caseStudies;

  return (
    <Section id={SECTION_IDS.caseStudies}>
      <Anchor id={AUDIENCE_ANCHORS.payments} aria-hidden="true" />
      <Anchor id={AUDIENCE_ANCHORS.architecture} aria-hidden="true" />
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Stack>
        <PlatformDiagrams {...diagrams} />
        <Content>
          <Filters role="group" aria-label={filters.label}>
            <span>{filters.label}</span>
            <Chip type="button" isSelected={audience === null} aria-pressed={audience === null} onClick={() => setAudience(null)}>
              {filters.allLabel}
            </Chip>
            {audiences.map((link) => (
              <Chip
                key={link.audience}
                type="button"
                isSelected={audience === link.audience}
                aria-pressed={audience === link.audience}
                onClick={() => setAudience(link.audience)}
              >
                {link.label}
              </Chip>
            ))}
          </Filters>
          <List>
            {visible.map((caseStudy, index) => (
              <BoxTile
                key={caseStudy.title}
                withRandomBorder={index % 3 === 0}
                isFullBorder={visible.length % 2 > 0 && index === visible.length - 1}
                subtitle={caseStudy.area}
                activeSubtitle={true}
                title={caseStudy.title}
                description={caseStudy.summary}
                bullets={caseStudy.points}
                tags={caseStudy.tags}
              />
            ))}
          </List>
        </Content>
      </Stack>
    </Section>
  );
};
