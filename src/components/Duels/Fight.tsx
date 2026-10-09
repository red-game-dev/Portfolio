import { FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { PixelSprite } from "@/components/PixelSprite";
import { AGENT_SPRITE, WARRIOR_SPRITE } from "@/config/sprites";
import { media } from "@/styles/mixins";

interface FightProps {
  played: number;
  total: number;
  humanWins: number;
  totalHumanWins: number;
  agentWins: number;
  // Who won the round the reader just reached, which decides who lands the blow.
  lastWinner: "human" | "agent";
  agentLabel: string;
  humanLabel: string;
  koLabel: string;
}

const CLASH_MS = 1300;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

// The agent swings, gets blocked, then takes the counter and is knocked back with a white hit flash.
const agentClash = keyframes`
  0% { transform: translateX(0); }
  18% { transform: translateX(56px); }
  32% { transform: translateX(0); }
  52% { transform: translateX(0); filter: none; }
  58% { transform: translateX(-14px); filter: brightness(3) saturate(0); }
  72% { transform: translateX(0); filter: none; }
  100% { transform: translateX(0); }
`;

// I take the blow on the shield, then lunge back with the sword.
const meClash = keyframes`
  0%, 16% { transform: translateX(0); }
  21% { transform: translateX(6px); }
  32% { transform: translateX(0); }
  46%, 56% { transform: translateX(-56px); }
  70%, 100% { transform: translateX(0); }
`;

// A round the agent won: its strike gets through and I take the hit.
const agentStrike = keyframes`
  0% { transform: translateX(0); }
  18%, 30% { transform: translateX(56px); }
  46%, 100% { transform: translateX(0); }
`;

const meHit = keyframes`
  0%, 16% { transform: translateX(0); filter: none; }
  22% { transform: translateX(14px); filter: brightness(3) saturate(0); }
  38%, 100% { transform: translateX(0); filter: none; }
`;

const spark = keyframes`
  0% { opacity: 0; transform: scale(0.2); }
  12% { opacity: 1; transform: scale(1.3); }
  30%, 100% { opacity: 0; transform: scale(1.7); }
`;

const knockOut = keyframes`
  from { transform: rotate(0) translateY(0); opacity: 1; }
  to { transform: rotate(-80deg) translate(-26px, 6px); opacity: 0.6; }
`;

const stamp = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(2.2) rotate(-8deg); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-8deg); }
`;

const reducedMotion = css`
  ${media.reducedMotion} {
    animation: none !important;
  }
`;

// Pinned under the header while the rounds scroll past, so every clash is seen.
const Stage = tw.div`sticky top-[84px] lg:top-[150px] z-[3] mb-[24px] pt-[6px] pb-[10px] bg-[#101010]`;

const Bars = tw.div`flex flex-row justify-between gap-[16px] mb-[6px] text-xs text-[#bbb]`;

const Bar = styled.div(({ isRight }: { isRight?: boolean }) => [
  tw`flex flex-col gap-[4px] w-[42%] max-w-[220px]`,
  isRight && tw`items-end text-right`,
]);

const Track = tw.span`relative block w-full h-[6px] bg-[#1d1414] overflow-hidden`;

const Fill = styled.span(({ isAgent }: { isAgent: boolean }) => [
  tw`absolute inset-0`,
  isAgent ? tw`bg-[#ff5a5a]` : tw`bg-[var(--accent)]`,
  css`
    transform-origin: ${isAgent ? "left" : "right"} center;
    transition: transform 0.5s ease ${CLASH_MS * 0.6}ms;
  `,
]);

const Ring = tw.div`relative mx-auto h-[110px] md:h-[120px] max-w-[380px]`;

const Slot = styled.div(({ side }: { side: "left" | "right" }) => [
  tw`absolute bottom-0 w-[84px] h-[84px] md:w-[96px] md:h-[96px]`,
  side === "left" ? tw`left-0` : tw`right-0`,
]);

interface LungeProps {
  isClashing: boolean;
  isAgent: boolean;
  isKo: boolean;
  isAgentRound: boolean;
}

const clashFor = ({ isAgent, isAgentRound }: LungeProps) => {
  if (isAgentRound) {
    return isAgent ? agentStrike : meHit;
  }

  return isAgent ? agentClash : meClash;
};

const Lunge = styled.div((props: LungeProps) => [
  tw`w-full h-full`,
  css`
    transform-origin: bottom center;
  `,
  props.isClashing && css`
    animation: ${clashFor(props)} ${CLASH_MS}ms cubic-bezier(0.3, 0.7, 0.4, 1) both;
  `,
  props.isKo && css`
    animation: ${agentClash} ${CLASH_MS}ms cubic-bezier(0.3, 0.7, 0.4, 1), ${knockOut} 0.5s ease-in ${CLASH_MS}ms forwards;
  `,
  reducedMotion,
]);

const Bob = styled.div(({ isStill }: { isStill: boolean }) => [
  tw`w-full h-full`,
  !isStill && css`
    animation: ${bob} 0.9s steps(2) infinite;
  `,
  reducedMotion,
]);

const Sprite = styled.div(({ isMirrored }: { isMirrored?: boolean }) => [
  tw`w-full h-full`,
  css`
    filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.25));

    & > svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  isMirrored && css`
    transform: scaleX(-1);
  `,
]);

const Spark = styled.span(({ left, delayMs }: { left: string; delayMs: number }) => [
  tw`absolute bottom-[34px] w-[26px] h-[26px] rounded-full opacity-0`,
  css`
    left: ${left};
    background: radial-gradient(circle, #ffffff 0%, var(--accent) 35%, rgba(0, 0, 0, 0) 70%);
    animation: ${spark} ${CLASH_MS}ms ease-out ${delayMs}ms both;
  `,
  reducedMotion,
]);

const Ko = styled.span(() => [
  tw`absolute left-1/2 top-1/2 text-2xl font-black text-[#ff5a5a] border-[2px] border-solid border-[#ff5a5a] px-[10px] py-[2px] rounded-[2px]`,
  css`
    transform: translate(-50%, -50%) rotate(-8deg);
    animation: ${stamp} 0.35s cubic-bezier(0.3, 1.6, 0.6, 1) ${CLASH_MS + 300}ms both;
  `,
  reducedMotion,
]);

const Floor = styled.div(() => [
  tw`h-[6px] mx-auto max-w-[420px]`,
  css`
    background: repeating-linear-gradient(90deg, var(--accent-muted) 0 8px, transparent 8px 12px);
    opacity: 0.6;
  `,
]);

// The duel, played out: every round the reader reaches is one clash, and the agent's health drops a
// quarter each time until it goes down. Remounted per round, so the clash animation replays.
// The agent's health drains with every round I win; mine takes a dent for each round it wins, but never
// runs out, since those rounds are where I learnt something.
const HIT_DAMAGE = 0.15;
const MIN_HEALTH = 0.4;

export const Fight: FC<FightProps> = ({
  played, total, humanWins, totalHumanWins, agentWins, lastWinner, agentLabel, humanLabel, koLabel,
}: FightProps) => {
  const isKo = total > 0 && played >= total && humanWins >= totalHumanWins;
  const agentHealth = totalHumanWins > 0 ? 1 - humanWins / totalHumanWins : 1;
  const myHealth = Math.max(MIN_HEALTH, 1 - agentWins * HIT_DAMAGE);
  const isAgentRound = lastWinner === "agent" && !isKo;

  return (
    <Stage aria-hidden="true">
      <Bars>
        <Bar>
          <span>{agentLabel}</span>
          <Track>
            <Fill isAgent style={{ transform: `scaleX(${agentHealth})` }} />
          </Track>
        </Bar>
        <Bar isRight>
          <span>{humanLabel}</span>
          <Track>
            <Fill isAgent={false} style={{ transform: `scaleX(${myHealth})` }} />
          </Track>
        </Bar>
      </Bars>
      <Ring key={played}>
        <Slot side="left">
          <Lunge isAgent isClashing={played > 0 && !isKo} isKo={isKo} isAgentRound={isAgentRound}>
            <Bob isStill={isKo}>
              <Sprite>
                <PixelSprite {...AGENT_SPRITE} />
              </Sprite>
            </Bob>
          </Lunge>
        </Slot>
        {played > 0 && <Spark left="58%" delayMs={CLASH_MS * 0.16} />}
        {played > 0 && !isAgentRound && <Spark left="34%" delayMs={CLASH_MS * 0.5} />}
        <Slot side="right">
          <Lunge isAgent={false} isClashing={played > 0} isKo={false} isAgentRound={isAgentRound}>
            <Bob isStill={false}>
              <Sprite isMirrored>
                <PixelSprite {...WARRIOR_SPRITE} />
              </Sprite>
            </Bob>
          </Lunge>
        </Slot>
        {isKo && <Ko>{koLabel}</Ko>}
      </Ring>
      <Floor />
    </Stage>
  );
};
