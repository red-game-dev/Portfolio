import { FC, useCallback, useEffect, useState } from "react";

import tw from "twin.macro";

import { faRobot, faUser } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { DuelRound } from "@/components/Duels/DuelRound";
import { Fight } from "@/components/Duels/Fight";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
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

const RulesTitle = tw.h3`m-0 text-lg font-semibold text-white`;

const RulesText = tw.p`m-0 mt-[6px] mb-[18px] text-sm text-[#bbb] max-w-[70ch]`;

const Rules = tw.ul`list-none m-0 p-0 grid gap-[12px] md:grid-cols-2 xl:grid-cols-3`;

const Rule = tw.li`flex flex-col gap-[6px] p-[14px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const RuleName = tw.h4`m-0 text-sm font-semibold text-[var(--accent)]`;

const RuleDetail = tw.p`m-0 text-sm text-[#ccc] break-words`;

const RulesSpacer = tw.div`mt-[22px]`;

const Rounds = tw.ol`list-none m-0 p-0 flex flex-col gap-[26px]`;

const winnerOf = (round: DuelsProps["rounds"][number]) => round.winner ?? "human";

// PvP against my own agents: each round is a real call, most won by me and some by the agent, each with
// what shipped. The score counts my wins as the reader reaches them.
export const Duels: FC<DuelsProps> = ({
  intro, rounds, scoreLabel, scoreOf, versusLabel, koLabel, rulesTitle, rulesDescription, rules, ...labels
}: DuelsProps) => {
  const [played, setPlayed] = useState<ReadonlySet<number>>(() => new Set());
  const { recordDuels } = useGameStateHook();
  const { settings } = useLensStateHook();
  const onReveal = useCallback((index: number) => {
    setPlayed((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

  useEffect(() => {
    recordDuels(played.size);
  }, [played, recordDuels]);

  const playedRounds = [...played].map((index) => rounds[index]);
  const humanWins = playedRounds.filter((round) => winnerOf(round) === "human").length;
  const agentWins = playedRounds.length - humanWins;
  const totalHumanWins = rounds.filter((round) => winnerOf(round) === "human").length;
  const lastPlayed = played.size > 0 ? rounds[Math.max(...played)] : undefined;

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
            <ReadableText>{`${scoreLabel} ${totalHumanWins} ${scoreOf} ${rounds.length}`}</ReadableText>
            <span aria-hidden="true">
              {`${scoreLabel} `}
              <Points>{humanWins}</Points>
              {` ${scoreOf} ${rounds.length}`}
            </span>
          </Score>
        </Scoreboard>
        {settings.gameLayer && (
          <Fight
            played={played.size}
            total={rounds.length}
            humanWins={humanWins}
            totalHumanWins={totalHumanWins}
            agentWins={agentWins}
            lastWinner={lastPlayed ? winnerOf(lastPlayed) : "human"}
            agentLabel={labels.agentLabel}
            humanLabel={labels.humanLabel}
            koLabel={koLabel}
          />
        )}
        <Rounds>
          {rounds.map((round, index) => (
            <DuelRound key={round.agent} {...round} index={index} labels={labels} onReveal={onReveal} />
          ))}
        </Rounds>
      </Panel>
      <RulesSpacer>
        <Panel>
          <RulesTitle>{rulesTitle}</RulesTitle>
        <RulesText>{rulesDescription}</RulesText>
        <Rules>
          {rules.map((rule) => (
            <Rule key={rule.name}>
              <RuleName>{rule.name}</RuleName>
              <RuleDetail>{rule.detail.replace(/\s+/g, " ").trim()}</RuleDetail>
            </Rule>
          ))}
          </Rules>
        </Panel>
      </RulesSpacer>
    </Section>
  );
};
