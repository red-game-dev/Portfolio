import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { SectionText } from "@/components/Text/SectionText";
import { Recommendation } from "@/types/recommendations";
import { SectionIntros } from "@/types/sections-intros";

interface RecommendationsProps {
  intro: SectionIntros;
  recommendations: Recommendation[];
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Quotes = tw.div`grid gap-[18px] lg:grid-cols-3 mt-[25px] lg:mt-[35px]`;

const Quote = styled.figure(() => [
  tw`relative m-0 flex flex-col justify-between gap-[18px] p-[24px] bg-[#101010] border-[1px] border-solid border-[#1E1E1E]
     border-l-[var(--accent)]`,
  css`
    &::before {
      content: "\\201C";
      position: absolute;
      top: 6px;
      right: 18px;
      font-size: 64px;
      line-height: 1;
      color: var(--accent-muted);
      pointer-events: none;
    }
  `,
]);

const QuoteText = tw.blockquote`m-0 text-base text-[#eee] leading-relaxed`;

const Attribution = tw.figcaption`text-sm text-[#999]`;

const Role = tw.span`block font-medium text-[var(--accent)]`;

export const Recommendations: FC<RecommendationsProps> = ({ intro, recommendations }: RecommendationsProps) => (
  <Section id="section-Recommendations">
    <SectionText intro={intro} />
    <Quotes>
      {recommendations.map((recommendation) => (
        <Quote key={recommendation.quote}>
          <QuoteText>{recommendation.quote}</QuoteText>
          <Attribution>
            <Role>{recommendation.role}</Role>
            {recommendation.company}, {recommendation.date}
          </Attribution>
        </Quote>
      ))}
    </Quotes>
  </Section>
);
