import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { AI_USAGE_MOTION } from "@/components/AiUsage/config";
import { Panel, PanelTitle, PlayStateProps } from "@/components/AiUsage/styles";
import useInView from "@/hooks/useInView";
import { AiUsageTimeline } from "@/packages/insights/ai-usage";

const { railSeconds } = AI_USAGE_MOTION;

interface DotProps extends PlayStateProps {
  isCurrent: boolean;
  isVisible: boolean;
}

interface PeriodProps {
  isCurrent: boolean;
}

const Milestones = tw.ol`relative list-none m-0 mt-[25px] p-0 pl-[32px] flex flex-col gap-[26px]`;

// The rail draws itself top to bottom; each dot lights as the fill reaches it.
const Rail = styled.span(({ isActive }: PlayStateProps) => [
  tw`absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-[#1E1E1E]`,
  css`
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, #4bffa5, #2f6b4d);
      transform-origin: top;
      transform: scaleY(${isActive ? 1 : 0});
      transition: transform ${railSeconds}s cubic-bezier(0.165, 0.85, 0.45, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        transition: none;
      }
    }
  `,
]);

const Milestone = tw.li`relative`;

// Current roles keep a slow outward ring, the way a live status light would.
const Dot = styled.span(({ isActive, isCurrent, isVisible }: DotProps) => [
  tw`absolute left-[-32px] top-[5px] w-[15px] h-[15px] rounded-full bg-[#101010] border-[1px] border-solid border-[#2f6b4d]`,
  css`
    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  isActive && tw`bg-[#4bffa5] border-[#4bffa5]`,
  isActive && css`box-shadow: 0 0 8px rgba(75, 255, 165, 0.6);`,
  isCurrent && css`
    &::after {
      content: "";
      position: absolute;
      inset: -1px;
      border-radius: 9999px;
      border: 1px solid #4bffa5;
      animation: live-ring 1.8s ease-out infinite;
      animation-play-state: ${isVisible ? "running" : "paused"};
      will-change: transform, opacity;
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        animation: none;
      }
    }
  `,
]);

const Period = styled.span(({ isCurrent }: PeriodProps) => [
  tw`block text-xs font-medium text-[#999]`,
  isCurrent && tw`text-[#4bffa5]`,
]);

const MilestoneTitle = tw.h4`m-[2px 0 6px 0] text-base font-semibold text-white`;

const MilestoneText = tw.p`m-0 max-w-[70ch] text-sm text-[#bbb] break-words`;

export const Timeline: FC<AiUsageTimeline> = ({ title, milestones }: AiUsageTimeline) => {
  const listRef = useRef<HTMLOListElement>(null);
  const isActive = useInView(listRef);
  const isVisible = useInView(listRef, { once: false, threshold: 0 });
  const lastIndex = Math.max(1, milestones.length - 1);

  return (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      <Milestones ref={listRef}>
        <Rail aria-hidden="true" isActive={isActive} />
        {milestones.map((milestone, index) => (
          <Milestone key={`${milestone.period}-${milestone.title}`}>
            <Dot
              aria-hidden="true"
              isActive={isActive}
              isCurrent={Boolean(milestone.isCurrent)}
              isVisible={isVisible}
              style={{ transitionDelay: `${(index / lastIndex) * railSeconds * 0.8}s` }}
            />
            <Period isCurrent={Boolean(milestone.isCurrent)}>{milestone.period}</Period>
            <MilestoneTitle>{milestone.title}</MilestoneTitle>
            <MilestoneText>{milestone.description}</MilestoneText>
          </Milestone>
        ))}
      </Milestones>
    </Panel>
  );
};
