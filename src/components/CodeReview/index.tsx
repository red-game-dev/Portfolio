import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { Squares } from "@/components/CodeReview/Squares";
import { Panel } from "@/components/Panel";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { CodeReviewContent, CodeReviewCount } from "@/types/code-review";
import { SectionIntros } from "@/types/sections-intros";

interface CodeReviewProps {
  intro: SectionIntros;
  content: CodeReviewContent;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Scope = tw.p`m-0 mb-[20px] text-sm text-[#999] max-w-[70ch]`;

const Totals = tw.div`grid gap-[18px] md:grid-cols-2`;

const Total = tw.div`flex flex-col gap-[10px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Figure = tw.p`m-0 flex flex-row flex-wrap items-baseline gap-x-[10px] gap-y-[2px]`;

const Value = tw.span`text-3xl font-bold leading-none text-white`;

const Label = tw.span`text-sm text-[#ccc]`;

const Detail = tw.span`text-xs text-[#999]`;

const Highlights = tw.div`grid gap-[18px] md:grid-cols-2 items-start mt-[18px]`;

const Highlight = tw.article`flex flex-col gap-[12px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[var(--accent-muted)]`;

const Name = tw.h3`m-0 text-lg font-semibold text-white`;

const Muted = tw.p`m-0 text-sm text-[#aaa]`;

const Counts = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[8px]`;

const Count = tw.li`text-xs leading-none text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[7px] px-[11px] border-[1px] border-solid
border-[var(--accent-muted)]`;

const Quote = styled.blockquote(() => [
  tw`m-0 pl-[12px] text-sm italic text-[#ddd]`,
  css`
    border-left: 2px solid var(--accent);
  `,
]);

const Points = tw.ul`list-none m-0 p-0 flex flex-col gap-[6px] text-sm text-[#aaa]`;

const Point = styled.li(() => [
  tw`relative pl-[14px]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.6em;
      width: 5px;
      height: 5px;
      background: var(--accent);
    }
  `,
]);

const countText = ({ value, label }: CodeReviewCount) => `${value.toLocaleString("en-GB")} ${label}`;

// Pull requests merged and reviewed on my main account, drawn one square each, then the two places the
// reviewing matters most: an open source launcher and a library my own platform depends on.
export const CodeReview: FC<CodeReviewProps> = ({ intro, content }: CodeReviewProps) => (
  <Section id={SECTION_IDS.codeReview}>
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
    <Panel>
      <Scope>{content.scope}</Scope>
      <Totals>
        {content.totals.map((total) => (
          <Total key={total.label}>
            <Figure>
              <Value>{total.value.toLocaleString("en-GB")}</Value>
              <Label>{total.label}</Label>
              {total.detail && <Detail>{total.detail}</Detail>}
            </Figure>
            <Squares count={total.value} label={content.squaresLabel.replace("{count}", String(total.value))} />
          </Total>
        ))}
      </Totals>
      <Highlights>
        {content.highlights.map((highlight) => (
          <Highlight key={highlight.name}>
            <Name>{highlight.name}</Name>
            <Muted>{highlight.detail}</Muted>
            <Counts>
              {highlight.counts.map((count) => (
                <Count key={count.label}>{countText(count)}</Count>
              ))}
            </Counts>
            {highlight.quote && <Quote>{highlight.quote}</Quote>}
            {highlight.points.length > 0 && (
              <Points>
                {highlight.points.map((point) => (
                  <Point key={point}>{point}</Point>
                ))}
              </Points>
            )}
          </Highlight>
        ))}
      </Highlights>
    </Panel>
  </Section>
);
