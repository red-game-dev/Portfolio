import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { faEnvelope, faGamepad } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { HeroPortrait } from "@/components/Roster/HeroPortrait";
import { Character, Roster } from "@/types/roster";

interface CharacterCardProps extends Character {
  level: number;
  since: number;
  labels: Roster["labels"];
  isRevealed: boolean;
  order: number;
  isSelected: boolean;
  // With the game layer the button picks the character too; without it, it only opens the card.
  isGameLayer: boolean;
  onSelect: (characterClass: string) => void;
}

interface FlipProps {
  isRevealed: boolean;
}

interface SelectedProps {
  isSelected: boolean;
}

const FLIP_STAGGER_MS = 110;

const Card = tw.article`relative`;

// Cards are dealt face down and flip over in turn, like a character select screen. Transform only, and
// the front is always in the document, so assistive tech and crawlers read it either way.
const Inner = styled.div(({ isRevealed }: FlipProps) => [
  tw`relative h-full`,
  css`
    transform-style: preserve-3d;
    transform: perspective(1200px) rotateY(${isRevealed ? 0 : 180}deg);
    transition: transform 0.8s cubic-bezier(0.165, 0.85, 0.45, 1);

    @media (prefers-reduced-motion: reduce) {
      transform: none;
      transition: none;
    }
  `,
]);

const Face = styled.div(({ isSelected }: SelectedProps) => [
  tw`relative h-full flex flex-col gap-[14px] p-[20px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    backface-visibility: hidden;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      border-color: var(--accent-muted);
      box-shadow: 0 0 22px rgba(var(--accent-rgb), 0.12);
    }
  `,
  isSelected && css`
    &,
    &:hover {
      border-color: var(--accent);
      box-shadow: 0 0 28px rgba(var(--accent-rgb), 0.25);
    }
  `,
]);

const Back = styled.div(() => [
  tw`absolute inset-0 flex items-center justify-center bg-[#0d0d0d] border-[1px] border-solid border-[var(--accent-muted)] text-4xl text-[var(--accent-muted)]`,
  css`
    backface-visibility: hidden;
    transform: rotateY(180deg);
    background-image: repeating-linear-gradient(45deg, rgba(var(--accent-rgb), 0.05) 0, rgba(var(--accent-rgb), 0.05) 2px, transparent 2px, transparent 10px);

    @media (prefers-reduced-motion: reduce) {
      display: none;
    }
  `,
]);

const Header = tw.div`flex flex-row items-center gap-[22px]`;

const Portrait = tw.div`relative flex-shrink-0`;

// A hexagon badge, the shape a level takes in most MMOs, pinned to the corner of the portrait.
const LevelBadge = styled.div(() => [
  tw`absolute right-[-12px] bottom-[-10px] z-[1] flex flex-col items-center justify-center w-[42px] h-[46px] bg-[var(--accent)] text-[#101010]`,
  css`
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  `,
]);

const LevelLabel = tw.span`text-[8px] font-semibold leading-none`;

const LevelValue = tw.span`text-lg font-bold leading-none`;

const Identity = tw.div`flex flex-col gap-[4px] min-w-0`;

const ClassName = tw.h3`m-0 flex flex-row items-center gap-[8px] text-lg font-semibold text-white`;

const Meta = tw.span`text-xs text-[#999]`;

const Titles = tw.span`text-xs font-medium text-[var(--accent)]`;

const Stats = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px]`;

const Stat = tw.li`flex flex-col gap-[4px] text-xs text-[#bbb]`;

const StatRow = tw.span`flex flex-row justify-between gap-[10px]`;

const StatValue = tw.span`font-semibold text-white`;

const StatTrack = tw.span`relative block h-[4px] bg-[#1d1d1d] overflow-hidden`;

const StatFill = styled.span(({ isRevealed }: FlipProps) => [
  tw`absolute inset-0 bg-[var(--accent)]`,
  css`
    transform-origin: left center;
    transition: transform 1s cubic-bezier(0.165, 0.85, 0.45, 1) 0.5s;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  !isRevealed && css`transform: scaleX(0) !important;`,
]);

const GroupLabel = tw.h4`m-0 text-xs font-medium text-[#999]`;

const Note = tw.p`m-0 text-sm text-[#bbb] leading-relaxed`;

const Chips = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const Ability = tw.li`text-xs leading-none text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[6px] px-[10px] border-[1px] border-solid
border-[var(--accent-muted)]`;

// Pushed to the bottom of the card, so the buttons line up across a row.
const Select = styled.button(({ isSelected }: SelectedProps) => [
  tw`mt-auto inline-flex flex-row items-center justify-center gap-[8px] h-[38px] px-[14px] cursor-pointer text-sm font-semibold
     text-[var(--accent)] bg-transparent border-[1px] border-solid border-[var(--accent-muted)] rounded-[2px]`,
  css`
    transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--accent);
    }
  `,
  isSelected && tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]`,
]);

export const CharacterCard: FC<CharacterCardProps> = ({
  characterClass, titles = [], icon, hero, stats, abilities, note, level, since, labels, isRevealed, order, isSelected, isGameLayer, onSelect,
}: CharacterCardProps) => (
    <Card>
      <Inner isRevealed={isRevealed} style={{ transitionDelay: `${order * FLIP_STAGGER_MS}ms` }}>
        <Face isSelected={isSelected}>
          <Header>
            <Portrait>
              <HeroPortrait heroId={hero} />
              <LevelBadge role="img" aria-label={`${labels.level} ${level}`}>
                <LevelLabel aria-hidden="true">{labels.level}</LevelLabel>
                <LevelValue aria-hidden="true">{level}</LevelValue>
              </LevelBadge>
            </Portrait>
            <Identity>
              <ClassName>
                <FontAwesomeIcon icon={icon} aria-hidden="true" />
                {characterClass}
              </ClassName>
              {titles.length > 0 && <Titles>{titles.join(", ")}</Titles>}
              <Meta>{`${level} ${labels.years}, ${labels.since} ${since}`}</Meta>
            </Identity>
          </Header>
          <Stats>
            {stats.map((stat) => (
              <Stat key={stat.name}>
                <StatRow>
                  <span>{stat.name}</span>
                  <StatValue>{stat.value}</StatValue>
                </StatRow>
                <StatTrack aria-hidden="true">
                  <StatFill isRevealed={isRevealed} style={{ transform: `scaleX(${stat.value / 100})` }} />
                </StatTrack>
              </Stat>
            ))}
          </Stats>
          <GroupLabel>{labels.abilities}</GroupLabel>
          <Chips>
            {abilities.map((ability) => (
              <Ability key={ability}>{ability}</Ability>
            ))}
          </Chips>
          {note && <Note>{note}</Note>}
          <Select type="button" isSelected={isSelected} aria-haspopup="dialog" onClick={() => onSelect(characterClass)}>
            <FontAwesomeIcon icon={isGameLayer ? faGamepad : faEnvelope} aria-hidden="true" />
            {!isGameLayer ? labels.hire : isSelected ? labels.playing : `${labels.play} ${characterClass}`}
          </Select>
        </Face>
        <Back aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </Back>
      </Inner>
    </Card>
  );
