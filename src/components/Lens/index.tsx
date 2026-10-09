import { FC, KeyboardEvent, SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import dynamic from "next/dynamic";

import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";
import { ENTRANCE_TIMING } from "@/components/Lens/config";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import { LensCard } from "@/components/Lens/LensCard";
import { loadEntrance } from "@/components/Lens/loaders";
import { DEFAULT_LENS, Lens } from "@/config/lenses";
import useModalDialog from "@/hooks/useModalDialog";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { rovingTarget } from "@/packages/accessibility/roving";
import { EntranceCandidate, LensContent } from "@/types/lens";

interface LensGateProps {
  content: LensContent;
  counts: { zones: number; bosses: number };
  candidate: EntranceCandidate;
}

interface LeavingProps {
  lens: Lens;
  isLeaving: boolean;
}

const Entrance = dynamic(() => loadEntrance().then((module) => module.Entrance), { ssr: false });

const CHOOSER_TITLE_ID = "lens-chooser-title";

const EXIT = `${ENTRANCE_TIMING.exitMs}ms cubic-bezier(0.7, 0, 0.2, 1) forwards`;

const fadeOut = keyframes`
  to { opacity: 0; }
`;

// An old monitor switching off: squeezed to a bright line, then to a point.
const powerOff = keyframes`
  0% { transform: none; filter: none; opacity: 1; }
  45% { transform: scale(1, 0.006); filter: brightness(3); opacity: 1; }
  80% { transform: scale(0, 0.006); filter: brightness(4); opacity: 1; }
  100% { transform: scale(0, 0); opacity: 0; }
`;

const openUp = keyframes`
  to { transform: translateY(-100%); }
`;

const openDown = keyframes`
  to { transform: translateY(100%); }
`;

// Full screen and see through: the doors inside are what hide the page, so they can open onto it.
const Dialog = styled.dialog(() => [
  tw`fixed inset-0 w-full h-full max-w-[none] max-h-[none] m-0 p-0 border-0 overflow-hidden bg-transparent text-[#ccc]`,
  css`
    &::backdrop {
      background: transparent;
    }
  `,
]);

const Shell = styled.div(({ lens, isLeaving }: LeavingProps) => [
  tw`absolute inset-0`,
  isLeaving && lens === "recruiter" && css`
    animation: ${fadeOut} ${EXIT};
  `,
  isLeaving && lens === "engineer" && css`
    animation: ${powerOff} ${EXIT};
  `,
  css`
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
]);

const Door = styled.div(({ side, lens, isLeaving }: LeavingProps & { side: "top" | "bottom" }) => [
  tw`absolute left-0 right-0 h-1/2 bg-[#101010]`,
  side === "top" ? tw`top-0` : tw`bottom-0`,
  isLeaving && lens === "product" && css`
    animation: ${side === "top" ? openUp : openDown} ${EXIT};
  `,
]);

const Screen = styled.div(({ lens, isLeaving }: LeavingProps) => [
  tw`absolute inset-0 overflow-y-auto`,
  css`
    overscroll-behavior: contain;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0) 60%),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.015) 0 1px, transparent 1px 3px);
  `,
  isLeaving && lens === "product" && css`
    animation: ${fadeOut} ${ENTRANCE_TIMING.exitMs / 3}ms ease-out forwards;
  `,
]);

const Chooser = tw.div`flex flex-col items-center gap-[22px] md:gap-[34px] min-h-full px-[16px] py-[32px] md:px-[40px] md:py-[56px] lg:justify-center`;

const Heading = tw.div`flex flex-col items-center gap-[10px] max-w-[640px] text-center`;

const Title = tw.h2`m-0 text-2xl md:text-4xl font-semibold text-white`;

const Description = tw.p`m-0 text-sm md:text-base text-[#aaa]`;

const Cards = tw.div`grid gap-[12px] md:gap-[20px] w-full max-w-[1080px] md:grid-cols-3`;

// Before the page: the reader picks who they are, like a character select, and that view's entrance plays.
// Returning readers and ?view= links never see this; the header switch changes the view from then on.
export const LensGate: FC<LensGateProps> = ({ content, counts, candidate }: LensGateProps) => {
  const { lens, switchLens } = useLensStateHook();
  const { status, chooseLens, finishEntrance } = useLensStatusHook();
  const { isLoading } = useAppLoaderStateHook();
  const [isLeaving, setIsLeaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = !isLoading && (status === "choosing" || status === "entering");

  useEffect(() => {
    if (status === "choosing") {
      void loadEntrance();
    }
  }, [status]);

  // The page waits, still, behind the chooser and the entrance.
  useModalDialog(dialogRef, isOpen);

  useEffect(() => {
    if (!isLeaving) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsLeaving(false);
      finishEntrance();
    }, prefersReducedMotion() ? 0 : ENTRANCE_TIMING.exitMs);

    return () => window.clearTimeout(timeout);
  }, [finishEntrance, isLeaving]);

  const leave = useCallback(() => setIsLeaving(true), []);

  // Escape skips the choice and opens the full page, which is what the site shows by default.
  const skip = useCallback((event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();

    if (status === "choosing") {
      switchLens(DEFAULT_LENS);
      finishEntrance();
    }
  }, [finishEntrance, status, switchLens]);

  // The browser may close the dialog itself (a second Escape in a row cannot be cancelled), so a close the
  // gate did not ask for still lands the reader on the page instead of behind a hidden, scroll locked overlay.
  const onClose = useCallback(() => {
    if (status === "choosing") {
      switchLens(DEFAULT_LENS);
    }

    if (status === "choosing" || status === "entering") {
      setIsLeaving(false);
      finishEntrance();
    }
  }, [finishEntrance, status, switchLens]);

  // Arrow keys move between the cards and wrap, as on a game's select screen. Home and End stay the browser's.
  const moveFocus = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    const cards = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("[data-lens-card]") ?? []);
    const next = rovingTarget(event.key, cards.indexOf(event.currentTarget), cards.length, { ends: false });

    if (next === null) {
      return;
    }

    event.preventDefault();
    cards[next].focus();
  }, []);

  return (
    <Dialog
      ref={dialogRef}
      onCancel={skip}
      onClose={onClose}
      aria-labelledby={status === "choosing" ? CHOOSER_TITLE_ID : undefined}
      aria-label={status === "choosing" ? undefined : content.names[lens]}
    >
      {isOpen && (
        <Shell lens={lens} isLeaving={isLeaving}>
          <Door side="top" lens={lens} isLeaving={isLeaving} />
          <Door side="bottom" lens={lens} isLeaving={isLeaving} />
          <Screen lens={lens} isLeaving={isLeaving}>
            {status === "choosing" ? (
              <Chooser>
                <Heading>
                  <Title id={CHOOSER_TITLE_ID}>{content.chooser.title}</Title>
                  <Description>{content.chooser.description}</Description>
                </Heading>
                <Cards>
                  {content.cards.map((card, index) => (
                    <LensCard
                      key={card.lens}
                      {...card}
                      order={index}
                      selectLabel={content.chooser.select}
                      onChoose={chooseLens}
                      onKeyDown={moveFocus}
                    />
                  ))}
                </Cards>
              </Chooser>
            ) : (
              <Entrance lens={lens} content={content.entrances} counts={counts} candidate={candidate} onDone={leave} />
            )}
          </Screen>
        </Shell>
      )}
    </Dialog>
  );
};
