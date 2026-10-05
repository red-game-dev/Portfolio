import { FC, useCallback, useState } from "react";

import tw from "twin.macro";

import { faRobot, faUser } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { DuelRound } from "@/components/Duels/DuelRound";
import { Panel } from "@/components/Panel";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { Duels as DuelsContent } from "@/types/game";
import { SectionIntros } from "@/types/sections-intros";

interface DuelsProps extends DuelsContent {
  intro: SectionIntros;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Scoreboard = tw.div`flex flex-row flex-wrap items-center justify-between gap-[12px] pb-[18px] mb-[22px] border-0 border-b-[1px]
border-solid border-[#1E1E1E]`;

const Fighters = tw.span`inline-flex flex-row items-center gap-[14px]`;

const Fighter = tw.span`inline-flex flex-row items-center gap-[10px] text-base font-semibold text-white`;

const Versus = tw.span`text-xs font-bold text-[#999]`;

const Score = tw.span`text-sm text-[#bbb]`;

const Points = tw.strong`text-lg text-[var(--accent)]`;

const ReadableText = tw.span`sr-only`;

const Rounds = tw.ol`list-none m-0 p-0 flex flex-col gap-[26px]`;

// PvP against my own agents: each round is a real call where the agent's proposal lost to mine. The
// score counts the rounds as the reader reaches them.
export const Duels: FC<DuelsProps> = ({ intro, rounds, scoreLabel, scoreOf, versusLabel, ...labels }: DuelsProps) => {
  const [played, setPlayed] = useState<ReadonlySet<number>>(() => new Set());
  const onReveal = useCallback((index: number) => {
    setPlayed((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

  return (
    <Section id={SECTION_IDS.duels}>
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Panel>
        <Scoreboard>
          <Fighters>
            <Fighter>
              <FontAwesomeIcon icon={faRobot} aria-hidden="true" />
              {labels.agentLabel}
            </Fighter>
            <Versus aria-hidden="true">{versusLabel}</Versus>
            <Fighter>
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              {labels.humanLabel}
            </Fighter>
          </Fighters>
          <Score>
            <ReadableText>{`${scoreLabel} ${rounds.length} ${scoreOf} ${rounds.length}`}</ReadableText>
            <span aria-hidden="true">
              {`${scoreLabel} `}
              <Points>{played.size}</Points>
              {` ${scoreOf} ${rounds.length}`}
            </span>
          </Score>
        </Scoreboard>
        <Rounds>
          {rounds.map((round, index) => (
            <DuelRound key={round.agent} {...round} index={index} labels={labels} onReveal={onReveal} />
          ))}
        </Rounds>
      </Panel>
    </Section>
  );
};
