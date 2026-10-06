import { FC, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import useInView from "@/hooks/useInView";
import { GithubActivity } from "@/types/code-review";

interface ActivityProps {
  activity: GithubActivity;
  title: string;
  description: string;
  yearLabel: string;
}

// GitHub's grid: a column per week, Sunday at the top, 10px squares on a 12px pitch.
const PITCH = 12;
const CELL = 10;
const WEEKS = 54;
const LEVEL_OPACITY = [0, 0.3, 0.5, 0.75, 1];

const Box = tw.div`flex flex-col gap-[12px] mt-[18px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Title = tw.h3`m-0 text-base font-semibold text-white`;

const Description = tw.p`m-0 text-sm text-[#999]`;

const Years = tw.ol`list-none m-0 p-0 flex flex-col gap-[8px]`;

const Year = styled.li(({ isShown, order }: { isShown: boolean; order: number }) => [
  tw`grid grid-cols-[44px 1fr] items-center gap-[10px]`,
  css`
    opacity: ${isShown ? 1 : 0};
    transform: translateX(${isShown ? 0 : -12}px);
    transition: opacity 0.4s ease ${order * 90}ms, transform 0.4s ease ${order * 90}ms;

    @media (prefers-reduced-motion: reduce) {
      opacity: 1;
      transform: none;
      transition: none;
    }
  `,
]);

const YearLabel = tw.span`text-xs text-[#8a8a8a]`;

const Grid = tw.svg`block w-full h-auto`;

// One path per level, so a year of days is five elements rather than 365.
const toPaths = (year: number, levels: string) => {
  const offset = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const paths = LEVEL_OPACITY.map(() => [] as string[]);

  Array.from(levels).forEach((level, day) => {
    const slot = day + offset;
    const x = Math.floor(slot / 7) * PITCH;
    const y = (slot % 7) * PITCH;

    paths[Number(level)]?.push(`M${x},${y}h${CELL}v${CELL}h-${CELL}z`);
  });

  return paths.map((parts) => parts.join(""));
};

// Every day on GitHub since the account opened, one row per year, shaded by how busy the day was. The
// shading is GitHub's own bucketing; no counts are shown.
export const Activity: FC<ActivityProps> = ({ activity, title, description, yearLabel }: ActivityProps) => {
  const listRef = useRef<HTMLOListElement>(null);
  const isShown = useInView(listRef, { once: false, threshold: 0.1 });
  const rows = useMemo(() => activity.years.map(({ year, levels }) => ({ year, paths: toPaths(year, levels) })), [activity.years]);

  return (
    <Box>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <Years ref={listRef}>
        {rows.map(({ year, paths }, order) => (
          <Year key={year} isShown={isShown} order={order}>
            <YearLabel>{year}</YearLabel>
            <Grid viewBox={`0 0 ${WEEKS * PITCH} ${7 * PITCH}`} role="img" aria-label={yearLabel.replace("{year}", String(year))}>
              {paths.map((d, level) => (
                <path key={level} d={d} fill={level === 0 ? "#1c1c1c" : "var(--accent)"} fillOpacity={level === 0 ? 1 : LEVEL_OPACITY[level]} />
              ))}
            </Grid>
          </Year>
        ))}
      </Years>
    </Box>
  );
};
