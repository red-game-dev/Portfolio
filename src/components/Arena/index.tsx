import { FC, useCallback, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faHeart } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useBugRaid } from "@/components/Arena/hooks/useBugRaid";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { Panel } from "@/components/Panel";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import { BugRaidSnapshot, DEFAULT_BUG_RAID_CONFIG } from "@/packages/games/bug-raid";
import { ArenaContent } from "@/types/game";
import { SectionIntros } from "@/types/sections-intros";

interface ArenaProps {
  intro: SectionIntros;
  content: ArenaContent;
}

interface HeartProps {
  isLost: boolean;
}

const LIVES = DEFAULT_BUG_RAID_CONFIG.lives;

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Stats = tw.dl`m-0 mb-[14px] grid grid-cols-2 md:grid-cols-4 gap-[10px]`;

const Stat = tw.div`flex flex-col gap-[4px] p-[10px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const StatName = tw.dt`text-xs text-[#999]`;

const StatValue = tw.dd`m-0 flex flex-row items-center gap-[4px] text-lg font-semibold text-white`;

const Heart = styled.span(({ isLost }: HeartProps) => [
  tw`text-[#ff5a5a]`,
  isLost && tw`text-[#333]`,
]);

const Board = styled.div(() => [
  tw`relative w-full h-[320px] md:h-[380px] overflow-hidden border-[1px] border-solid border-[var(--accent-muted)] outline-none`,
  css`
    cursor: crosshair;
    touch-action: manipulation;

    &:focus-visible {
      box-shadow: 0 0 0 2px var(--accent);
    }
  `,
]);

const Canvas = tw.canvas`absolute inset-0 w-full h-full`;

const Overlay = tw.div`absolute inset-0 z-[2] flex flex-col items-center justify-center gap-[12px] p-[20px] text-center bg-[rgba(13, 13, 13, 0.82)]`;

const OverlayTitle = tw.p`m-0 text-lg font-semibold text-white`;

const OverlayText = tw.p`m-0 text-sm text-[#bbb]`;

const NewBest = tw.span`text-xs font-bold text-[#101010] bg-[var(--accent)] rounded-[2px] px-[8px] py-[3px]`;

const Action = styled.button(() => [
  tw`inline-flex flex-row items-center h-[40px] px-[18px] cursor-pointer text-sm font-semibold text-[#101010] bg-[var(--accent)] border-0 rounded-[2px]`,
  css`
    transition: filter 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
    }
  `,
]);

const Hint = tw.p`m-0 mt-[12px] text-xs text-[#999] max-w-[70ch]`;

const ReadableText = tw.span`sr-only`;

const Announcer = tw.p`sr-only`;

// A playable break between sections, built on the games/bug-raid package. The best score is kept per
// browser through the game state.
export const Arena: FC<ArenaProps> = ({ intro, content }: ArenaProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { bestScore, recordScore } = useGameStateHook();
  const [isNewBest, setIsNewBest] = useState(false);
  const onChange = useCallback((next: BugRaidSnapshot) => {
    if (next.status === "over") {
      setIsNewBest(next.score > bestScore);
      recordScore(next.score);
    }
  }, [bestScore, recordScore]);
  const { snapshot, isPaused, play, resume, onPointerDown, onKeyDown } = useBugRaid(boardRef, canvasRef, {
    productionLabel: content.production,
    onChange,
  });
  const status = snapshot?.status ?? "ready";
  const livesLeft = snapshot?.lives ?? LIVES;
  const hint = `${SECTION_IDS.arena}-hint`;

  return (
    <Section id={SECTION_IDS.arena}>
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Panel>
        <Stats>
          <Stat>
            <StatName>{content.score}</StatName>
            <StatValue>{snapshot?.score ?? 0}</StatValue>
          </Stat>
          <Stat>
            <StatName>{content.lives}</StatName>
            <StatValue>
              <ReadableText>{livesLeft}</ReadableText>
              {Array.from({ length: LIVES }, (_, index) => (
                <Heart key={index} isLost={index >= livesLeft} aria-hidden="true">
                  <FontAwesomeIcon icon={faHeart} />
                </Heart>
              ))}
            </StatValue>
          </Stat>
          <Stat>
            <StatName>{content.wave}</StatName>
            <StatValue>{snapshot?.wave ?? 1}</StatValue>
          </Stat>
          <Stat>
            <StatName>{content.best}</StatName>
            <StatValue>{bestScore}</StatValue>
          </Stat>
        </Stats>
        <Board
          ref={boardRef}
          tabIndex={0}
          role="group"
          aria-label={content.boardLabel}
          aria-describedby={hint}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
        >
          <Canvas ref={canvasRef} aria-hidden="true" />
          {status === "ready" && (
            <Overlay>
              <OverlayText>{content.ready}</OverlayText>
              <Action type="button" onClick={play}>{content.start}</Action>
            </Overlay>
          )}
          {status === "over" && (
            <Overlay>
              <OverlayTitle>{content.over}</OverlayTitle>
              <OverlayText>{`${content.score} ${snapshot?.score ?? 0}`}</OverlayText>
              {isNewBest && <NewBest>{content.newBest}</NewBest>}
              <Action type="button" onClick={play}>{content.again}</Action>
            </Overlay>
          )}
          {status === "playing" && isPaused && (
            <Overlay>
              <OverlayText>{content.paused}</OverlayText>
              <Action type="button" onClick={resume}>{content.resume}</Action>
            </Overlay>
          )}
        </Board>
        <Hint id={hint}>{content.hint}</Hint>
        <Announcer aria-live="polite">{status === "over" ? `${content.over}. ${content.score} ${snapshot?.score ?? 0}` : ""}</Announcer>
      </Panel>
    </Section>
  );
};
