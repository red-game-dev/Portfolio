import { FC, useMemo } from "react";

import tw, { css, styled } from "twin.macro";

import { BossCard } from "@/components/CaseStudies/BossCard";
import { useAudienceFromHash } from "@/components/CaseStudies/hooks/useAudienceFromHash";
import { Text } from "@/components/Text";
import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import useIndustryFromHash from "@/hooks/useIndustryFromHash";
import { CaseStudy, CaseStudyDomain, CaseStudyFilters } from "@/types/case-studies";
import { BossLabels } from "@/types/game";
import { AudienceLink, IndustryLink } from "@/types/headline";
import { SectionIntros } from "@/types/sections-intros";

interface CaseStudiesProps {
  intro: SectionIntros;
  caseStudies: CaseStudy[];
  filters: CaseStudyFilters;
  audiences: AudienceLink[];
  industries: IndustryLink[];
  labels: BossLabels;
}

interface ChipProps {
  isSelected: boolean;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Targets for #for-payments and #for-architecture; #for-ai-engineering lives on the AI section.
const Anchor = tw.span`absolute top-0 left-0`;

const Filters = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[25px] lg:mt-[35px] text-sm text-[#999]`;

const Chip = styled.button(({ isSelected }: ChipProps) => [
  tw`cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full border-[1px] border-solid border-[var(--accent-muted)] bg-[#1d1d1d]
     text-[var(--accent)]`,
  css`
    transition: color 0.2s ease, background-color 0.2s ease;
  `,
  isSelected && tw`bg-[var(--accent)] text-[#101010]`,
]);

const DOMAIN_ORDER: CaseStudyDomain[] = ["architecture", "payments", "web3", "igaming", "games", "mobile", "security", "ai"];

const Group = tw.section`mt-[30px]`;

const GroupTitle = styled.h3(() => [
  tw`flex flex-row items-center gap-[10px] m-0 mb-[14px] text-lg font-semibold text-white`,
  css`
    &::before {
      content: "";
      width: 4px;
      height: 18px;
      background: var(--accent);
    }
  `,
]);

const Bosses = tw.div`grid gap-[18px] lg:grid-cols-2`;

// Case studies as PvE: each problem is a boss, beaten on screen as you read it.
export const CaseStudies: FC<CaseStudiesProps> = ({ intro, caseStudies, filters, audiences, industries, labels }: CaseStudiesProps) => {
  const [audience, setAudience] = useAudienceFromHash();
  const industryKeys = useMemo(() => industries.map((link) => link.industry), [industries]);
  const [industry] = useIndustryFromHash(industryKeys);
  const forAudience = audience ? caseStudies.filter((caseStudy) => caseStudy.audiences.includes(audience)) : caseStudies;
  const forIndustry = industry ? forAudience.filter((caseStudy) => caseStudy.industries?.includes(industry)) : forAudience;
  // An industry with no boss fights tagged leaves the list as it was rather than empty.
  const visible = forIndustry.length > 0 ? forIndustry : forAudience;

  return (
    <Section id={SECTION_IDS.caseStudies}>
      <Anchor id={AUDIENCE_ANCHORS.payments} aria-hidden="true" />
      <Anchor id={AUDIENCE_ANCHORS.architecture} aria-hidden="true" />
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
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
      {DOMAIN_ORDER.map((domain) => {
        const group = visible.filter((caseStudy) => caseStudy.domain === domain);

        return group.length > 0 && (
          <Group key={domain} aria-label={filters.domains[domain]}>
            <GroupTitle>{filters.domains[domain]}</GroupTitle>
            <Bosses>
              {group.map((caseStudy) => (
                <BossCard key={caseStudy.title} {...caseStudy} labels={labels} />
              ))}
            </Bosses>
          </Group>
        );
      })}
    </Section>
  );
};
