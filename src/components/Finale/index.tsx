import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faArrowRotateLeft, faEnvelope, faFileArrowDown } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { BinaryRain } from "@/components/BinaryRain";
import { DecodedText } from "@/components/DecodedText";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { Panel } from "@/components/Panel";
import { SECTION_IDS } from "@/config/sections";
import { FINALE_RAIN_CONFIG } from "@/config/theme";
import { ZONE_BOUNDARIES } from "@/config/zones";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { FinaleContent, FinaleRank } from "@/types/game";

interface FinaleProps {
  content: FinaleContent;
  bossCount: number;
  duelCount: number;
  email: string;
  linkedInUsername: string;
  cvUrl: string;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Screen = tw.div`relative h-[150px] md:h-[190px] overflow-hidden border-[1px] border-solid border-[#3a2f17]`;

const ReadableText = tw.span`sr-only`;

const Heading = tw.div`flex flex-col gap-[6px] mt-[26px]`;

const Kicker = tw.p`m-0 text-xs font-semibold text-[var(--accent)]`;

const Title = tw.h2`m-0 text-2xl md:text-3xl font-semibold text-white`;

const SummaryTitle = tw.h3`m-0 mt-[26px] mb-[12px] text-sm font-medium text-[#999]`;

const Stats = tw.dl`m-0 grid grid-cols-2 md:grid-cols-3 gap-[10px]`;

const Stat = styled.div(({ isDone }: { isDone: boolean }) => [
  tw`flex flex-col gap-[6px] p-[12px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  isDone && tw`border-[var(--accent-muted)]`,
]);

const StatName = tw.dt`text-xs text-[#999]`;

const StatValue = styled.dd(({ isDone }: { isDone: boolean }) => [
  tw`m-0 text-lg font-semibold text-white`,
  isDone && tw`text-[var(--accent)]`,
]);

const Rank = tw.div`flex flex-row flex-wrap items-center gap-[12px] mt-[22px] p-[16px] bg-[#0d0b06] border-[1px] border-solid border-[var(--accent)]`;

const RankBadge = styled.span(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[60px] h-[68px] text-[#101010] bg-[var(--accent)] text-xs font-bold text-center leading-tight px-[6px]`,
  css`
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  `,
]);

const RankText = tw.div`flex flex-col gap-[4px]`;

const RankName = tw.span`text-xl font-semibold text-white`;

const RankMeta = tw.span`text-sm text-[#bbb]`;

const Quest = tw.div`flex flex-col gap-[12px] mt-[26px]`;

const QuestTitle = tw.h3`m-0 text-base font-semibold text-white`;

const Note = tw.p`m-0 text-sm text-[#bbb] max-w-[70ch]`;

const Actions = tw.div`flex flex-row flex-wrap gap-[10px]`;

const actionStyle = (isPrimary: boolean) => [
  tw`inline-flex flex-row items-center gap-[8px] h-[40px] px-[16px] cursor-pointer text-sm font-semibold no-underline rounded-[2px] border-[1px] border-solid`,
  isPrimary ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[var(--accent)] bg-transparent border-[var(--accent-muted)]`,
  css`
    transition: filter 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
      border-color: var(--accent);
    }
  `,
];

const Action = styled.a(({ isPrimary }: { isPrimary: boolean }) => actionStyle(isPrimary));

const Restart = styled.button(() => actionStyle(false));

const rankFor = (ranks: FinaleRank[], done: number) => [...ranks].sort((first, second) => second.min - first.min).find((rank) => done >= rank.min) ?? ranks[0];

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// The end of the run: the rain spells out a thank you, the visitor sees what they actually did on the way
// down, earns a rank for it, and gets one last quest: get in touch.
export const Finale: FC<FinaleProps> = ({ content, bossCount, duelCount, email, linkedInUsername, cvUrl }: FinaleProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isReached = useInView(sectionRef, { threshold: 0.2 });
  const { zonesVisited, defeatedBosses, duelsWon, characterClass, bestScore } = useGameStateHook();
  const [runMs, setRunMs] = useState<number | null>(null);
  const zoneCount = ZONE_BOUNDARIES.length;

  // Read the first time the end is reached and kept, so the number neither ticks while it is read nor
  // changes when the reader scrolls away and back.
  useEffect(() => {
    if (isReached) {
      setRunMs((previous) => previous ?? performance.now());
    }
  }, [isReached]);

  const objectives = [
    zonesVisited >= zoneCount,
    defeatedBosses >= bossCount,
    duelsWon >= duelCount,
    characterClass !== null,
    bestScore > 0,
  ];
  const done = objectives.filter(Boolean).length;
  const rank = rankFor(content.ranks, done);
  const body = content.emailBody
    .replace("{rank}", rank.name)
    .replace("{bosses}", `${defeatedBosses}/${bossCount}`)
    .replace("{duels}", `${duelsWon}/${duelCount}`);
  const mailto = `mailto:${email}?subject=${encodeURIComponent(content.emailSubject)}&body=${encodeURIComponent(body)}`;

  return (
    <Section id={SECTION_IDS.finale} ref={sectionRef}>
      <Panel>
        <Screen>
          <ReadableText>{content.screenLabel}</ReadableText>
          <BinaryRain message={content.screen} config={FINALE_RAIN_CONFIG} />
        </Screen>
        <Heading>
          <Kicker>{content.kicker}</Kicker>
          <Title>
            <DecodedText text={content.title} isActive={isReached} />
          </Title>
        </Heading>
        <SummaryTitle>{content.summaryTitle}</SummaryTitle>
        <Stats>
          <Stat isDone={objectives[0]}>
            <StatName>{content.stats.zones}</StatName>
            <StatValue isDone={objectives[0]}>{`${zonesVisited}/${zoneCount}`}</StatValue>
          </Stat>
          <Stat isDone={objectives[1]}>
            <StatName>{content.stats.bosses}</StatName>
            <StatValue isDone={objectives[1]}>{`${defeatedBosses}/${bossCount}`}</StatValue>
          </Stat>
          <Stat isDone={objectives[2]}>
            <StatName>{content.stats.duels}</StatName>
            <StatValue isDone={objectives[2]}>{`${duelsWon}/${duelCount}`}</StatValue>
          </Stat>
          <Stat isDone={objectives[3]}>
            <StatName>{content.stats.character}</StatName>
            <StatValue isDone={objectives[3]}>{characterClass ?? content.none}</StatValue>
          </Stat>
          <Stat isDone={objectives[4]}>
            <StatName>{content.stats.raid}</StatName>
            <StatValue isDone={objectives[4]}>{bestScore > 0 ? bestScore : content.notPlayed}</StatValue>
          </Stat>
          <Stat isDone={false}>
            <StatName>{content.stats.time}</StatName>
            <StatValue isDone={false}>{runMs === null ? "0:00" : formatTime(runMs)}</StatValue>
          </Stat>
        </Stats>
        <Rank>
          <RankBadge aria-hidden="true">{content.rankLabel}</RankBadge>
          <RankText>
            <RankName>{`${content.rankLabel}: ${rank.name}`}</RankName>
            <RankMeta>{content.objectives.replace("{done}", String(done)).replace("{total}", String(objectives.length))}</RankMeta>
          </RankText>
        </Rank>
        <Quest>
          <QuestTitle>{content.finalQuest}</QuestTitle>
          <Note>{content.contactNote}</Note>
          <Actions>
            <Action href={mailto} isPrimary>
              <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
              {content.emailLabel}
            </Action>
            <Action href={`https://www.linkedin.com/in/${linkedInUsername}`} target="_blank" rel="noopener noreferrer" isPrimary={false}>
              <FontAwesomeIcon icon={faLinkedinIn} aria-hidden="true" />
              {content.linkedInLabel}
            </Action>
            <Action href={cvUrl} download isPrimary={false}>
              <FontAwesomeIcon icon={faFileArrowDown} aria-hidden="true" />
              {content.cvLabel}
            </Action>
            <Restart type="button" onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}>
              <FontAwesomeIcon icon={faArrowRotateLeft} aria-hidden="true" />
              {content.restartLabel}
            </Restart>
          </Actions>
        </Quest>
      </Panel>
    </Section>
  );
};
