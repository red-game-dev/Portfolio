import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { AI_USAGE_MOTION } from "@/components/AiUsage/config";
import { DecodedText } from "@/components/DecodedText";
import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import useInView from "@/hooks/useInView";
import { AiUsageMixView } from "@/packages/insights/ai-usage";

const { rowDelayMs, bitDelayMs } = AI_USAGE_MOTION;

interface BitProps {
  isLit: boolean;
}

const Rows = tw.ol`list-none m-0 mt-[25px] p-0 flex flex-col gap-[16px]`;

const RowLabel = styled.span(() => [
  tw`text-sm lg:text-base text-[#eee] break-words`,
  css`
    grid-area: label;
    transition: color 0.3s ease;
  `,
]);

const RowValue = styled.span(() => [
  tw`text-sm lg:text-base font-semibold text-white text-right`,
  css`
    grid-area: value;
    font-variant-numeric: tabular-nums;
  `,
]);

const Bits = styled.span(() => [
  tw`grid gap-[1px] md:gap-[2px]`,
  css`grid-area: bits;`,
]);

// The lit fill is its own layer that only changes opacity, so 270 cells lighting up costs the
// compositor, not a repaint per cell.
const Bit = styled.span(({ isLit }: BitProps) => [
  tw`relative flex items-center justify-center rounded-[2px] text-[0px] md:text-[9px] leading-none select-none text-[#2c2c2c] bg-[#161616]`,
  css`
    aspect-ratio: 1 / 1;
    transition: color 0.3s ease-out;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: #4bffa5;
      box-shadow: 0 0 6px rgba(75, 255, 165, 0.35);
      opacity: 0;
      transition: opacity 0.3s ease-out;
      /* Takes the per-cell delay set inline on the cell, so the fill sweeps with the digits. */
      transition-delay: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &::before {
        transition: none;
      }
    }
  `,
  isLit && tw`text-[#0b2a1b]`,
  isLit && css`
    &::before {
      opacity: 1;
    }
  `,
]);

const BitDigit = tw.span`relative`;

const Row = styled.li(() => [
  tw`grid items-center gap-x-4 gap-y-2`,
  css`
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "label value" "bits bits";

    @media (min-width: 1024px) {
      grid-template-columns: 15rem minmax(0, 1fr) 4.5rem;
      grid-template-areas: "label bits value";
    }

    &:hover ${RowLabel} {
      color: #fff;
    }

    &:hover [data-lit="true"]::before {
      box-shadow: 0 0 10px rgba(75, 255, 165, 0.7);
    }
  `,
]);

const Notes = tw.ul`list-none m-0 mt-[25px] p-0 flex flex-col gap-[6px] text-sm text-[#888]`;

export const TaskMix: FC<AiUsageMixView> = ({ title, description, tasks, notes, trackLength }: AiUsageMixView) => {
  const rowsRef = useRef<HTMLOListElement>(null);
  const isInView = useInView(rowsRef);

  return (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      {description.map((paragraph, index) => (
        <PanelText key={index}>{paragraph}</PanelText>
      ))}
      {/* Rows start one after another and each fills left to right, so the chart reads as one sweep. */}
      <Rows ref={rowsRef}>
        {tasks.map((task, rowIndex) => (
          <Row key={task.name}>
            <RowLabel>
              <DecodedText text={task.name} isActive={isInView} delay={rowIndex * rowDelayMs} />
            </RowLabel>
            <RowValue>
              <DecodedText text={task.label} isActive={isInView} delay={rowIndex * rowDelayMs + task.litCells * bitDelayMs} />
            </RowValue>
            <Bits aria-hidden="true" style={{ gridTemplateColumns: `repeat(${trackLength}, minmax(0, 1fr))` }}>
              {Array.from({ length: trackLength }, (_, bitIndex) => {
                const isLit = isInView && bitIndex < task.litCells;

                return (
                  <Bit
                    key={bitIndex}
                    isLit={isLit}
                    data-lit={isLit}
                    style={{ transitionDelay: `${rowIndex * rowDelayMs + bitIndex * bitDelayMs}ms` }}
                  >
                    <BitDigit>{bitIndex < task.litCells ? "1" : "0"}</BitDigit>
                  </Bit>
                );
              })}
            </Bits>
          </Row>
        ))}
      </Rows>
      <Notes>
        {notes.map((note, index) => (
          <li key={index}>{note}</li>
        ))}
      </Notes>
    </Panel>
  );
};
