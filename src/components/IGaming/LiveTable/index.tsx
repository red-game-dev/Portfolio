import { CSSProperties, FC, MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Dealer } from "@/components/IGaming/LiveTable/Dealer";
import { CARD_WIDTH, fanStep, isSpineStep } from "@/components/IGaming/LiveTable/fan";
import useLiveTable from "@/components/IGaming/LiveTable/useLiveTable";
import { Corner, CornerBottom, PlayingCard, suitOf } from "@/components/IGaming/PlayingCard";
import useSize from "@/hooks/useSize";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { DEFAULT_LIVE_TABLE_CONFIG } from "@/packages/games/live-table";
import { fill } from "@/packages/text/format";
import { media } from "@/styles/mixins";
import { DomainCapability, LiveTableContent } from "@/types/domains";

interface LiveTableProps {
  cards: DomainCapability[];
  content: LiveTableContent;
}

const THROW_MS = 520;
const PHASE_MS = Object.fromEntries(DEFAULT_LIVE_TABLE_CONFIG.phases.map(({ phase, ms }) => [phase, ms]));

const Board = tw.div`relative flex flex-col gap-[22px] px-[12px] md:px-[56px] pt-[14px] pb-[22px] overflow-hidden rounded-[18px] min-h-[560px]`;

const Felt = tw.canvas`absolute inset-0 w-full h-full pointer-events-none`;

const Layer = tw.div`relative z-[1] flex flex-col gap-[10px]`;

// On a phone the other players' cards sit right behind the words, so the words carry a dark plate of their own.
const Label = styled.h3(() => [
  tw`m-0 self-start text-xs font-semibold text-[rgba(255, 255, 255, 0.7)]`,
  css`
    ${media.narrowTable} {
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(6, 26, 16, 0.78);
    }
  `,
]);

const Played = tw.ul`list-none m-0 p-0 grid gap-[14px] sm:grid-cols-2 lg:grid-cols-3`;

const Slot = tw.li`min-w-0`;

const Empty = styled.p(() => [
  tw`m-0 flex items-center justify-center h-[120px] text-sm text-[rgba(255, 255, 255, 0.75)] rounded-[10px]`,
  css`
    border: 1px dashed rgba(255, 255, 255, 0.25);
  `,
]);

const Hint = styled.p(() => [
  tw`m-0 text-sm text-[rgba(255, 255, 255, 0.75)] max-w-[60ch]`,
  css`
    ${media.narrowTable} {
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(6, 26, 16, 0.78);
    }
  `,
]);

// A fan where the whole hand fits with strips wide enough to read (data-fan, with --step how far each card tucks under
// the one before), each card tilted by its --tilt; a row to swipe through everywhere else.
const Hand = styled.ul(() => [
  tw`list-none m-0 p-0 pt-[18px] pb-[6px] flex flex-row overflow-x-auto`,
  css`
    scrollbar-width: thin;

    & > li {
      flex-shrink: 0;
      margin-right: 8px;
    }

    &[data-fan] {
      justify-content: center;
      overflow: visible;
    }

    &[data-fan] > li {
      margin-right: 0;
      transform: rotate(var(--tilt)) translateY(var(--drop));
    }

    &[data-fan] > li + li {
      margin-left: var(--step);
    }

    /* Only a strip of each card shows under the next, so its name wraps inside that strip, or on a strip too thin for
       that runs up it. */
    &[data-fan] > li:not(:last-child) [data-name] {
      max-width: calc(${CARD_WIDTH}px + var(--step) - 8px);
    }

    &[data-spine] > li:not(:last-child) [data-name] {
      max-width: none;
      max-height: 104px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }
  `,
]);

const HandCard = styled.button(({ isLocked }: { isLocked: boolean }) => [
  tw`relative flex flex-col justify-start w-[112px] h-[156px] px-[10px] pt-[34px] cursor-pointer text-left text-[#1a1a1a] bg-[#f4efe6] rounded-[10px]
     border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]`,
  css`
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.5);
    transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.2s ease;

    &:hover,
    &:focus-visible {
      transform: translateY(-16px);
      box-shadow: 0 16px 26px rgba(0, 0, 0, 0.55), 0 0 0 2px var(--accent);
      outline: none;
    }
  `,
  isLocked && css`
    filter: saturate(0.4) brightness(0.8);
    cursor: not-allowed;
  `,
]);

// Long words break with a hyphen where the language allows, never mid syllable.
const HandName = styled.span(() => [
  tw`text-[12px] font-bold leading-tight`,
  css`
    hyphens: auto;
    overflow-wrap: normal;
  `,
]);

const Redeal = styled.button(() => [
  tw`self-center inline-flex flex-row items-center gap-[8px] h-[38px] px-[16px] cursor-pointer text-sm font-semibold text-[#101010] bg-[var(--accent)]
     border-0 rounded-[2px]`,
]);

const Status = tw.p`sr-only`;

const AllCards = tw.ul`sr-only`;

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-8px) rotate(-3deg)" },
  { transform: "translateX(8px) rotate(3deg)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(0)" },
];

// A card thrown from the hand: it flies from where it was held to its place on the felt, spinning down.
const ThrownCard: FC<{ card: DomainCapability; suitIndex: number; from?: DOMRect }> = ({ card, suitIndex, from }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element || !from || prefersReducedMotion()) {
      return;
    }

    const to = element.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);

    element.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(-18deg) scale(${from.width / Math.max(1, to.width)})`, opacity: 0.9 },
        { transform: "translate(0, -18px) rotate(6deg) scale(1.04)", opacity: 1, offset: 0.7 },
        { transform: "none", opacity: 1 },
      ],
      { duration: THROW_MS, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
    );
  }, [from]);

  return <PlayingCard ref={ref} card={card} suitIndex={suitIndex} />;
};

// The iGaming cards as a live table: the hand is yours, and the dealer only takes a card while bets are
// open. Other players throw theirs face down on the felt (the canvas), and every card you throw lands face
// up, so the table fills with what I have built. Every card stays in the page for search and screen readers.
export const LiveTable: FC<LiveTableProps> = ({ cards, content }: LiveTableProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handRef = useRef<HTMLUListElement>(null);
  const handAreaRef = useRef<HTMLDivElement>(null);
  const { width: handWidth } = useSize(handAreaRef);
  const names = useMemo(() => cards.map((card) => card.name), [cards]);
  const byName = useMemo(() => new Map(cards.map((card, index) => [card.name, { card, index }])), [cards]);
  const { snapshot, play, redeal, isRunning } = useLiveTable(boardRef, canvasRef, names);
  const throwsFrom = useRef(new Map<string, DOMRect>());
  const [message, setMessage] = useState("");
  const focusAt = useRef<number | null>(null);
  const isOpen = snapshot.phase === "place" || snapshot.phase === "final";
  const step = fanStep(handWidth, snapshot.hand.length);

  // After a throw, focus moves to the card that took its place, or to the button that picks them back up.
  useEffect(() => {
    if (focusAt.current === null) {
      return;
    }

    const buttons = handRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const target = buttons?.[Math.min(focusAt.current, buttons.length - 1)] ?? boardRef.current?.querySelector<HTMLButtonElement>("[data-redeal]");

    target?.focus({ preventScroll: true });
    focusAt.current = null;
  }, [snapshot.hand]);

  const throwCard = (event: MouseEvent<HTMLButtonElement>, name: string, position: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const result = play(name);

    if (result.accepted) {
      throwsFrom.current.set(name, rect);
      focusAt.current = position;
      setMessage(fill(content.placed, { card: name }));

      return;
    }

    setMessage(content.refused);

    if (!prefersReducedMotion()) {
      event.currentTarget.animate(SHAKE, { duration: 380, easing: "ease-out" });
    }
  };

  return (
    <>
      <Board ref={boardRef}>
        <Felt ref={canvasRef} aria-hidden="true" />
        <Dealer
          phrase={content.phrases[snapshot.phase]}
          phraseKey={`${snapshot.round}-${snapshot.phase}`}
          outfitLabels={content.outfits}
          changeLabel={content.dealerLabel}
          roundLabel={fill(content.roundLabel, { n: snapshot.round })}
          phaseMs={PHASE_MS[snapshot.phase] ?? 0}
          isClosed={!isOpen}
          isRunning={isRunning}
        />
        <Layer>
          <Label>{content.tableLabel}</Label>
          {snapshot.played.length === 0 ? <Empty>{content.emptyTable}</Empty> : (
            <Played>
              {snapshot.played.map((name) => {
                const entry = byName.get(name);

                return entry && (
                  <Slot key={name}>
                    <ThrownCard card={entry.card} suitIndex={entry.index} from={throwsFrom.current.get(name)} />
                  </Slot>
                );
              })}
            </Played>
          )}
        </Layer>
        <Layer ref={handAreaRef}>
          <Hint>{content.hint}</Hint>
          <Label>{content.handLabel}</Label>
          {snapshot.hand.length > 0 ? (
            <Hand
              ref={handRef}
              data-scroll-x
              data-fan={step === null ? undefined : true}
              data-spine={step !== null && isSpineStep(step) ? true : undefined}
              style={step === null ? undefined : ({ "--step": `${step}px` } as CSSProperties)}
            >
              {snapshot.hand.map((name, position) => {
                const entry = byName.get(name);
                const suit = suitOf(entry?.index ?? 0);
                const tilt = (position - (snapshot.hand.length - 1) / 2) * 2.4;

                return (
                  <li key={name} style={{ "--tilt": `${tilt}deg`, "--drop": `${Math.abs(tilt) * 1.6}px` } as CSSProperties}>
                    <HandCard type="button" isLocked={!isOpen} aria-disabled={!isOpen} onClick={(event) => throwCard(event, name, position)}>
                      <Corner isRed={suit.isRed} aria-hidden="true">{suit.glyph}</Corner>
                      <HandName data-name>{name}</HandName>
                      <CornerBottom isRed={suit.isRed} aria-hidden="true">{suit.glyph}</CornerBottom>
                    </HandCard>
                  </li>
                );
              })}
            </Hand>
          ) : (
            <Redeal type="button" data-redeal onClick={redeal}>
              <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
              {content.redeal}
            </Redeal>
          )}
        </Layer>
        <Status aria-live="polite">{message}</Status>
      </Board>
      <AllCards aria-label={content.cardsLabel}>
        {cards.map((card) => (
          <li key={card.name}>{`${card.name}: ${card.detail} ${card.places.join(", ")}`}</li>
        ))}
      </AllCards>
    </>
  );
};
