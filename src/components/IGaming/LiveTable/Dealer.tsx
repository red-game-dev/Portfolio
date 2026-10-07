import { FC, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import useCanvasEngine from "@/hooks/useCanvasEngine";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { createDealerModel, DEFAULT_DEALER_OUTFITS } from "@/packages/games/live-table";
import { RigActor } from "@/packages/graphics/rig";

interface DealerProps {
  phrase: string;
  // Changes with every phase, so the dealer speaks again even when the words repeat.
  phraseKey: string;
  outfitLabels: string[];
  changeLabel: string;
  roundLabel: string;
  // How long the current phase lasts, for the timer under her words.
  phaseMs: number;
  isClosed: boolean;
  isRunning: boolean;
}

const TALK_MS = 1100;

const Root = tw.div`relative z-[1] flex flex-row items-end justify-center gap-[14px]`;

const Figure = styled.button(() => [
  tw`relative w-[120px] md:w-[160px] p-0 cursor-pointer bg-transparent border-0`,
  css`
    aspect-ratio: 200 / 240;

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
    }
  `,
]);

const Portrait = tw.canvas`block w-full h-full`;

const pop = keyframes`
  0% { opacity: 0; transform: translateY(6px) scale(0.92); }
  100% { opacity: 1; transform: none; }
`;

const Bubble = styled.div(({ isClosed }: { isClosed: boolean }) => [
  tw`relative mb-[34px] md:mb-[48px] flex flex-col gap-[6px] min-w-[150px] max-w-[220px] px-[14px] py-[10px] rounded-[10px] text-sm font-bold`,
  isClosed ? tw`text-white bg-[#b3122e]` : tw`text-[#1a1a1a] bg-[#f4efe6]`,
  css`
    animation: ${pop} 0.3s ease-out both;

    &::before {
      content: "";
      position: absolute;
      left: -7px;
      bottom: 14px;
      border: 7px solid transparent;
      border-left: 0;
      border-right-color: ${isClosed ? "#b3122e" : "#f4efe6"};
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
]);

const shrink = keyframes`
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
`;

const Timer = styled.span(({ ms, isRunning }: { ms: number; isRunning: boolean }) => [
  tw`block h-[3px] rounded-full bg-current opacity-60`,
  css`
    transform-origin: left center;
    animation: ${shrink} ${ms}ms linear both;
    animation-play-state: ${isRunning ? "running" : "paused"};
  `,
]);

const Round = tw.span`text-[11px] font-semibold opacity-60`;

// The dealer behind the felt: a rig actor that breathes, blinks and talks as she calls each phase of the
// round. A tap changes her outfit.
export const Dealer: FC<DealerProps> = ({ phrase, phraseKey, outfitLabels, changeLabel, roundLabel, phaseMs, isClosed, isRunning }: DealerProps) => {
  const figureRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [outfit, setOutfit] = useState(0);
  // The live table's chunk already holds the rig, so she is built straight away.
  const dealer = useCanvasEngine(canvasRef, {
    sizeRef: figureRef,
    nearMargin: "0px",
    create: (context) => new RigActor(context, { model: createDealerModel(), skins: DEFAULT_DEALER_OUTFITS }),
    resize: (actor, { width, pixelRatio }) => actor.resize(width, pixelRatio),
  });

  // She only moves while the table is on screen, and stays still for reduced motion.
  useEffect(() => {
    if (dealer && isRunning && !prefersReducedMotion()) {
      dealer.start();
    } else {
      dealer?.stop();
    }
  }, [dealer, isRunning]);

  useEffect(() => {
    dealer?.play("talk", TALK_MS);
  }, [dealer, phraseKey]);

  useEffect(() => {
    dealer?.setSkin(outfit);
  }, [dealer, outfit]);

  const next = (outfit + 1) % DEFAULT_DEALER_OUTFITS.length;

  return (
    <Root>
      <Figure ref={figureRef} type="button" aria-label={`${changeLabel}: ${outfitLabels[next] ?? ""}`} onClick={() => setOutfit(next)}>
        <Portrait ref={canvasRef} aria-hidden="true" />
      </Figure>
      <Bubble key={phraseKey} isClosed={isClosed}>
        <Round>{roundLabel}</Round>
        <span>{phrase}</span>
        <Timer ms={phaseMs} isRunning={isRunning} aria-hidden="true" />
      </Bubble>
    </Root>
  );
};
