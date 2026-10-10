import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Activity } from "@/components/CodeReview/Activity";
import { Squares } from "@/components/CodeReview/Squares";
import { Panel } from "@/components/Panel";
import { Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import { squareBullet } from "@/styles/mixins";
import { CodeReviewContent } from "@/types/code-review";
import { SectionIntros } from "@/types/sections-intros";

interface CodeReviewProps {
  intro: SectionIntros;
  content: CodeReviewContent;
}

const Scope = tw.p`m-0 mb-[20px] text-sm text-[#999] max-w-[70ch]`;

const Totals = tw.div`grid gap-[18px] md:grid-cols-2`;

// min-w-0: a grid item otherwise grows to fit the squares it holds, and the squares then measure that.
const Total = tw.div`flex flex-col gap-[10px] min-w-0 p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Label = tw.h3`m-0 text-base font-semibold text-white`;

const Highlights = tw.div`grid gap-[18px] md:grid-cols-2 items-start mt-[18px]`;

const Highlight = tw.article`flex flex-col gap-[12px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[var(--accent-muted)]`;

const Name = tw.h3`m-0 text-lg font-semibold text-white`;

const Link = styled.a(() => [
  tw`inline-flex flex-row items-center gap-[8px] self-start text-sm font-semibold text-[var(--accent)] no-underline`,
  css`
    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  `,
]);

const Muted = tw.p`m-0 text-sm text-[#aaa]`;


const Quote = styled.blockquote(() => [
  tw`m-0 pl-[12px] text-sm italic text-[#ddd]`,
  css`
    border-left: 2px solid var(--accent);
  `,
]);

const Points = tw.ul`list-none m-0 p-0 flex flex-col gap-[6px] text-sm text-[#aaa]`;

const Point = styled.li(() => [
  tw`relative pl-[14px]`,
  squareBullet({ size: 5 }),
]);

// Pull requests merged and reviewed on my main account, drawn one square each with no totals, a year by
// year activity chart, then a library my own platform depends on and everything else.
export const CodeReview: FC<CodeReviewProps> = ({ intro, content }: CodeReviewProps) => (
  <Section id={SECTION_IDS.codeReview}>
    <SectionText intro={intro} />
    <Panel>
      <Scope>{content.scope}</Scope>
      <Totals>
        {content.grids.map((grid) => (
          <Total key={grid.label}>
            <Label>{grid.label}</Label>
            <Squares count={grid.count} label={content.squaresLabel} />
          </Total>
        ))}
      </Totals>
      <Activity
        activity={content.activity}
        title={content.activityTitle}
        description={content.activityDescription}
        yearLabel={content.activityYearLabel}
        achievements={content.achievements}
      />
      <Highlights>
        {content.highlights.map((highlight) => (
          <Highlight key={highlight.name}>
            <Name>{highlight.name}</Name>
            <Muted>{highlight.detail}</Muted>
            {highlight.quote && <Quote>{highlight.quote}</Quote>}
            {highlight.points.length > 0 && (
              <Points>
                {highlight.points.map((point) => (
                  <Point key={point}>{point}</Point>
                ))}
              </Points>
            )}
            {highlight.link && (
              <Link href={highlight.link.url} target="_blank" rel="noopener noreferrer">
                {highlight.link.label}
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
              </Link>
            )}
          </Highlight>
        ))}
      </Highlights>
    </Panel>
  </Section>
);
