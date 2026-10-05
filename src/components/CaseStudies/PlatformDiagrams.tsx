import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import useInView from "@/hooks/useInView";
import { PlatformDiagrams as PlatformDiagramsContent } from "@/types/case-studies";

interface PlayProps {
  isActive: boolean;
}

const LOOP_SECONDS = 3.6;

const Grid = tw.div`grid gap-[22px] mt-[22px] xl:grid-cols-2`;

const Diagram = tw.figure`m-0 flex flex-col gap-[16px] p-[20px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const DiagramTitle = tw.h4`m-0 text-base font-semibold text-white`;

const Caption = tw.figcaption`text-xs text-[#888]`;

const Core = tw.div`self-center px-[18px] py-[10px] text-sm font-semibold text-white text-center border-[1px] border-solid border-[var(--accent)]
bg-[#101010]`;

const Stem = tw.span`self-center w-px h-[18px] bg-[var(--accent-muted)]`;

// A comet runs along the contract bar while the diagram is on screen; transform only.
const ContractBar = styled.div(({ isActive }: PlayProps) => [
  tw`relative overflow-hidden text-center text-xs font-medium text-[var(--accent)] py-[8px] border-[1px] border-solid border-[var(--accent-muted)] bg-[#101010]`,
  css`
    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 30%;
      background: linear-gradient(90deg, rgba(var(--accent-rgb), 0), rgba(var(--accent-rgb), 0.25), rgba(var(--accent-rgb), 0));
      transform: translateX(-100%);
      animation: signal-sweep ${LOOP_SECONDS}s linear infinite;
      animation-play-state: ${isActive ? "running" : "paused"};
      will-change: transform;
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        display: none;
      }
    }
  `,
]);

const Seams = tw.ul`list-none m-0 p-0 grid grid-cols-2 md:grid-cols-3 gap-[10px]`;

const Seam = styled.li(() => [
  tw`relative p-[10px] bg-[#101010] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: -11px;
      width: 1px;
      height: 10px;
      background: var(--accent-muted);
    }
  `,
]);

const NodeName = tw.span`block text-sm font-medium text-[#eee]`;

const NodeDetail = tw.span`block text-xs text-[#999]`;

// The dot is drawn at the bottom edge of a rail-height layer that slides from -100% to 0, so it travels the
// whole rail whatever its height, using transform only.
const Flow = styled.ol(({ isActive }: PlayProps) => [
  tw`relative overflow-hidden list-none m-0 p-0 pl-[26px] flex flex-col gap-[12px]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 6px;
      top: 6px;
      bottom: 6px;
      width: 1px;
      background: var(--accent-muted);
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 13px;
      background: radial-gradient(circle at 50% calc(100% - 7px), #eafff3 0, #eafff3 2.5px, rgba(var(--accent-rgb), 0.55) 4px,
        rgba(var(--accent-rgb), 0) 7px);
      transform: translateY(-100%);
      animation: signal-descend ${LOOP_SECONDS}s linear infinite;
      animation-play-state: ${isActive ? "running" : "paused"};
      will-change: transform;
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        display: none;
      }
    }
  `,
]);

const Step = styled.li(() => [
  tw`relative`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: -24px;
      top: 6px;
      width: 9px;
      height: 9px;
      border-radius: 9999px;
      background: #101010;
      border: 1px solid var(--accent);
    }
  `,
]);

const Inputs = tw.ul`list-none m-0 p-0 grid grid-cols-2 gap-[10px]`;

const Input = tw.li`p-[10px] border-[1px] border-dashed border-[var(--accent-muted)]`;

export const PlatformDiagrams: FC<PlatformDiagramsContent> = ({ title, description, adapters, moneyFlow }: PlatformDiagramsContent) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isActive = useInView(gridRef, { once: false, threshold: 0 });

  return (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      {description.map((paragraph) => (
        <PanelText key={paragraph}>{paragraph}</PanelText>
      ))}
      <Grid ref={gridRef}>
        <Diagram>
          <DiagramTitle>{adapters.title}</DiagramTitle>
          <Core>{adapters.core}</Core>
          <Stem aria-hidden="true" />
          <ContractBar isActive={isActive}>{adapters.contracts}</ContractBar>
          <Seams>
            {adapters.seams.map((seam) => (
              <Seam key={seam.name}>
                <NodeName>{seam.name}</NodeName>
                <NodeDetail>{seam.detail}</NodeDetail>
              </Seam>
            ))}
          </Seams>
          <Caption>{adapters.caption}</Caption>
        </Diagram>
        <Diagram>
          <DiagramTitle>{moneyFlow.title}</DiagramTitle>
          <Flow isActive={isActive}>
            {moneyFlow.steps.map((step) => (
              <Step key={step.name}>
                <NodeName>{step.name}</NodeName>
                <NodeDetail>{step.detail}</NodeDetail>
              </Step>
            ))}
          </Flow>
          <Inputs>
            {moneyFlow.inputs.map((input) => (
              <Input key={input.name}>
                <NodeName>{input.name}</NodeName>
                <NodeDetail>{input.detail}</NodeDetail>
              </Input>
            ))}
          </Inputs>
          <Caption>{moneyFlow.caption}</Caption>
        </Diagram>
      </Grid>
    </Panel>
  );
};
