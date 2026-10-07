import { CSSProperties, FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import useInView from "@/hooks/useInView";
import { AiUsageBudget } from "@/packages/insights/ai-usage";
import { collapseWhitespace, fill } from "@/packages/text/format";

interface RevealProps {
  isRevealed: boolean;
}

// One hue, stepped by tier size, so the bar reads as one budget split four ways rather than four series.
const TIER_STRENGTHS = [1, 0.62, 0.42, 0.28];

const Figures = tw.dl`m-0 mt-[22px] grid gap-[10px] md:grid-cols-3`;

const Figure = tw.div`flex flex-col gap-[6px] p-[14px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const FigureValue = tw.dd`m-0 order-first text-3xl font-bold leading-none text-[var(--accent)]`;

const FigureLabel = tw.dt`text-sm text-[#bbb]`;

const TiersTitle = tw.h4`m-0 mt-[26px] mb-[10px] text-sm font-medium text-[#ccc]`;

const Bar = tw.div`flex flex-row gap-[2px] h-[14px] w-full`;

const Segment = styled.span(({ isRevealed }: RevealProps) => [
  tw`block h-full first:rounded-l-[2px] last:rounded-r-[2px]`,
  css`
    background: rgba(var(--accent-rgb), var(--strength));
    transform-origin: left center;
    transform: scaleX(${isRevealed ? 1 : 0});
    transition: transform 0.9s cubic-bezier(0.165, 0.85, 0.45, 1);

    @media (prefers-reduced-motion: reduce) {
      transform: none;
      transition: none;
    }
  `,
]);

const Legend = tw.ul`list-none m-0 mt-[12px] p-0 grid gap-[8px] md:grid-cols-2 text-sm`;

const LegendItem = tw.li`flex flex-row items-start gap-[10px]`;

const Swatch = styled.span(() => [
  tw`flex-shrink-0 mt-[4px] w-[12px] h-[12px] rounded-[2px]`,
  css`
    background: rgba(var(--accent-rgb), var(--strength));
  `,
]);

const LegendText = tw.span`flex flex-col text-[#ddd] [& > small]:text-xs [& > small]:text-[#999]`;

const PracticesTitle = tw.h4`m-0 mt-[26px] mb-[10px] text-sm font-medium text-[#ccc]`;

const Practices = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px] text-sm text-[#bbb]`;

const Practice = styled.li(() => [
  tw`relative pl-[16px] break-words`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.6em;
      width: 6px;
      height: 6px;
      background: var(--accent);
    }
  `,
]);

const Notes = tw.ul`list-none m-0 mt-[22px] p-0 flex flex-col gap-[6px] text-sm text-[#888]`;

const strength = (index: number) => ({ "--strength": TIER_STRENGTHS[index] ?? TIER_STRENGTHS[TIER_STRENGTHS.length - 1] }) as CSSProperties;

// Token spend as a budget: the measured cache rate and volume, the model mix by output, and the habits
// that keep both where they are.
export const TokenBudget: FC<AiUsageBudget> = ({
  title, description, figures, tiersTitle, shareLabel, tiers, practicesTitle, practices, notes,
}: AiUsageBudget) => {
  const barRef = useRef<HTMLDivElement>(null);
  const isRevealed = useInView(barRef, { threshold: 0.5 });

  return (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      {description.map((paragraph) => (
        <PanelText key={paragraph}>{collapseWhitespace(paragraph)}</PanelText>
      ))}
      <Figures>
        {figures.map((figure) => (
          <Figure key={figure.label}>
            <FigureLabel>{figure.label}</FigureLabel>
            <FigureValue>{figure.value}</FigureValue>
          </Figure>
        ))}
      </Figures>
      <TiersTitle>{tiersTitle}</TiersTitle>
      <Bar ref={barRef} aria-hidden="true">
        {tiers.map((tier, index) => (
          <Segment key={tier.name} isRevealed={isRevealed} style={{ ...strength(index), width: `${tier.share}%` }} />
        ))}
      </Bar>
      <Legend>
        {tiers.map((tier, index) => (
          <LegendItem key={tier.name}>
            <Swatch style={strength(index)} aria-hidden="true" />
            <LegendText>
              {fill(shareLabel, { name: tier.name, share: tier.share })}
              {tier.detail && <small>{tier.detail}</small>}
            </LegendText>
          </LegendItem>
        ))}
      </Legend>
      <PracticesTitle>{practicesTitle}</PracticesTitle>
      <Practices>
        {practices.map((practice) => (
          <Practice key={practice}>{practice}</Practice>
        ))}
      </Practices>
      <Notes>
        {notes.map((note) => (
          <li key={note}>{collapseWhitespace(note)}</li>
        ))}
      </Notes>
    </Panel>
  );
};
