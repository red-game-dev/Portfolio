import { FC, useMemo, useRef } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faBolt, faCalendarCheck, faCrown, faFire, faTrophy } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

import useAnimationProgress from "@/hooks/useAnimationProgress";
import useInView from "@/hooks/useInView";
import { activityStats, ActivityStats, DayRange } from "@/packages/insights/activity";
import { CodeReviewContent, GithubActivity } from "@/types/code-review";

interface ActivityProps {
  activity: GithubActivity;
  title: string;
  description: string;
  yearLabel: string;
  achievements: CodeReviewContent["achievements"];
}

// GitHub's grid: a column per week, Sunday at the top, 10px squares on a 12px pitch.
const PITCH = 12;
const CELL = 10;
const WEEKS = 54;
const LEVEL_OPACITY = [0, 0.3, 0.5, 0.75, 1];

// The run: each year's row is scanned in, one after another, then the achievements unlock in turn.
const SWEEP_MS = 1100;
const ROW_STAGGER_MS = 260;
// How long the badge numbers take to count up.
const COUNT_MS = 900;
const UNLOCK_STAGGER_MS = 140;

const Box = tw.div`flex flex-col gap-[14px] mt-[18px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Title = tw.h3`m-0 text-base font-semibold text-white`;

const Description = tw.p`m-0 text-sm text-[#999]`;

const Years = tw.ol`list-none m-0 p-0 flex flex-col gap-[8px]`;

const Year = tw.li`grid grid-cols-[44px 1fr] items-center gap-[10px]`;

const YearLabel = tw.span`text-xs text-[#8a8a8a]`;

interface RunProps {
  isShown: boolean;
  delay: number;
}

// The row reveals left to right behind a glowing scan head, like a level being loaded.
const Row = styled.div(({ isShown, delay }: RunProps) => [
  tw`relative`,
  css`
    clip-path: inset(0 ${isShown ? 0 : 100}% 0 0);
    transition: clip-path ${SWEEP_MS}ms cubic-bezier(0.45, 0, 0.25, 1) ${delay}ms;

    @media (prefers-reduced-motion: reduce) {
      clip-path: none;
      transition: none;
    }
  `,
]);

const Head = styled.span(({ isShown, delay }: RunProps) => [
  tw`absolute top-[-3px] bottom-[-3px] w-[2px] bg-[var(--accent)] pointer-events-none`,
  css`
    left: ${isShown ? 100 : 0}%;
    opacity: ${isShown ? 0 : 1};
    box-shadow: 0 0 10px 2px rgba(var(--accent-rgb), 0.7);
    transition: left ${SWEEP_MS}ms cubic-bezier(0.45, 0, 0.25, 1) ${delay}ms, opacity 0.25s ease ${delay + SWEEP_MS}ms;

    @media (prefers-reduced-motion: reduce) {
      display: none;
    }
  `,
]);

const Grid = tw.svg`block w-full h-auto overflow-visible`;

const glow = keyframes`
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
`;

// Each year's longest streak, outlined once its row has loaded, and breathing gently after.
const Streak = styled.path(({ isShown, delay }: RunProps) => [
  css`
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.5;
    filter: drop-shadow(0 0 3px rgba(var(--accent-rgb), 0.9));
    opacity: 0;
  `,
  isShown && css`
    animation: ${glow} 2.4s ease-in-out ${delay}ms infinite both;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      opacity: 1;
    }
  `,
]);

const AchievementsTitle = tw.h4`m-0 mt-[4px] text-xs font-semibold text-[#8a8a8a]`;

const Badges = tw.ul`list-none m-0 p-0 grid gap-[10px] grid-cols-2 md:grid-cols-3 xl:grid-cols-5`;

const pop = keyframes`
  0% { opacity: 0; transform: scale(0.6) translateY(8px); }
  60% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: none; }
`;

const shine = keyframes`
  from { transform: translateX(-120%) skewX(-20deg); }
  to { transform: translateX(220%) skewX(-20deg); }
`;

const Badge = styled.li(({ isShown, delay }: RunProps) => [
  tw`relative flex flex-row items-center gap-[10px] p-[10px] overflow-hidden bg-[#121212] border-[1px] border-solid border-[var(--accent-muted)] rounded-[2px]`,
  css`
    opacity: 0;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 40%;
      pointer-events: none;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
      transform: translateX(-120%);
    }
  `,
  isShown && css`
    animation: ${pop} 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) ${delay}ms both;

    &::after {
      animation: ${shine} 0.9s ease-out ${delay + 350}ms both;
    }
  `,
  css`
    @media (prefers-reduced-motion: reduce) {
      opacity: 1;
      animation: none;

      &::after {
        display: none;
      }
    }
  `,
]);

const Medal = styled.span(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[34px] h-[38px] text-[15px] text-[#101010] bg-[var(--accent)]`,
  css`
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  `,
]);

const BadgeText = tw.span`text-xs leading-snug text-[#ddd]`;

const BadgeValue = tw.strong`block text-base text-white`;

const Legend = tw.p`m-0 text-[11px] text-[#777]`;

// The full sentence for screen readers, while the counter animates on screen.
const Spoken = tw.span`sr-only`;

const cellAt = (year: number, day: number) => {
  const slot = day + new Date(Date.UTC(year, 0, 1)).getUTCDay();

  return { x: Math.floor(slot / 7) * PITCH, y: (slot % 7) * PITCH };
};

// One path per level, so a year of days is five elements rather than 365.
const toPaths = (year: number, levels: string) => {
  const paths = LEVEL_OPACITY.map(() => [] as string[]);

  Array.from(levels).forEach((level, day) => {
    const { x, y } = cellAt(year, day);

    paths[Number(level)]?.push(`M${x},${y}h${CELL}v${CELL}h-${CELL}z`);
  });

  return paths.map((parts) => parts.join(""));
};

// The streak as one outline around each of its days, a little outside the squares.
const toStreakPath = (year: number, range: DayRange | null) => {
  if (!range) {
    return "";
  }

  return Array.from({ length: range.end - range.start + 1 }, (_, offset) => {
    const { x, y } = cellAt(year, range.start + offset);

    return `M${x - 1},${y - 1}h${CELL + 2}v${CELL + 2}h-${CELL + 2}z`;
  }).join("");
};

interface Achievement {
  icon: FontAwesomeIconProps["icon"];
  value: number;
  text: string;
}

interface AchievementsProps {
  stats: ActivityStats;
  achievements: ActivityProps["achievements"];
  isShown: boolean;
  // When the first badge unlocks, once the years have loaded in.
  unlockAt: number;
}

// The badges unlock one after another once the years have loaded, their numbers counting up meanwhile. The
// count is clocked here, so only the badges re-render while it runs, never the year grids.
const Achievements: FC<AchievementsProps> = ({ stats, achievements, isShown, unlockAt }: AchievementsProps) => {
  const counted = useAnimationProgress(isShown, COUNT_MS, unlockAt);
  const list: Achievement[] = [
    { icon: faFire, value: stats.longestDayStreak, text: achievements.dayStreak },
    { icon: faCalendarCheck, value: stats.longestWeekStreak, text: achievements.weekStreak },
    { icon: faBolt, value: stats.activeDays, text: achievements.activeDays },
    ...(stats.perfectWeeks > 0 ? [{ icon: faCrown, value: stats.perfectWeeks, text: achievements.perfectWeeks }] : []),
  ];
  const busiest = stats.busiestMonth;

  return (
    <Badges>
      {list.map((item, order) => {
        const [before, after = ""] = item.text.split("{n}");

        return (
          <Badge key={item.text} isShown={isShown} delay={unlockAt + order * UNLOCK_STAGGER_MS}>
            <Medal aria-hidden="true"><FontAwesomeIcon icon={item.icon} /></Medal>
            <BadgeText>
              <BadgeValue aria-hidden="true">{`${before}${Math.round(item.value * counted)}${after}`}</BadgeValue>
              <Spoken>{item.text.replace("{n}", String(item.value))}</Spoken>
            </BadgeText>
          </Badge>
        );
      })}
      {busiest && (
        <Badge isShown={isShown} delay={unlockAt + list.length * UNLOCK_STAGGER_MS}>
          <Medal aria-hidden="true"><FontAwesomeIcon icon={faTrophy} /></Medal>
          <BadgeText>
            {achievements.busiestMonth.replace("{month}", achievements.months[busiest.month]).replace("{year}", String(busiest.year))}
          </BadgeText>
        </Badge>
      )}
    </Badges>
  );
};

// Every day on GitHub for the years shown, as a run: each row loads in, its longest streak lights up, and
// the streaks and records unlock as achievements. The shading is GitHub's own bucketing; no counts.
export const Activity: FC<ActivityProps> = ({ activity, title, description, yearLabel, achievements }: ActivityProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const isShown = useInView(listRef, { threshold: 0.15 });
  const stats = useMemo(() => activityStats(activity.years), [activity.years]);
  const rows = useMemo(() => activity.years.map(({ year, levels }) => ({
    year,
    paths: toPaths(year, levels),
    streak: toStreakPath(year, stats.yearStreaks[year] ?? null),
  })), [activity.years, stats]);
  const unlockAt = (rows.length - 1) * ROW_STAGGER_MS + SWEEP_MS;

  return (
    <Box>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <div ref={listRef}>
        <Years>
          {rows.map(({ year, paths, streak }, order) => {
            const delay = order * ROW_STAGGER_MS;

            return (
              <Year key={year}>
                <YearLabel>{year}</YearLabel>
                <Row isShown={isShown} delay={delay}>
                  <Grid viewBox={`0 0 ${WEEKS * PITCH} ${7 * PITCH}`} role="img" aria-label={yearLabel.replace("{year}", String(year))}>
                    {paths.map((d, level) => (
                      <path key={level} d={d} fill={level === 0 ? "#1c1c1c" : "var(--accent)"} fillOpacity={level === 0 ? 1 : LEVEL_OPACITY[level]} />
                    ))}
                    {streak && <Streak d={streak} isShown={isShown} delay={delay + SWEEP_MS} />}
                  </Grid>
                  <Head isShown={isShown} delay={delay} aria-hidden="true" />
                </Row>
              </Year>
            );
          })}
        </Years>
      </div>
      <Legend>{achievements.streakLegend}</Legend>
      <AchievementsTitle>{achievements.title}</AchievementsTitle>
      <Achievements stats={stats} achievements={achievements} isShown={isShown} unlockAt={unlockAt} />
    </Box>
  );
};
