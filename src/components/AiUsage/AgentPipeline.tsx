import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AI_USAGE_MOTION } from "@/components/AiUsage/config";
import { Panel, PanelText, PanelTitle, PlayStateProps } from "@/components/AiUsage/styles";
import useInView from "@/hooks/useInView";
import { AiUsageAgents } from "@/packages/insights/ai-usage";
import { AiUsageIcon } from "@/types/ai-usage";

const { signalLoopSeconds } = AI_USAGE_MOTION;

interface StageCountProps {
  count: number;
}

const playState = ({ isActive }: PlayStateProps) => css`animation-play-state: ${isActive ? "running" : "paused"};`;

const Flow = tw.div`relative my-[30px]`;

const Track = styled.div(() => [
  tw`absolute h-[24px] overflow-hidden pointer-events-none`,
  css`
    top: 50%;
    transform: translateY(-50%);

    &::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 1px;
      background: #2f6b4d;
    }
  `,
]);

// A comet travelling along the track: a fading tail with a bright head at its right edge. Moving the
// whole track-wide element from -100% to 0 carries the head from the first stage to the last.
const Signal = styled.span((props: PlayStateProps) => [
  tw`absolute inset-0`,
  css`
    transform: translateX(-100%);
    animation: signal-flow ${signalLoopSeconds}s linear infinite;
    will-change: transform;

    &::before {
      content: "";
      position: absolute;
      right: 0;
      top: 50%;
      width: 72px;
      height: 2px;
      transform: translateY(-50%);
      background: linear-gradient(90deg, rgba(75, 255, 165, 0), #4bffa5);
    }

    &::after {
      content: "";
      position: absolute;
      right: -4px;
      top: 50%;
      width: 8px;
      height: 8px;
      margin-top: -4px;
      border-radius: 9999px;
      background: #eafff3;
      box-shadow: 0 0 10px 3px rgba(75, 255, 165, 0.8);
    }

    @media (prefers-reduced-motion: reduce) {
      display: none;
    }
  `,
  playState(props),
]);

const Nodes = styled.div(({ count }: StageCountProps) => [
  tw`relative z-[2] grid`,
  css`grid-template-columns: repeat(${count}, minmax(0, 1fr));`,
]);

// Each node runs the same loop as the signal, offset by its position on the track, so it lights up
// the moment the signal arrives. Both layers animate only transform and opacity, which the compositor
// handles without repainting.
const Node = styled.div((props: PlayStateProps) => [
  tw`relative mx-auto flex items-center justify-center w-[48px] h-[48px] rounded-full bg-[#101010] text-lg text-[#4bffa5]
     border-[1px] border-solid border-[#2f6b4d]`,
  css`
    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: -1px;
      border-radius: 9999px;
      pointer-events: none;
      animation-duration: ${signalLoopSeconds}s;
      animation-timing-function: ease-out;
      animation-iteration-count: infinite;
      animation-delay: inherit;
      animation-play-state: inherit;
    }

    &::before {
      background: radial-gradient(circle, rgba(75, 255, 165, 0.35) 0%, rgba(75, 255, 165, 0) 70%);
      opacity: 0;
      animation-name: node-glow;
    }

    &::after {
      border: 1px solid #4bffa5;
      opacity: 0;
      animation-name: node-ring;
      will-change: transform, opacity;
    }

    @media (prefers-reduced-motion: reduce) {
      &::before,
      &::after {
        animation: none;
      }
    }
  `,
  playState(props),
]);

const Stages = styled.ol(({ count }: StageCountProps) => [
  tw`list-none m-0 p-0 grid gap-[24px] md:grid-cols-2`,
  css`
    @media (min-width: 1024px) {
      grid-template-columns: repeat(${count}, minmax(0, 1fr));
    }
  `,
]);

const Stage = tw.li`relative pt-[16px] border-0 border-t-[1px] border-solid border-[#1E1E1E]`;

const StageName = tw.h4`m-[0 0 12px 0] flex items-baseline gap-2 text-base font-semibold text-white`;

const StageIndex = tw.span`text-sm font-medium text-[#4bffa5]`;

const Principles = tw.ul`list-none m-0 p-0 flex flex-col gap-[14px]`;

const Principle = tw.li`text-sm`;

const PrincipleTitle = tw.strong`block mb-[2px] font-medium text-[#eee]`;

const PrincipleText = tw.span`block text-[#999]`;

const Footer = tw.p`m-[28px 0 0 0] max-w-[70ch] text-sm text-[#888]`;

export const AgentPipeline: FC<AiUsageAgents<AiUsageIcon>> = ({ title, description, stages, footer }: AiUsageAgents<AiUsageIcon>) => {
  const flowRef = useRef<HTMLDivElement>(null);
  // Live, not latched: the loop stops whenever the diagram is off screen.
  const isActive = useInView(flowRef, { once: false, threshold: 0 });
  const count = stages.length;
  // The track runs between the centres of the first and last columns.
  const trackInset = `${50 / count}%`;

  return (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      {description.map((paragraph, index) => (
        <PanelText key={index}>{paragraph}</PanelText>
      ))}
      <Flow ref={flowRef} aria-hidden="true">
        <Track style={{ left: trackInset, right: trackInset }}>
          <Signal isActive={isActive} />
        </Track>
        <Nodes count={count}>
          {stages.map((stage, index) => (
            <Node
              key={stage.name}
              isActive={isActive}
              style={{ animationDelay: `${(index / Math.max(1, count - 1)) * signalLoopSeconds}s` }}
            >
              <FontAwesomeIcon icon={stage.icon} />
            </Node>
          ))}
        </Nodes>
      </Flow>
      <Stages count={count}>
        {stages.map((stage, index) => (
          <Stage key={stage.name}>
            <StageName>
              <StageIndex>{index + 1}</StageIndex>
              {stage.name}
            </StageName>
            <Principles>
              {stage.principles.map((principle) => (
                <Principle key={principle.title}>
                  <PrincipleTitle>{principle.title}</PrincipleTitle>
                  <PrincipleText>{principle.description}</PrincipleText>
                </Principle>
              ))}
            </Principles>
          </Stage>
        ))}
      </Stages>
      <Footer>{footer}</Footer>
    </Panel>
  );
};
