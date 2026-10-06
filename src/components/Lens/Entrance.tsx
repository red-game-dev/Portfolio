import { FC, useEffect, useMemo, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { BinaryRain } from "@/components/BinaryRain";
import { ENTRANCE_TIMING } from "@/components/Lens/config";
import { Lens, LENS_ACCENTS } from "@/config/lenses";
import { BINARY_RAIN_CONFIG } from "@/config/theme";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { RainConfigOverrides } from "@/packages/effects/binary-rain";
import { LensContent } from "@/types/lens";

interface EntranceProps {
  lens: Lens;
  content: LensContent["entrances"];
  counts: { zones: number; bosses: number };
  onDone: () => void;
}

// The rain spells out the greeting quicker here than on the page, since the reader is waiting on it.
const ENTRANCE_RAIN: RainConfigOverrides = { ...BINARY_RAIN_CONFIG, forceLockAfterMs: 1300, forceLockStaggerMs: 25 };

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
`;

const blink = keyframes`
  50% { opacity: 0; }
`;

const Center = tw.div`relative flex flex-col items-center justify-center gap-[18px] w-full h-full px-[24px] text-center`;

const Title = tw.p`m-0 text-xl md:text-2xl font-semibold text-white`;

const Bar = styled.span(({ durationMs }: { durationMs: number }) => [
  tw`block w-[220px] h-[2px] bg-[var(--lens-accent)]`,
  css`
    transform-origin: left center;
    animation: ${fill} ${durationMs}ms cubic-bezier(0.5, 0, 0.2, 1) both;
  `,
]);

// Recruiter: straight to the facts.
const RecruiterEntrance: FC<{ title: string }> = ({ title }: { title: string }) => (
  <Center>
    <Title>{title}</Title>
    <Bar durationMs={ENTRANCE_TIMING.recruiterMs} />
  </Center>
);

const Roadmap = tw.ol`relative list-none m-0 p-0 grid grid-cols-2 md:grid-cols-4 gap-[26px] md:gap-0 w-full max-w-[880px]`;

// The road between stages, lit up to the latest one.
const Road = styled.span(({ lit, count }: { lit: number; count: number }) => [
  tw`hidden md:block absolute top-[11px] h-[2px] bg-[#222]`,
  css`
    left: calc(100% / ${count * 2});
    right: calc(100% / ${count * 2});

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--lens-accent);
      transform-origin: left center;
      transform: scaleX(${count > 1 ? Math.max(0, lit - 1) / (count - 1) : 1});
      transition: transform ${ENTRANCE_TIMING.productStageMs}ms ease-out;
    }
  `,
]);

const Stage = styled.li(({ isLit }: { isLit: boolean }) => [
  tw`relative flex flex-col items-center gap-[8px] text-center`,
  css`
    opacity: ${isLit ? 1 : 0.35};
    transition: opacity 0.3s ease;
  `,
]);

const Milestone = styled.span(({ isLit }: { isLit: boolean }) => [
  tw`relative block w-[24px] h-[24px] rotate-45 border-[2px] border-solid border-[var(--lens-accent)]`,
  isLit ? tw`bg-[var(--lens-accent)]` : tw`bg-[#101010]`,
  css`
    box-shadow: ${isLit ? "0 0 18px rgba(var(--lens-rgb), 0.6)" : "none"};
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
  `,
]);

const StageName = tw.span`text-base md:text-lg font-semibold text-white`;

const StageDetail = tw.span`text-xs md:text-sm text-[#aaa] max-w-[180px]`;

// Product: the roadmap lights up one stage at a time, then opens onto the page.
const ProductEntrance: FC<{ content: LensContent["entrances"]["product"] }> = ({ content }) => {
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (lit >= content.stages.length) {
      return;
    }

    const timeout = window.setTimeout(() => setLit((value) => value + 1), lit === 0 ? 150 : ENTRANCE_TIMING.productStageMs);

    return () => window.clearTimeout(timeout);
  }, [content.stages.length, lit]);

  return (
    <Center>
      <Title>{content.title}</Title>
      <Roadmap>
        <Road lit={lit} count={content.stages.length} aria-hidden="true" />
        {content.stages.map((stage, index) => (
          <Stage key={stage.name} isLit={index < lit}>
            <Milestone isLit={index < lit} aria-hidden="true" />
            <StageName>{stage.name}</StageName>
            <StageDetail>{stage.detail}</StageDetail>
          </Stage>
        ))}
      </Roadmap>
    </Center>
  );
};

const RainLayer = tw.div`absolute inset-0 opacity-70`;

const Console = tw.div`absolute left-[16px] right-[16px] bottom-[24px] md:left-[48px] md:right-auto md:bottom-[48px] md:w-[460px] p-[16px]
bg-[rgba(5, 10, 7, 0.85)] border-[1px] border-solid border-[var(--accent-muted)] text-left text-sm text-[#cfe]`;

const Line = styled.p(() => [
  tw`m-0 leading-relaxed`,
  css`
    animation: ${rise} 0.2s ease-out both;

    &::before {
      content: "> ";
      color: var(--lens-accent);
    }
  `,
]);

const Granted = styled.p(() => [
  tw`m-0 mt-[8px] text-base font-semibold text-[var(--lens-accent)]`,
  css`
    text-shadow: 0 0 12px rgba(var(--lens-rgb), 0.7);
    animation: ${rise} 0.2s ease-out both;
  `,
]);

const Caret = styled.span(() => [
  tw`inline-block w-[8px] h-[14px] ml-[4px] align-middle bg-[var(--lens-accent)]`,
  css`
    animation: ${blink} 1s steps(1) infinite;
  `,
]);

// Engineer: a full boot in the rain, ending on access granted.
const EngineerEntrance: FC<{ content: LensContent["entrances"]["engineer"]; counts: EntranceProps["counts"] }> = ({ content, counts }) => {
  const [shown, setShown] = useState(0);
  const lines = useMemo(
    () => content.lines.map((line) => line.replace("{zones}", String(counts.zones)).replace("{bosses}", String(counts.bosses))),
    [content.lines, counts],
  );
  const message = useMemo(() => [content.granted.toUpperCase()], [content.granted]);

  useEffect(() => {
    if (shown > lines.length) {
      return;
    }

    const timeout = window.setTimeout(() => setShown((value) => value + 1), ENTRANCE_TIMING.engineerLineMs);

    return () => window.clearTimeout(timeout);
  }, [lines.length, shown]);

  return (
    <>
      <RainLayer aria-hidden="true">
        <BinaryRain message={message} config={ENTRANCE_RAIN} />
      </RainLayer>
      <Console>
        {lines.slice(0, shown).map((line) => <Line key={line}>{line}</Line>)}
        {shown > lines.length ? <Granted>{content.granted}</Granted> : <Caret aria-hidden="true" />}
      </Console>
    </>
  );
};

const entranceDuration = (lens: Lens, content: LensContent["entrances"]) => {
  if (lens === "recruiter") {
    return ENTRANCE_TIMING.recruiterMs;
  }

  if (lens === "product") {
    return 150 + content.product.stages.length * ENTRANCE_TIMING.productStageMs + ENTRANCE_TIMING.productHoldMs;
  }

  return (content.engineer.lines.length + 1) * ENTRANCE_TIMING.engineerLineMs + ENTRANCE_TIMING.engineerGrantedMs;
};

const Frame = tw.div`absolute inset-0`;

// Each view enters differently: a quick fade into the facts, a roadmap, or a full terminal boot.
export const Entrance: FC<EntranceProps> = ({ lens, content, counts, onDone }: EntranceProps) => {
  const accent = LENS_ACCENTS[lens];

  useEffect(() => {
    const timeout = window.setTimeout(onDone, prefersReducedMotion() ? 0 : entranceDuration(lens, content));

    return () => window.clearTimeout(timeout);
  }, [content, lens, onDone]);

  return (
    <Frame role="status" style={{ "--lens-accent": accent.color, "--lens-rgb": accent.rgb } as React.CSSProperties}>
      {lens === "recruiter" && <RecruiterEntrance title={content.recruiter.title} />}
      {lens === "product" && <ProductEntrance content={content.product} />}
      {lens === "engineer" && <EngineerEntrance content={content.engineer} counts={counts} />}
    </Frame>
  );
};
