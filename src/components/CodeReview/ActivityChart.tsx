import { FC, useMemo } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { MonthActivity } from "@/packages/insights/activity";
import { hiddenWhenReduced, media } from "@/styles/mixins";

interface ActivityChartProps {
  months: MonthActivity[];
  isShown: boolean;
}

// Each month a step along, the line drawn over the chart's height less room for the years under it.
const STEP = 14;
const HEIGHT = 64;
const TOP = 8;
const LINE_BOTTOM = 48;
const DRAW_MS = 1400;

const pop = keyframes`
  0% { opacity: 0; transform: scale(0.2); }
  70% { opacity: 1; transform: scale(1.35); }
  100% { opacity: 1; transform: scale(1); }
`;

// Hidden until it starts, so the ring never shows before its dot lands.
const ring = keyframes`
  0% { opacity: 0; transform: scale(1); }
  8% { opacity: 0.9; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(3.2); }
`;

// The line and the shade under it are revealed left to right at a steady pace, so each dot lands just as the line
// reaches it.
const Drawn = styled.g(({ isShown }: { isShown: boolean }) => [
  css`
    clip-path: inset(0 ${isShown ? 0 : 100}% 0 0);
    transition: clip-path ${DRAW_MS}ms linear;

    ${media.reducedMotion} {
      clip-path: none;
      transition: none;
    }
  `,
]);

// A dot lands on each month as the line reaches it.
const Dot = styled.circle(({ isShown, delay }: { isShown: boolean; delay: number }) => [
  css`
    fill: var(--accent);
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
  `,
  isShown && css`
    animation: ${pop} 360ms cubic-bezier(0.2, 0.9, 0.3, 1.2) ${delay}ms both;
  `,
  css`
    ${media.reducedMotion} {
      opacity: 1;
      animation: none;
    }
  `,
]);

// The busiest month's dot sends out one ring once it lands.
const Ring = styled.circle(({ isShown, delay }: { isShown: boolean; delay: number }) => [
  css`
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.2;
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
  `,
  isShown && css`
    animation: ${ring} 900ms ease-out ${delay}ms both;
  `,
  hiddenWhenReduced,
]);

const Svg = tw.svg`block w-full h-auto overflow-visible mb-[12px]`;

const YearText = styled.text(() => [
  css`
    fill: #8a8a8a;
    font-size: 9px;
  `,
]);

// How busy each month was across the years shown, as a line with a dot per month: drawn left to right as the
// section comes in, the busiest month's dot ringing once. The grids below say the same day by day, so this is a
// picture for the eye, hidden from screen readers.
export const ActivityChart: FC<ActivityChartProps> = ({ months, isShown }: ActivityChartProps) => {
  const points = useMemo(() => {
    const most = Math.max(1, ...months.map((month) => month.total));

    return months.map((month, index) => ({
      ...month,
      x: index * STEP + STEP / 2,
      y: LINE_BOTTOM - (month.total / most) * (LINE_BOTTOM - TOP),
    }));
  }, [months]);

  if (points.length < 2) {
    return null;
  }

  const width = points.length * STEP;
  const line = points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x},${y}`).join("");
  const area = `${line}L${points[points.length - 1].x},${LINE_BOTTOM}L${points[0].x},${LINE_BOTTOM}Z`;
  const busiest = points.reduce((best, point) => (point.total > best.total ? point : best), points[0]);
  const delayAt = (index: number) => (index / (points.length - 1)) * DRAW_MS;

  return (
    <Svg viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="activity-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={0} x2={width} y1={LINE_BOTTOM} y2={LINE_BOTTOM} stroke="#2a2a2a" strokeWidth={1} />
      <Drawn isShown={isShown}>
        <path d={area} fill="url(#activity-shade)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      </Drawn>
      {points.map((point, index) => (
        <Dot key={`${point.year}-${point.month}`} cx={point.x} cy={point.y} r={point === busiest ? 3.4 : 2.4} isShown={isShown} delay={delayAt(index)} />
      ))}
      <Ring cx={busiest.x} cy={busiest.y} r={3.4} isShown={isShown} delay={delayAt(points.indexOf(busiest)) + 300} />
      {points.filter((point) => point.month === 0 || point === points[0]).map((point) => (
        <YearText key={point.year} x={point.x - STEP / 2} y={HEIGHT - 2}>{point.year}</YearText>
      ))}
    </Svg>
  );
};
