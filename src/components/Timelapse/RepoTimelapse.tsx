import { ChangeEvent, FC, useCallback, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faPause, faPlay, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { actionStyle } from "@/components/Controls";
import { growthSince, milestoneAt, playbackPosition, TIMELAPSE_MS } from "@/components/Timelapse/timelapse";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import type { RepoGrowthView } from "@/packages/insights/repo-growth";
import { fill, formatNumber } from "@/packages/text/format";
import { TimelapseContent } from "@/types/timelapse";

type HeightAt = (view: RepoGrowthView, position: number, district: number) => number;

type IndexAt = (view: RepoGrowthView, date: string) => number;

interface Loaded {
  view: RepoGrowthView;
  heightAt: HeightAt;
  indexAt: IndexAt;
}

const Stats = tw.dl`m-0 mt-[18px] grid grid-cols-2 md:grid-cols-4 gap-[10px]`;

const Stat = tw.div`flex flex-col gap-[4px] p-[10px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const StatName = tw.dt`text-xs text-[#999]`;

const StatValue = tw.dd`m-0 text-lg font-semibold text-white tabular-nums`;

// The stage reserves room above the city for the ticker (a date and two lines), so the tallest roof never meets it.
const Stage = tw.div`relative mt-[22px] pt-[84px] border-0 border-b-[1px] border-solid border-[var(--accent-muted)]`;

const Ticker = tw.div`absolute top-0 left-0 flex flex-col gap-[2px]`;

const TickerDate = tw.span`text-xl md:text-2xl font-semibold text-white tabular-nums`;

const TickerMeta = tw.span`text-xs text-[#999] tabular-nums`;

const Milestone = tw.p`absolute top-0 right-0 m-0 max-w-[50%] text-right text-xs md:text-sm font-semibold text-[var(--accent)]`;

const City = tw.div`relative flex flex-row items-end gap-[4px] md:gap-[8px] h-[200px] md:h-[240px]`;

// A full height building revealed from the ground up by its share of the tallest district, so its windows
// never stretch; the roof line rides the reveal.
const Building = styled.div(() => [
  tw`relative flex-1 h-full`,
  css`
    clip-path: inset(calc((1 - var(--height, 0)) * 100%) 0 0 0);
    background-color: #0b1820;

    &::before {
      content: "";
      position: absolute;
      inset: 4px 3px 0;
      background: repeating-linear-gradient(to right, rgba(var(--accent-rgb), 0.45) 0 3px, transparent 3px 7px);
      mask-image: repeating-linear-gradient(to bottom, #000 0 4px, transparent 4px 8px);
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      top: calc((1 - var(--height, 0)) * 100%);
      background: var(--accent);
    }
  `,
]);

const Labels = tw.ol`hidden md:flex flex-row gap-[8px] m-0 mt-[8px] p-0 list-none`;

const Label = tw.li`flex-1 min-w-0 text-[11px] text-[#999] text-center truncate`;

const Legend = tw.ol`grid md:hidden grid-cols-2 gap-x-[16px] gap-y-[4px] m-0 mt-[10px] p-0 list-none text-xs text-[#999]`;

const LegendItem = tw.li`flex flex-row justify-between gap-[8px]`;

const Count = tw.span`text-white tabular-nums`;

const Controls = tw.div`flex flex-row flex-wrap items-center gap-[14px] mt-[16px]`;

const PlayButton = styled.button(() => actionStyle(true));

const Scrubber = styled.input(() => [
  tw`flex-1 min-w-[160px] m-0 cursor-pointer`,
  css`
    accent-color: var(--accent);
  `,
]);

const Loading = tw.p`absolute inset-0 flex items-center justify-center m-0 text-xs text-[#999]`;

// This site's codebase as a city that grows commit by commit, mounted once a reader opens it. The history and
// the code that reads it load then; it plays once when first seen, pauses off screen, and can be scrubbed. Heights
// are written as CSS variables on each building, so only the commit counter re-renders while it plays.
export const RepoTimelapse: FC<TimelapseContent> = (content: TimelapseContent) => {
  const cityRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useInView(cityRef, { once: false, threshold: 0.4 });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const position = useRef(0);
  const frameId = useRef(0);
  const hasAutoplayed = useRef(false);

  useEffect(() => {
    let isGone = false;

    void import("@/services/repo-growth").then(({ repoGrowthView, heightBetween, frameIndexAt }) => {
      if (!isGone) {
        setLoaded({ view: repoGrowthView, heightAt: heightBetween, indexAt: frameIndexAt });
      }
    });

    return () => {
      isGone = true;
    };
  }, []);

  const paint = useCallback((next: number) => {
    const city = cityRef.current;

    if (!loaded || !city) {
      return;
    }

    position.current = next;
    Array.from(city.children).forEach((building, district) => {
      if (building instanceof HTMLElement) {
        building.style.setProperty("--height", String(loaded.heightAt(loaded.view, next, district)));
      }
    });
    setFrame(Math.floor(next));
  }, [loaded]);

  const pause = useCallback(() => {
    cancelAnimationFrame(frameId.current);
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (!loaded) {
      return;
    }

    const count = loaded.view.frames.length;
    const from = position.current >= count - 1 ? 0 : position.current;
    const startedAt = performance.now() - (from / Math.max(1, count - 1)) * TIMELAPSE_MS;

    const step = (time: number) => {
      const next = playbackPosition(time - startedAt, count);

      paint(next);

      if (next < count - 1) {
        frameId.current = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
      }
    };

    cancelAnimationFrame(frameId.current);
    setIsPlaying(true);
    frameId.current = requestAnimationFrame(step);
  }, [loaded, paint]);

  // Once loaded: the first commit, or the whole city at once for readers who prefer no motion.
  useEffect(() => {
    if (loaded) {
      paint(prefersReducedMotion() ? loaded.view.frames.length - 1 : 0);
    }
  }, [loaded, paint]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (isOnScreen && !hasAutoplayed.current && !prefersReducedMotion()) {
      hasAutoplayed.current = true;
      play();
    } else if (!isOnScreen) {
      pause();
    }
  }, [isOnScreen, loaded, pause, play]);

  useEffect(() => () => cancelAnimationFrame(frameId.current), []);

  const onScrub = (event: ChangeEvent<HTMLInputElement>) => {
    pause();
    paint(Number(event.target.value));
  };

  const view = loaded?.view;
  const current = view?.frames[Math.min(frame, view.frames.length - 1)];
  const lastFrame = view ? view.frames.length - 1 : 0;
  const milestone = view ? milestoneAt(content.milestones, view, frame) : null;
  const districts = view?.districts ?? Object.keys(content.districts);
  const linesOf = (district: number) => formatNumber((current?.heights[district] ?? 0) * (view?.peak ?? 0));
  const today = view?.frames[lastFrame];

  return (
    <>
      {loaded && view && today && (
        <Stats>
          <Stat>
            <StatName>{content.stats.commits}</StatName>
            <StatValue>{formatNumber(view.frames.length)}</StatValue>
          </Stat>
          <Stat>
            <StatName>{content.stats.first}</StatName>
            <StatValue>{view.frames[0].date}</StatValue>
          </Stat>
          <Stat>
            <StatName>{content.stats.lines}</StatName>
            <StatValue>{formatNumber(today.total)}</StatValue>
          </Stat>
          <Stat>
            <StatName>{content.stats.growth}</StatName>
            <StatValue>{fill(content.growth, { times: growthSince(view, loaded.indexAt(view, content.growthSince)) })}</StatValue>
          </Stat>
        </Stats>
      )}
      <Stage>
        {current && (
          <Ticker>
            <TickerDate>{current.date}</TickerDate>
            <TickerMeta>{fill(content.commit, { index: frame + 1, count: lastFrame + 1 })}</TickerMeta>
            <TickerMeta>{fill(content.lines, { lines: formatNumber(current.total) })}</TickerMeta>
          </Ticker>
        )}
        <Milestone aria-live="polite">{milestone?.label ?? ""}</Milestone>
        <City ref={cityRef} role="img" aria-label={current ? fill(content.cityLabel, { date: current.date, lines: formatNumber(current.total) }) : content.loading}>
          {districts.map((district) => <Building key={district} aria-hidden="true" />)}
        </City>
        {!loaded && <Loading>{content.loading}</Loading>}
      </Stage>
      <Labels aria-hidden="true">
        {districts.map((district) => <Label key={district}>{content.districts[district] ?? district}</Label>)}
      </Labels>
      <Legend>
        {districts.map((district, index) => (
          <LegendItem key={district}>
            {content.districts[district] ?? district}
            <Count>{linesOf(index)}</Count>
          </LegendItem>
        ))}
      </Legend>
      <Controls>
        <PlayButton type="button" disabled={!loaded} onClick={isPlaying ? pause : play}>
          <FontAwesomeIcon icon={isPlaying ? faPause : frame >= lastFrame && loaded ? faRotateLeft : faPlay} aria-hidden="true" />
          {isPlaying ? content.pause : frame >= lastFrame && loaded ? content.replay : content.play}
        </PlayButton>
        <Scrubber
          type="range"
          min={0}
          max={lastFrame}
          step={1}
          value={frame}
          disabled={!loaded}
          aria-label={content.scrubLabel}
          aria-valuetext={current ? `${current.date}, ${fill(content.lines, { lines: formatNumber(current.total) })}` : undefined}
          onChange={onScrub}
        />
      </Controls>
    </>
  );
};
