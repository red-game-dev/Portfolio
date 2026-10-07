import { FC, useEffect, useMemo, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { BinaryRain } from "@/components/BinaryRain";
import { ENTRANCE_TIMING } from "@/components/Lens/config";
import { Lens, LENS_ACCENTS } from "@/config/lenses";
import { BINARY_RAIN_CONFIG } from "@/config/theme";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { RainConfigOverrides } from "@/packages/effects/binary-rain";
import { fill } from "@/packages/text/format";
import { caretBlink } from "@/styles/keyframes";
import { EntranceCandidate, LensContent } from "@/types/lens";

interface EntranceProps {
  lens: Lens;
  content: LensContent["entrances"];
  counts: { zones: number; bosses: number };
  candidate: EntranceCandidate;
  onDone: () => void;
}

// The rain spells out the greeting quicker here than on the page, since the reader is waiting on it.
const ENTRANCE_RAIN: RainConfigOverrides = { ...BINARY_RAIN_CONFIG, forceLockAfterMs: 1300, forceLockStaggerMs: 25 };

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
`;

const Center = tw.div`relative flex flex-col items-center justify-center gap-[18px] w-full h-full px-[24px] text-center`;

const Title = tw.p`m-0 text-xl md:text-2xl font-semibold text-white`;

// Recruiter: a candidate card moving through their pipeline, the way a profile they like does. Every tick is
// a fact the page states; the stamp lands on the last stage, and the page opens on the facts.
const Pipeline = tw.ol`list-none m-0 p-0 flex flex-row items-center gap-[6px] md:gap-[10px]`;

const PipelineStage = styled.li(({ isReached }: { isReached: boolean }) => [
  tw`flex flex-row items-center gap-[6px] md:gap-[10px] text-xs md:text-sm font-semibold`,
  css`
    color: ${isReached ? "var(--lens-accent)" : "#555"};
    transition: color 0.3s ease;

    & + &::before {
      content: "";
      display: block;
      width: 22px;
      height: 2px;
      background: ${isReached ? "var(--lens-accent)" : "#2a2a2a"};
      transition: background-color 0.3s ease;
    }
  `,
]);

const cardIn = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to { opacity: 1; transform: none; }
`;

const CandidateCard = styled.div(({ stage }: { stage: number }) => [
  tw`relative w-full max-w-[340px] p-[18px] text-left bg-[#111] rounded-[10px] border-[1px] border-solid border-[var(--lens-accent)]`,
  css`
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 30px rgba(var(--lens-rgb), ${0.08 + stage * 0.08});
    animation: ${cardIn} 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) both;
    transition: box-shadow 0.4s ease;
  `,
]);

const Person = tw.div`flex flex-row items-center gap-[12px] mb-[14px]`;

const Avatar = tw.span`flex items-center justify-center w-[44px] h-[44px] rounded-full text-base font-bold text-[#101010] bg-[var(--lens-accent)]`;

const PersonName = tw.span`block text-base font-semibold text-white`;

const PersonRole = tw.span`block text-sm text-[#aaa]`;

const Checks = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px]`;

const tick = keyframes`
  0% { transform: scale(0); }
  70% { transform: scale(1.25); }
  100% { transform: scale(1); }
`;

const Check = styled.li(({ isTicked }: { isTicked: boolean }) => [
  tw`flex flex-row items-center gap-[10px] text-sm`,
  css`
    color: ${isTicked ? "#eee" : "#555"};
    transition: color 0.25s ease;

    &::before {
      content: "${isTicked ? "\\2713" : ""}";
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      color: #101010;
      background: ${isTicked ? "var(--lens-accent)" : "transparent"};
      border: 1px solid ${isTicked ? "var(--lens-accent)" : "#333"};
      animation: ${isTicked ? css`${tick} 0.3s ease-out both` : "none"};
    }
  `,
]);

const stampIn = keyframes`
  0% { opacity: 0; transform: rotate(-10deg) scale(2.2); }
  60% { opacity: 1; transform: rotate(-10deg) scale(0.92); }
  100% { opacity: 1; transform: rotate(-10deg) scale(1); }
`;

const Stamp = styled.span(() => [
  tw`absolute right-[14px] top-[14px] px-[10px] py-[4px] text-sm font-bold rounded-[4px] text-[var(--lens-accent)]`,
  css`
    border: 2px solid var(--lens-accent);
    background: rgba(16, 16, 16, 0.85);
    animation: ${stampIn} 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  `,
]);

const burst = keyframes`
  from { opacity: 1; transform: translate(0, 0) scale(1); }
  to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.4); }
`;

// A few sparks off the stamp as it lands.
const Spark = styled.span(({ dx, dy }: { dx: number; dy: number }) => [
  tw`absolute right-[48px] top-[26px] w-[6px] h-[6px] rounded-full bg-[var(--lens-accent)] pointer-events-none`,
  css`
    --dx: ${dx}px;
    --dy: ${dy}px;
    box-shadow: 0 0 10px rgba(var(--lens-rgb), 0.9);
    animation: ${burst} 0.7s ease-out both;
  `,
]);

const SPARKS = [[-46, -30], [-20, -44], [18, -40], [44, -16], [40, 20], [-40, 18]];

const initialsOf = (name: string) => name.split(/\s+/).map((part) => part[0] ?? "")
.join("")
.slice(0, 2)
.toUpperCase();

const RecruiterEntrance: FC<{ content: LensContent["entrances"]["recruiter"]; candidate: EntranceCandidate }> = ({ content, candidate }) => {
  const [ticked, setTicked] = useState(() => (prefersReducedMotion() ? candidate.checks.length : 0));
  const isStamped = ticked >= candidate.checks.length;
  // Sourced on arrival, screened halfway through the checks, shortlisted once they all pass.
  const stage = isStamped ? content.stages.length - 1 : Math.min(content.stages.length - 2, Math.floor((ticked / candidate.checks.length) * 2));

  useEffect(() => {
    if (isStamped) {
      return;
    }

    const delay = ticked === 0 ? ENTRANCE_TIMING.recruiterIntroMs : ENTRANCE_TIMING.recruiterCheckMs;
    const timeout = window.setTimeout(() => setTicked((value) => value + 1), delay);

    return () => window.clearTimeout(timeout);
  }, [isStamped, ticked]);

  return (
    <Center>
      <Title>{content.title}</Title>
      <Pipeline>
        {content.stages.map((name, index) => <PipelineStage key={name} isReached={index <= stage}>{name}</PipelineStage>)}
      </Pipeline>
      <CandidateCard stage={stage}>
        <Person>
          <Avatar aria-hidden="true">{initialsOf(candidate.name)}</Avatar>
          <span>
            <PersonName>{candidate.name}</PersonName>
            <PersonRole>{candidate.role}</PersonRole>
          </span>
        </Person>
        <Checks>
          {candidate.checks.map((check, index) => <Check key={check} isTicked={index < ticked}>{check}</Check>)}
        </Checks>
        {isStamped && (
          <>
            <Stamp>{content.stamp}</Stamp>
            {!prefersReducedMotion() && SPARKS.map(([dx, dy]) => <Spark key={`${dx}${dy}`} dx={dx} dy={dy} aria-hidden="true" />)}
          </>
        )}
      </CandidateCard>
    </Center>
  );
};

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
    animation: ${caretBlink} 1s steps(1) infinite;
  `,
]);

// Engineer: a full boot in the rain, ending on access granted.
const EngineerEntrance: FC<{ content: LensContent["entrances"]["engineer"]; counts: EntranceProps["counts"] }> = ({ content, counts }) => {
  const [shown, setShown] = useState(0);
  const lines = useMemo(
    () => content.lines.map((line) => fill(line, { zones: counts.zones, bosses: counts.bosses })),
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

const entranceDuration = (lens: Lens, content: LensContent["entrances"], candidate: EntranceCandidate) => {
  if (lens === "recruiter") {
    const { recruiterIntroMs, recruiterCheckMs, recruiterStampMs, recruiterHoldMs } = ENTRANCE_TIMING;

    return recruiterIntroMs + (candidate.checks.length - 1) * recruiterCheckMs + recruiterStampMs + recruiterHoldMs;
  }

  if (lens === "product") {
    return 150 + content.product.stages.length * ENTRANCE_TIMING.productStageMs + ENTRANCE_TIMING.productHoldMs;
  }

  return (content.engineer.lines.length + 1) * ENTRANCE_TIMING.engineerLineMs + ENTRANCE_TIMING.engineerGrantedMs;
};

const Frame = tw.div`absolute inset-0`;

// Each view enters differently: a candidate shortlisted, a roadmap, or a full terminal boot.
export const Entrance: FC<EntranceProps> = ({ lens, content, counts, candidate, onDone }: EntranceProps) => {
  const accent = LENS_ACCENTS[lens];

  useEffect(() => {
    const timeout = window.setTimeout(onDone, prefersReducedMotion() ? 0 : entranceDuration(lens, content, candidate));

    return () => window.clearTimeout(timeout);
  }, [candidate, content, lens, onDone]);

  return (
    <Frame role="status" style={{ "--lens-accent": accent.color, "--lens-rgb": accent.rgb } as React.CSSProperties}>
      {lens === "recruiter" && <RecruiterEntrance content={content.recruiter} candidate={candidate} />}
      {lens === "product" && <ProductEntrance content={content.product} />}
      {lens === "engineer" && <EngineerEntrance content={content.engineer} counts={counts} />}
    </Frame>
  );
};
