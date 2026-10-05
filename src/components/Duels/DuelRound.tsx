import { FC, useEffect, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { faRobot, faUser } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import useInView from "@/hooks/useInView";
import { DuelRound as DuelRoundContent, Duels } from "@/types/game";

interface DuelRoundProps extends DuelRoundContent {
  index: number;
  labels: Pick<Duels, "agentLabel" | "humanLabel" | "resultLabel" | "verdict" | "roundLabel" | "ruleLabel">;
  onReveal: (index: number) => void;
}

interface RevealProps {
  isRevealed: boolean;
}

interface SideProps extends RevealProps {
  isLoser: boolean;
}

const Round = tw.li`flex flex-col gap-[10px]`;

const RoundLabel = tw.span`text-xs font-semibold text-[#999]`;

const Sides = tw.div`grid gap-[10px] md:grid-cols-2`;

const Side = tw.div`relative flex flex-col gap-[8px] p-[16px] text-sm break-words border-[1px] border-solid`;

const Who = tw.span`inline-flex flex-row items-center gap-[8px] text-xs font-semibold`;

// Whoever lost the round dims and takes the stamp once it is played; whoever was right lights up.
const AgentSide = styled(Side)(({ isRevealed, isLoser }: SideProps) => [
  tw`text-[#ccc] bg-[#0d0d0d] border-[#1E1E1E]`,
  css`
    transition: opacity 0.5s ease, border-color 0.5s ease;
  `,
  isRevealed && isLoser && tw`opacity-60`,
  isRevealed && !isLoser && tw`text-white border-[var(--accent-muted)]`,
]);

const Verdict = styled.span(({ isRevealed }: RevealProps) => [
  tw`absolute top-[12px] right-[12px] text-xs font-bold text-[#ff8a8a] border-[1px] border-solid border-[#ff8a8a] rounded-[2px] px-[8px] py-[3px]`,
  css`
    transform: rotate(-6deg) scale(1.6);
    opacity: 0;
    transition: opacity 0.25s ease 0.35s, transform 0.25s cubic-bezier(0.3, 1.6, 0.6, 1) 0.35s;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  isRevealed && css`
    transform: rotate(-6deg);
    opacity: 1;
  `,
]);

// My side slides in from the right, the side the reader expects a reply from.
const HumanSide = styled(Side)(({ isRevealed, isLoser }: SideProps) => [
  tw`text-white bg-[#101010] border-[var(--accent-muted)]`,
  css`
    transform: translateX(24px);
    opacity: 0;
    transition: opacity 0.4s ease 0.15s, transform 0.4s cubic-bezier(0.165, 0.85, 0.45, 1) 0.15s;

    @media (prefers-reduced-motion: reduce) {
      transform: none;
      opacity: 1;
      transition: none;
    }
  `,
  isRevealed && css`
    transform: none;
    opacity: ${isLoser ? 0.6 : 1};
  `,
  isLoser && tw`text-[#ccc] border-[#1E1E1E]`,
]);

const Result = tw.p`m-0 text-sm text-[#bbb] break-words [& > strong]:text-[var(--accent)]`;

const Rule = tw.p`m-0 text-sm text-[#ddd] break-words [& > strong]:text-[var(--accent)]`;

export const DuelRound: FC<DuelRoundProps> = ({ agent, human, result, winner = "human", rule, index, labels, onReveal }: DuelRoundProps) => {
  const isAgentWin = winner === "agent";
  const roundRef = useRef<HTMLLIElement>(null);
  const isRevealed = useInView(roundRef, { threshold: 0.5 });

  useEffect(() => {
    if (isRevealed) {
      onReveal(index);
    }
  }, [index, isRevealed, onReveal]);

  return (
    <Round ref={roundRef}>
      <RoundLabel>{`${labels.roundLabel} ${index + 1}`}</RoundLabel>
      <Sides>
        <AgentSide isRevealed={isRevealed} isLoser={!isAgentWin}>
          <Who>
            <FontAwesomeIcon icon={faRobot} aria-hidden="true" />
            {labels.agentLabel}
          </Who>
          <span>{agent}</span>
          {!isAgentWin && <Verdict isRevealed={isRevealed}>{labels.verdict}</Verdict>}
        </AgentSide>
        <HumanSide isRevealed={isRevealed} isLoser={isAgentWin}>
          <Who>
            <FontAwesomeIcon icon={faUser} aria-hidden="true" />
            {labels.humanLabel}
          </Who>
          <span>{human}</span>
          {isAgentWin && <Verdict isRevealed={isRevealed}>{labels.verdict}</Verdict>}
        </HumanSide>
      </Sides>
      <Result>
        <strong>{`${labels.resultLabel}: `}</strong>
        {result}
      </Result>
      {rule && (
        <Rule>
          <strong>{`${labels.ruleLabel}: `}</strong>
          {rule}
        </Rule>
      )}
    </Round>
  );
};
