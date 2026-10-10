import { FC, useCallback, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faArrowRotateLeft, faEnvelope, faFileArrowDown, faRocket, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton, ActionLink, actionStyle } from "@/components/Controls";
import { DecodedText } from "@/components/DecodedText";
import { useInvite } from "@/components/Finale/hooks/useInvite";
import { useLaunch } from "@/components/Finale/hooks/useLaunch";
import { INVITE_SECONDS } from "@/components/Finale/invite";
import { LazyVoyageDialog } from "@/components/Finale/Voyage/LazyVoyageDialog";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { Panel } from "@/components/Panel";
import { Section } from "@/components/Section";
import { SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { CROSSED_ZONES, ZONE_BOUNDARIES, ZoneId } from "@/config/zones";
import useFocusLeave from "@/hooks/useFocusLeave";
import useInView from "@/hooks/useInView";
import { scrollBehavior } from "@/packages/accessibility/motion";
import type { LaunchSnapshot } from "@/packages/games/launch";
import { fill, formatDuration, formatLocalTime } from "@/packages/text/format";
import { focusRing, noAnimationWhenReduced } from "@/styles/mixins";
import { FinaleContent, FinaleLaunch, FinaleLaunchSite, FinaleRank } from "@/types/game";
import { DocumentLink } from "@/types/portfolio";
import { PreferencesContent } from "@/types/preferences";

interface FinaleProps {
  content: FinaleContent;
  zoneLabels: Record<ZoneId, string>;
  contactTime: string;
  fullResume: DocumentLink;
  bossCount: number;
  duelCount: number;
  email: string;
  linkedInUsername: string;
  cvUrl: string;
  // The reader's settings, offered in the voyage's hangar.
  settings: PreferencesContent;
}

const shake = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 1px); }
  50% { transform: translate(2px, -1px); }
  75% { transform: translate(-1px, -2px); }
`;

const Board = styled.div(({ isAlarm }: { isAlarm: boolean }) => [
  tw`relative h-[220px] md:h-[280px] overflow-hidden border-[1px] border-solid border-[var(--accent-muted)]`,
  isAlarm && css`
    animation: ${shake} 0.16s linear infinite;

    ${noAnimationWhenReduced}
  `,
]);

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

// In orbit: would the reader like to play? The first time, with a count before the journey goes on by itself.
const Choice = tw.div``;

const Ask = tw.div`flex flex-col gap-[4px] mt-[18px]`;

const AskTitle = tw.h3`m-0 text-lg font-semibold text-white`;

// The big red button of every film: a domed cap on a striped hazard plate, pressed in when held.
const RedButton = styled.button(() => [
  tw`flex flex-row items-center gap-[12px] p-0 bg-transparent border-0 cursor-pointer text-sm font-semibold text-white`,
  css`
    ${focusRing("var(--accent)", 4)}

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }

    &:active:not(:disabled) .cap {
      transform: translateY(3px);
      box-shadow: 0 1px 0 #5a0710;
    }
  `,
]);

const Plate = styled.span(() => [
  tw`flex items-center justify-center w-[58px] h-[58px] rounded-[10px]`,
  css`
    background: repeating-linear-gradient(45deg, #ffcc33 0 6px, #1a1a1a 6px 12px);
  `,
]);

const Cap = styled.span(() => [
  tw`block w-[42px] h-[42px] rounded-full`,
  css`
    background: radial-gradient(circle at 35% 30%, #ff9a9a, #e01b2c 55%, #7d0a14 100%);
    box-shadow: 0 4px 0 #5a0710;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  `,
]);

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

const Heading = tw.div`flex flex-col gap-[6px] mb-[18px]`;

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

// What the board says, and what a screen reader hears, at each moment of the launch: the pad and its local time
// while it waits, ignition, then each moment of the flight as a zone falls behind, and orbit.
const statusOf = (launch: FinaleLaunch, { status, passed, countdown, milestone }: LaunchSnapshot, zoneLabels: Record<ZoneId, string>, site: FinaleLaunchSite | null) => {
  if (status === "ready") {
    return site ? fill(launch.pad, { site: site.name, time: formatLocalTime(site.timeZone) }) : "";
  }

  if (status === "charging") {
    return launch.charging;
  }

  if (status === "destructing") {
    return fill(launch.countdown, { seconds: countdown });
  }

  if (status === "exploding") {
    return launch.boom;
  }

  if (status === "launching") {
    return passed > 0 && milestone ? fill(launch.leaving, { milestone: launch.milestones[milestone], zone: zoneLabels[CROSSED_ZONES[passed - 1]] }) : launch.liftOff;
  }

  return status === "orbit" ? launch.orbit : "";
};

// The end of the run, and the page lifting off: the visitor launches out of the game world past every zone
// they crossed, their run lights up as stars on the way, and the journey closes on where I want to go next,
// with one last quest: get in touch.
export const Finale: FC<FinaleProps> = ({
  content, zoneLabels, contactTime, bossCount, duelCount, email, linkedInUsername, cvUrl, fullResume, settings,
}: FinaleProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isBoardInView = useInView(boardRef, { threshold: 0.6, once: true });
  const { snapshot, site, isReady, press, selfDestruct } = useLaunch(boardRef, canvasRef, isBoardInView, content.launch.sites, content.launch.readout);
  const isReached = useInView(sectionRef, { threshold: 0.2 });
  const { zonesVisited, defeatedBosses, duelsWon, characterClass, bestScore, voyageBest, recordVoyage } = useGameStateHook();
  const [isVoyaging, setIsVoyaging] = useState(false);
  const [runMs, setRunMs] = useState<number | null>(null);
  // Whether the board is on screen now, not just once, so the count before the journey goes on by itself only
  // runs while the ship can be seen.
  const isBoardShown = useInView(boardRef, { threshold: 0.6, once: false });
  const openVoyage = useCallback(() => setIsVoyaging(true), []);
  // Focus on the choice in orbit holds the count, so a keyboard reader is never rushed while deciding. Whatever
  // held focus before orbit (the launch button) is gone by then, so reaching or leaving orbit starts afresh.
  const [isChoosing, setIsChoosing] = useState(false);
  const onChoiceBlur = useFocusLeave(() => setIsChoosing(false));
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
  // In orbit, or blowing up there: the choices of what to do next stay on screen.
  const isAloft = isOrbit || snapshot.status === "destructing" || snapshot.status === "exploding";
  const invite = useInvite({ isOrbit, isInView: isBoardShown, isOpen: isVoyaging, isChoosing, open: openVoyage });
  const isCounting = invite.count !== null;

  useEffect(() => {
    setIsChoosing(false);
  }, [isAloft]);
  const isOnPad = snapshot.status === "ready" || snapshot.status === "charging";
  // One star per stat, lit as each zone falls behind, the last one in orbit.
  const isLit = (index: number) => isOrbit || snapshot.passed > index;
  const hint = `${SECTION_IDS.finale}-hint`;
  const rank = rankFor(content.ranks, done);
  const body = fill(content.emailBody, { rank: rank.name, bosses: `${defeatedBosses}/${bossCount}`, duels: `${duelsWon}/${duelCount}` });
  const mailto = `mailto:${email}?subject=${encodeURIComponent(content.emailSubject)}&body=${encodeURIComponent(body)}`;

  return (
    <Section id={SECTION_IDS.finale} ref={sectionRef}>
      <Panel>
        <Heading>
          <Kicker>{content.kicker}</Kicker>
          <Title>
            <DecodedText text={content.title} isActive={isReached} />
          </Title>
        </Heading>
        <Board ref={boardRef} role="img" aria-label={content.launch.boardLabel} isAlarm={snapshot.status === "destructing"}>
          <Canvas ref={canvasRef} aria-hidden="true" />
          <Status role="status">{statusOf(content.launch, snapshot, zoneLabels, site)}</Status>
        </Board>
        <Choice onFocus={() => setIsChoosing(isAloft)} onBlur={onChoiceBlur}>
          {isAloft && (
            <Ask>
              <AskTitle>{content.launch.invite.question}</AskTitle>
              {isCounting && <Hint role="status">{fill(content.launch.invite.starting, { seconds: INVITE_SECONDS })}</Hint>}
            </Ask>
          )}
          <Controls>
            {isAloft ? (
              <>
                <ActionButton type="button" isPrimary disabled={!isOrbit} onClick={invite.accept}>
                  <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                  {isCounting ? fill(content.launch.invite.playIn, { seconds: invite.count ?? 0 }) : content.launch.invite.play}
                </ActionButton>
                {isCounting && (
                  <ActionButton type="button" isPrimary={false} onClick={invite.decline}>
                    {content.launch.invite.decline}
                  </ActionButton>
                )}
                <RedButton type="button" disabled={!isOrbit} aria-describedby={hint} onClick={selfDestruct}>
                  <Plate aria-hidden="true">
                    <Cap className="cap" />
                  </Plate>
                  {content.launch.doNotPress}
                </RedButton>
                <Hint id={hint}>{content.launch.orbitHint}</Hint>
              </>
            ) : (
              <>
                <LaunchButton
                  type="button"
                  disabled={!isReady || !isOnPad}
                  aria-describedby={hint}
                  onPointerDown={press.onPointerDown}
                  onPointerUp={press.onPointerUp}
                  onPointerCancel={press.onPointerCancel}
                  onContextMenu={press.onContextMenu}
                  onClick={press.onClick}
                >
                  <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                  {content.launch.hold}
                </LaunchButton>
                <Hint id={hint}>{content.launch.hint}</Hint>
              </>
            )}
          </Controls>
        </Choice>
        {isVoyaging && (
          <LazyVoyageDialog
            content={content.voyage}
            universes={CROSSED_ZONES.map((zone) => zoneLabels[zone])}
            best={voyageBest}
            home={site ? { name: site.name, latitude: site.latitude, longitude: site.longitude, ground: site.land } : null}
            settings={settings}
            onRecord={recordVoyage}
            onClose={() => setIsVoyaging(false)}
          />
        )}
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
            <StatValue isDone={false}>{formatDuration((runMs ?? 0) / 1000)}</StatValue>
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
            <ActionLink href={fullResume.url} download isPrimary={false}>
              <FontAwesomeIcon icon={faFileArrowDown} aria-hidden="true" />
              {fullResume.label}
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
