import { forwardRef, useMemo } from "react";

import tw, { css, styled } from "twin.macro";

import { faGamepad, faSkull } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { SECTION_IDS } from "@/config/sections";
import { TenureCalculator } from "@/packages/insights/career";
import { HudLabels } from "@/types/game";
import { Roster } from "@/types/roster";

export interface HudContent {
  roster: Roster;
  labels: HudLabels;
  bossCount: number;
}

interface HudProps extends HudContent {
  isVisible: boolean;
}

interface VisibleProps {
  isVisible: boolean;
}

// Only where the left margin is wide enough to hold it without covering a section.
const Frame = styled.div(({ isVisible }: VisibleProps) => [
  tw`fixed left-[20px] bottom-[20px] z-[10] hidden xl:flex flex-row items-center gap-[12px] w-[230px] p-[12px] bg-[rgba(13, 13, 13, 0.92)]
     border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
    transition: opacity 0.4s ease, transform 0.4s ease, visibility 0s linear 0.4s;

    @media (prefers-reduced-motion: reduce) {
      transform: none;
      transition: none;
    }
  `,
  isVisible && css`
    opacity: 1;
    visibility: visible;
    transform: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
  `,
]);

const Avatar = styled.span(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[46px] h-[52px] text-xl text-[#101010] bg-[var(--accent)]`,
  css`
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  `,
]);

const Stats = tw.div`flex flex-col gap-[6px] min-w-0 flex-1`;

const Name = tw.span`text-sm font-semibold text-white truncate`;

const PickLink = tw.a`text-sm font-semibold text-[var(--accent)] no-underline hover:underline`;

const Row = tw.span`flex flex-row items-center justify-between gap-[8px] text-[11px] text-[#999]`;

const Track = tw.span`relative block h-[5px] bg-[#1d1d1d] overflow-hidden`;

// Scaled, not resized, so following the scroll never triggers layout.
const Fill = styled.span(() => [
  tw`absolute inset-0 bg-[var(--accent)]`,
  css`
    transform-origin: left center;
    transform: scaleX(var(--journey-experience, 0));
    will-change: transform;
  `,
]);

const Bosses = tw.span`inline-flex flex-row items-center gap-[5px] text-[#ff8a8a]`;

// A game HUD for the MMO zone: the reader's character, its level, experience earned by reading on, and the
// bosses beaten so far. The experience bar follows --journey-experience, written on the HUD by useJourney.
export const Hud = forwardRef<HTMLDivElement, HudProps>(({ roster, labels, bossCount, isVisible }, ref) => {
  const { characterClass, defeatedBosses } = useGameStateHook();
  const calculator = useMemo(() => new TenureCalculator(roster.asOf), [roster.asOf]);
  const character = roster.characters.find((candidate) => candidate.characterClass === characterClass);
  const level = character ? Math.max(1, calculator.years(character.tenures)) : null;

  return (
    <Frame ref={ref} isVisible={isVisible}>
      <Avatar aria-hidden="true">
        <FontAwesomeIcon icon={character?.icon ?? faGamepad} />
      </Avatar>
      <Stats>
        {character ? (
          <Name>{character.characterClass}</Name>
        ) : (
          <PickLink href={`#${SECTION_IDS.roster}`}>{labels.pick}</PickLink>
        )}
        <Row>
          <span>{level === null ? labels.xp : `${labels.level} ${level}`}</span>
          <Bosses title={labels.bosses}>
            <FontAwesomeIcon icon={faSkull} aria-hidden="true" />
            {`${defeatedBosses}/${bossCount}`}
          </Bosses>
        </Row>
        <Track aria-hidden="true">
          <Fill />
        </Track>
      </Stats>
    </Frame>
  );
});

Hud.displayName = "Hud";
