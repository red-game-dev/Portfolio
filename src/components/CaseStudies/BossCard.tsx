import { FC, useId, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faSkull } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Tag, TagList } from "@/components/Controls";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { faTreasureChest } from "@/config/icons";
import useScrollProgressVar from "@/hooks/useScrollProgressVar";
import { fill } from "@/packages/text/format";
import { honourHidden, media } from "@/styles/mixins";
import { CaseStudy } from "@/types/case-studies";
import { BossLabels } from "@/types/game";
import { CaseLabels } from "@/types/lens";

interface BossCardProps extends CaseStudy {
  labels: BossLabels;
  caseLabels: CaseLabels;
}

const DEFEATED_AT = 0.85;

// A case study as a boss encounter: health drains as the reader scrolls through how it was beaten, and
// the rule I kept drops as loot once it is down. Scrolling back up heals it, so the fight plays again; the
// HUD still counts it as defeated. All driven by a CSS variable
// and a data attribute, so scrolling never re-renders the card.
const Card = styled.article(() => [
  tw`relative flex flex-col gap-[12px] p-[20px] md:p-[24px] bg-[#0d0d0d] border-[1px] border-solid border-[#2a1d1d]`,
  css`
    transition: border-color 0.4s ease;

    &[data-done="true"] {
      border-color: var(--accent-muted);
    }

    &[data-done="true"] .hp-fill {
      transform: scaleX(0);
    }

    & .hp-fill {
      transform-origin: left center;
      transform: scaleX(calc(1 - var(--boss-progress, 0)));
      transition: transform 0.15s linear;
    }

    & .stamp,
    & .loot {
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }

    &[data-done="true"] .stamp,
    &[data-done="true"] .loot,
    &[data-game="false"] .loot {
      opacity: 1;
      transform: none;
    }

    ${media.reducedMotion} {
      & .hp-fill,
      & .stamp,
      & .loot {
        transition: none;
      }
    }
  `,
]);

const Header = tw.div`flex flex-row items-center justify-between gap-[10px] flex-wrap`;

const Kind = tw.span`inline-flex flex-row items-center gap-[6px] text-xs font-semibold text-[#ff8a8a]`;

const Area = tw.span`text-xs text-[#999]`;

const Stamp = tw.span`text-xs font-bold text-[var(--accent)] border-[1px] border-solid border-[var(--accent)] rounded-[2px] px-[8px] py-[3px]`;

const Title = tw.h3`m-0 text-lg font-semibold text-white`;

const Health = tw.div`flex flex-row items-center gap-[10px] text-xs text-[#999]`;

const Track = tw.span`relative flex-1 h-[8px] bg-[#1d1414] overflow-hidden`;

const Fill = tw.span`absolute inset-0 bg-[#ff5a5a]`;

const Threat = tw.p`m-0 text-sm text-[#ccc] break-words`;

const Moves = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px] text-sm text-[#aaa]`;

const Move = styled.li(() => [
  tw`relative pl-[22px] break-words`,
  css`
    &::before {
      content: "\\2713";
      position: absolute;
      left: 0;
      top: 0;
      font-weight: 700;
      color: var(--accent);
    }
  `,
]);

const Heading = tw.h4`m-0 text-xs font-semibold text-[#8a8a8a]`;

const Toggle = tw.button`self-start p-0 cursor-pointer text-xs font-semibold text-[var(--accent)] bg-transparent border-0 hover:underline`;

const Solution = styled.div(() => [tw`flex flex-col gap-[8px]`, honourHidden]);

const Loot = tw.div`flex flex-row items-start gap-[10px] p-[12px] text-sm text-[#ffd98c] bg-[#1a1408] border-[1px] border-solid border-[#5c4a26]`;

export const BossCard: FC<BossCardProps> = ({ area, title, summary, points, tags, loot, labels, caseLabels }: BossCardProps) => {
  const cardRef = useRef<HTMLElement>(null);
  const { defeatBoss } = useGameStateHook();
  // Without the game layer the card is a plain case study: no health, no stamp, the rule shown from the start.
  const { lens, settings } = useLensStateHook();
  const isGame = settings.gameLayer;
  // Product readers get the case's shape spelled out; recruiters get the problem and the takeaway, with the
  // moves folded away; engineers get the boss fight as it was.
  const hasHeadings = lens !== "engineer";
  const isFolded = lens === "recruiter";
  const [isOpen, setIsOpen] = useState(false);
  const solutionId = useId();

  useScrollProgressVar(cardRef, "--boss-progress", 0.7, {
    at: DEFEATED_AT,
    onChange: (isDone) => isDone && defeatBoss(title),
  });

  return (
    <Card ref={cardRef} data-game={isGame}>
      <Header>
        <Kind>
          {isGame && <FontAwesomeIcon icon={faSkull} aria-hidden="true" />}
          {isGame ? labels.boss : caseLabels.kind}
        </Kind>
        <Area>{area}</Area>
        {isGame && <Stamp className="stamp" aria-hidden="true">{labels.defeated}</Stamp>}
      </Header>
      <Title>{title}</Title>
      {isGame && (
        <Health aria-hidden="true">
          {labels.hp}
          <Track>
            <Fill className="hp-fill" />
          </Track>
        </Health>
      )}
      {hasHeadings && <Heading>{caseLabels.problem}</Heading>}
      {summary.map((paragraph) => (
        <Threat key={paragraph}>{paragraph}</Threat>
      ))}
      {isFolded && (
        <Toggle type="button" aria-expanded={isOpen} aria-controls={solutionId} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? caseLabels.hideSolution : fill(caseLabels.showSolution, { count: points.length })}
        </Toggle>
      )}
      <Solution id={solutionId} hidden={isFolded && !isOpen}>
        {hasHeadings && <Heading>{caseLabels.decisions}</Heading>}
        <Moves>
          {points.map((point) => (
            <Move key={point}>{point}</Move>
          ))}
        </Moves>
      </Solution>
      <Loot className="loot">
        <FontAwesomeIcon icon={faTreasureChest} aria-hidden="true" />
        <span>
          <strong>{`${hasHeadings ? caseLabels.takeaway : labels.loot}: `}</strong>
          {loot}
        </span>
      </Loot>
      <TagList>
        {tags.map((tag) => (
          <Tag isCompact key={tag}>{tag}</Tag>
        ))}
      </TagList>
    </Card>
  );
};
