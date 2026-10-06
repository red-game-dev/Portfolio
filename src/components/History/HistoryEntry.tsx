import { FC, useId, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { DecodedText } from "@/components/DecodedText";
import { HISTORY_VIEW } from "@/components/History/config";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import useInView from "@/hooks/useInView";
import { HistoryLabels } from "@/types/history";
import { Resume } from "@/types/resume";

interface HistoryEntryProps extends Resume {
  labels: HistoryLabels;
  // Single lane for education, two lanes for experience.
  hasVentureLane: boolean;
  // Outside the selected industry: kept in place so the graph stays whole, but faded back.
  isDimmed?: boolean;
}

interface NodeProps {
  isVenture: boolean;
  isReached: boolean;
  isCurrent: boolean;
  hasVentureLane: boolean;
}

interface CurrentProps {
  isCurrent: boolean;
}

const Row = styled.li(({ hasVentureLane, isDimmed }: { hasVentureLane: boolean; isDimmed: boolean }) => [
  tw`relative list-none`,
  hasVentureLane ? tw`pl-[52px] md:pl-[74px]` : tw`pl-[36px] md:pl-[44px]`,
  css`
    transition: opacity 0.3s ease;
  `,
  isDimmed && tw`opacity-30`,
]);

// A commit on its lane. Ventures sit on the second lane, as their own branch.
const Node = styled.span(({ isVenture, isReached, isCurrent, hasVentureLane }: NodeProps) => [
  tw`absolute top-[22px] w-[13px] h-[13px] rounded-full bg-[#101010] border-[2px] border-solid border-[var(--accent-muted)]`,
  css`
    left: ${isVenture && hasVentureLane ? "calc(var(--lane-venture) - 6px)" : "calc(var(--lane-main) - 6px)"};
    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  isReached && css`
    background: ${isVenture ? "#ffc45c" : "var(--accent)"};
    border-color: ${isVenture ? "#ffc45c" : "var(--accent)"};
    box-shadow: 0 0 10px ${isVenture ? "rgba(255, 196, 92, 0.6)" : "rgba(var(--accent-rgb), 0.6)"};
  `,
  isCurrent && css`
    &::after {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 9999px;
      border: 1px solid ${isVenture ? "#ffc45c" : "var(--accent)"};
      animation: live-ring 1.8s ease-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        animation: none;
      }
    }
  `,
]);

// A short branch line from a venture back to the main lane, like a merge in a git graph.
const Branch = styled.span(({ hasVentureLane }: { hasVentureLane: boolean }) => [
  tw`absolute top-[28px] h-px bg-[#5c4a26]`,
  css`
    left: var(--lane-main);
    width: calc(var(--lane-venture) - var(--lane-main));
  `,
  !hasVentureLane && tw`hidden`,
]);

const Card = tw.article`relative flex flex-col gap-[10px] p-[18px] md:p-[22px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Meta = tw.div`flex flex-row flex-wrap items-center gap-[8px] text-xs`;

const Period = styled.span(({ isCurrent }: CurrentProps) => [
  tw`font-medium text-[#999]`,
  isCurrent && tw`text-[var(--accent)]`,
]);

const Kind = styled.span(({ isVenture }: { isVenture: boolean }) => [
  tw`leading-none py-[4px] px-[8px] rounded-full border-[1px] border-solid`,
  isVenture ? tw`text-[#ffc45c] border-[#5c4a26]` : tw`text-[var(--accent)] border-[var(--accent-muted)]`,
]);

const Title = tw.h4`m-0 text-base md:text-lg font-semibold text-white`;

const Outcome = tw.p`m-0 text-sm font-medium text-[var(--accent)]`;

const Lead = tw.p`m-0 text-sm text-[#bbb] break-words`;

const Bullets = tw.ul`list-none m-0 p-0 flex flex-col gap-[6px] text-sm text-[#aaa]`;

const Bullet = styled.li(() => [
  tw`relative pl-[16px] break-words`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.6em;
      width: 6px;
      height: 6px;
      border-radius: 1px;
      background: var(--accent-muted);
    }
  `,
]);

// display: flex would beat the hidden attribute, so hidden is restated here.
const More = styled.div(() => [
  tw`flex flex-col gap-[10px]`,
  css`
    &[hidden] {
      display: none;
    }
  `,
]);

const Tags = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const Tag = tw.li`text-xs leading-none text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[6px] px-[10px] border-[1px] border-solid border-[var(--accent-muted)]`;

const Toggle = styled.button(() => [
  tw`self-start cursor-pointer text-xs font-medium py-[6px] px-[10px] text-[var(--accent)] bg-transparent border-[1px] border-solid border-[var(--accent-muted)]
     rounded-[2px]`,
  css`
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background-color: var(--accent);
    }
  `,
]);

export const HistoryEntry: FC<HistoryEntryProps> = ({
  title, description, outcome, productOutcome, bullets = [], techStack = [], period, from, to, isVenture = false, labels, hasVentureLane,
  isDimmed = false,
}: HistoryEntryProps) => {
  const rowRef = useRef<HTMLLIElement>(null);
  const isReached = useInView(rowRef, { threshold: 0.35 });
  const [isExpanded, setIsExpanded] = useState(false);
  const moreId = useId();
  const { lens } = useLensStateHook();
  // Same entry, three depths: recruiters see dates, outcome and stack; product readers the product outcome
  // and one bullet; engineers the lead and three bullets. Everything else is one click away for all of them.
  const isRecruiter = lens === "recruiter";
  const previewCount = { recruiter: 0, product: HISTORY_VIEW.productPreviewBullets, engineer: HISTORY_VIEW.previewBullets }[lens];
  const [lead, ...restDescription] = isRecruiter ? [undefined, ...description] : description;
  const preview = bullets.slice(0, previewCount);
  const restBullets = bullets.slice(previewCount);
  const stackPreview = isRecruiter ? techStack.slice(0, HISTORY_VIEW.recruiterStackPreview) : [];
  const restStack = techStack.slice(stackPreview.length);
  const hiddenCount = restBullets.length + restDescription.length;
  const hasMore = hiddenCount > 0 || restStack.length > 0;
  const isCurrent = !to;

  return (
    <Row ref={rowRef} hasVentureLane={hasVentureLane} isDimmed={isDimmed}>
      {isVenture && <Branch hasVentureLane={hasVentureLane} aria-hidden="true" />}
      <Node isVenture={isVenture} isReached={isReached} isCurrent={isCurrent} hasVentureLane={hasVentureLane} aria-hidden="true" />
      <Card>
        <Meta>
          <Period isCurrent={isCurrent}>{period ?? `${from} ${labels.to} ${to ?? labels.present}`}</Period>
          {hasVentureLane && <Kind isVenture={isVenture}>{isVenture ? labels.venture : labels.role}</Kind>}
        </Meta>
        <Title>
          <DecodedText text={title} isActive={isReached} />
        </Title>
        {lens === "product" && productOutcome && <Outcome>{productOutcome}</Outcome>}
        {outcome && <Outcome>{outcome}</Outcome>}
        {lead && <Lead>{lead}</Lead>}
        {stackPreview.length > 0 && (
          <Tags>
            {stackPreview.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </Tags>
        )}
        {preview.length > 0 && (
          <Bullets>
            {preview.map((bullet) => (
              <Bullet key={bullet}>{bullet}</Bullet>
            ))}
          </Bullets>
        )}
        {hasMore && (
          <More id={moreId} hidden={!isExpanded}>
            {restDescription.map((paragraph) => (
              <Lead key={paragraph}>{paragraph}</Lead>
            ))}
            {restBullets.length > 0 && (
              <Bullets>
                {restBullets.map((bullet) => (
                  <Bullet key={bullet}>{bullet}</Bullet>
                ))}
              </Bullets>
            )}
            {restStack.length > 0 && (
              <Tags>
                {restStack.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </Tags>
            )}
          </More>
        )}
        {hasMore && (
          <Toggle type="button" aria-expanded={isExpanded} aria-controls={moreId} onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? labels.showLess : labels.showMore.replace("{count}", String(Math.max(hiddenCount, 1)))}
          </Toggle>
        )}
      </Card>
    </Row>
  );
};
