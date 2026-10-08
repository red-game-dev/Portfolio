import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faArrowRotateLeft, faEnvelope, faFileArrowDown, faRocket, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionLink, actionStyle } from "@/components/Controls";
import { DecodedText } from "@/components/DecodedText";
import { useLaunch } from "@/components/Finale/hooks/useLaunch";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { Panel } from "@/components/Panel";
import { Section } from "@/components/Section";
import { SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { CROSSED_ZONES, ZONE_BOUNDARIES, ZoneId } from "@/config/zones";
import useInView from "@/hooks/useInView";
import { scrollBehavior } from "@/packages/accessibility/motion";
import type { LaunchSnapshot } from "@/packages/games/launch";
import { fill } from "@/packages/text/format";
import { FinaleContent, FinaleLaunch, FinaleRank } from "@/types/game";

interface FinaleProps {
  content: FinaleContent;
  zoneLabels: Record<ZoneId, string>;
  contactTime: string;
  bossCount: number;
  duelCount: number;
  email: string;
  linkedInUsername: string;
  cvUrl: string;
}

const Board = tw.div`relative h-[220px] md:h-[280px] overflow-hidden border-[1px] border-solid border-[var(--accent-muted)]`;

const Canvas = tw.canvas`absolute inset-0 w-full h-full`;

const Status = tw.p`absolute top-[12px] left-[14px] m-0 text-xs font-semibold text-[var(--accent)]`;

const Controls = tw.div`flex flex-row flex-wrap items-center gap-[12px] mt-[14px]`;

const LaunchButton = styled.button(() => [
  actionStyle(true),
  css`
    touch-action: none;
    user-select: none;
    -webkit-touch-callout: none;
  `,
]);

const Hint = tw.p`m-0 text-xs text-[#999] max-w-[60ch]`;

const Mission = styled.div(({ isLit }: { isLit: boolean }) => [
  tw`flex flex-col gap-[8px] mt-[26px] p-[18px] bg-[#0b0d16] border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    transition: border-color 0.6s ease;
  `,
  isLit && tw`border-[var(--accent)]`,
]);

const MissionTitle = tw.h3`m-0 text-sm font-semibold text-[var(--accent)]`;

const MissionLine = tw.p`m-0 text-lg md:text-xl font-semibold text-white leading-snug max-w-[60ch]`;

const StarMark = styled.span(({ isLit }: { isLit: boolean }) => [
  tw`mr-[6px] text-[#333]`,
  css`
    transition: color 0.4s ease;
  `,
  isLit && tw`text-[var(--accent)]`,
]);

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

const Restart = styled.button(() => actionStyle(false));

const rankFor = (ranks: FinaleRank[], done: number) => [...ranks].sort((first, second) => second.min - first.min).find((rank) => done >= rank.min) ?? ranks[0];

// What the board says, and what a screen reader hears, at each moment of the launch.
const statusOf = (launch: FinaleLaunch, { status, passed }: LaunchSnapshot, zoneLabels: Record<ZoneId, string>) => {
  if (status === "charging") {
    return launch.charging;
  }

  if (status === "launching") {
    return passed > 0 ? fill(launch.leaving, { zone: zoneLabels[CROSSED_ZONES[passed - 1]] }) : launch.liftOff;
  }

  return status === "orbit" ? launch.orbit : "";
};

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// The end of the run, and the page lifting off: the visitor launches out of the game world past every zone
// they crossed, their run lights up as stars on the way, and the journey closes on where I want to go next,
// with one last quest: get in touch.
export const Finale: FC<FinaleProps> = ({ content, zoneLabels, contactTime, bossCount, duelCount, email, linkedInUsername, cvUrl }: FinaleProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { snapshot, isReady, onPointerDown, onPointerUp, onPointerCancel, onClick } = useLaunch(boardRef, canvasRef);
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
  const isOrbit = snapshot.status === "orbit";
  // One star per stat, lit as each zone falls behind, the last one in orbit.
  const isLit = (index: number) => isOrbit || snapshot.passed > index;
  const hint = `${SECTION_IDS.finale}-hint`;
  const rank = rankFor(content.ranks, done);
  const body = fill(content.emailBody, { rank: rank.name, bosses: `${defeatedBosses}/${bossCount}`, duels: `${duelsWon}/${duelCount}` });
  const mailto = `mailto:${email}?subject=${encodeURIComponent(content.emailSubject)}&body=${encodeURIComponent(body)}`;

  return (
    <Section id={SECTION_IDS.finale} ref={sectionRef}>
      <Panel>
        <Board ref={boardRef} role="img" aria-label={content.launch.boardLabel}>
          <Canvas ref={canvasRef} aria-hidden="true" />
          <Status role="status">{statusOf(content.launch, snapshot, zoneLabels)}</Status>
        </Board>
        <Controls>
          <LaunchButton
            type="button"
            disabled={!isReady}
            aria-describedby={hint}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onContextMenu={(event) => event.preventDefault()}
            onClick={onClick}
          >
            <FontAwesomeIcon icon={isOrbit ? faArrowRotateLeft : faRocket} aria-hidden="true" />
            {isOrbit ? content.launch.again : content.launch.hold}
          </LaunchButton>
          <Hint id={hint}>{content.launch.hint}</Hint>
        </Controls>
        <Heading>
          <Kicker>{content.kicker}</Kicker>
          <Title>
            <DecodedText text={content.title} isActive={isReached} />
          </Title>
        </Heading>
        <SummaryTitle>{content.summaryTitle}</SummaryTitle>
        <Stats>
          <Stat isDone={objectives[0]}>
            <StatName>
              <StarMark isLit={isLit(0)} aria-hidden="true">
                <FontAwesomeIcon icon={faStar} />
              </StarMark>
              {content.stats.zones}
            </StatName>
            <StatValue isDone={objectives[0]}>{`${zonesVisited}/${zoneCount}`}</StatValue>
          </Stat>
          <Stat isDone={objectives[1]}>
            <StatName>
              <StarMark isLit={isLit(1)} aria-hidden="true">
                <FontAwesomeIcon icon={faStar} />
              </StarMark>
              {content.stats.bosses}
            </StatName>
            <StatValue isDone={objectives[1]}>{`${defeatedBosses}/${bossCount}`}</StatValue>
          </Stat>
          <Stat isDone={objectives[2]}>
            <StatName>
              <StarMark isLit={isLit(2)} aria-hidden="true">
                <FontAwesomeIcon icon={faStar} />
              </StarMark>
              {content.stats.duels}
            </StatName>
            <StatValue isDone={objectives[2]}>{`${duelsWon}/${duelCount}`}</StatValue>
          </Stat>
          <Stat isDone={objectives[3]}>
            <StatName>
              <StarMark isLit={isLit(3)} aria-hidden="true">
                <FontAwesomeIcon icon={faStar} />
              </StarMark>
              {content.stats.character}
            </StatName>
            <StatValue isDone={objectives[3]}>{characterClass ?? content.none}</StatValue>
          </Stat>
          <Stat isDone={objectives[4]}>
            <StatName>
              <StarMark isLit={isLit(4)} aria-hidden="true">
                <FontAwesomeIcon icon={faStar} />
              </StarMark>
              {content.stats.raid}
            </StatName>
            <StatValue isDone={objectives[4]}>{bestScore > 0 ? bestScore : content.notPlayed}</StatValue>
          </Stat>
          <Stat isDone={false}>
            <StatName>
              <StarMark isLit={isLit(5)} aria-hidden="true">
                <FontAwesomeIcon icon={faStar} />
              </StarMark>
              {content.stats.time}
            </StatName>
            <StatValue isDone={false}>{runMs === null ? "0:00" : formatTime(runMs)}</StatValue>
          </Stat>
        </Stats>
        <Rank>
          <RankBadge aria-hidden="true">{content.rankLabel}</RankBadge>
          <RankText>
            <RankName>{`${content.rankLabel}: ${rank.name}`}</RankName>
            <RankMeta>{fill(content.objectives, { done, total: objectives.length })}</RankMeta>
          </RankText>
        </Rank>
        <Mission isLit={isOrbit}>
          <MissionTitle>{content.missionTitle}</MissionTitle>
          <MissionLine>{content.mission}</MissionLine>
        </Mission>
        <Quest>
          <QuestTitle>{content.finalQuest}</QuestTitle>
          <Note>{fill(content.contactNote, { time: contactTime.toLowerCase() })}</Note>
          <Actions>
            <ActionLink href={mailto} isPrimary>
              <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
              {content.emailLabel}
            </ActionLink>
            <ActionLink href={SOCIAL_URLS.linkedIn(linkedInUsername)} target="_blank" rel="noopener noreferrer" isPrimary={false}>
              <FontAwesomeIcon icon={faLinkedinIn} aria-hidden="true" />
              {content.linkedInLabel}
            </ActionLink>
            <ActionLink href={cvUrl} download isPrimary={false}>
              <FontAwesomeIcon icon={faFileArrowDown} aria-hidden="true" />
              {content.cvLabel}
            </ActionLink>
            <Restart type="button" onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}>
              <FontAwesomeIcon icon={faArrowRotateLeft} aria-hidden="true" />
              {content.restartLabel}
            </Restart>
          </Actions>
        </Quest>
      </Panel>
    </Section>
  );
};
