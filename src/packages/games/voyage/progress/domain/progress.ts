// A pilot's lasting progress beyond the hangar and the career: their experience (which sets their level), the best
// stars won in each universe and each daily voyage, the achievements unlocked and when, the lifetime counts those
// are read from, the paints and engine trails owned and chosen, and how far the guided first flight has gone.
export interface ProgressProfile {
  exp: number;
  stars: Record<string, number>;
  achievements: Record<string, number>;
  counters: Record<string, number>;
  cosmetics: { paint: string; trail: string; owned: string[] };
  guide: { step: number; isDone: boolean };
}

// What a lifetime count is: a number added to (worlds landed on, bosses brought down) or the best ever reached (the
// pilot's level, a piece's enhancement).
export type CounterKind = "count" | "best";

// An achievement: the count it reads, the number that unlocks it, and the paint or trail it gives, if any.
export interface AchievementSpec {
  id: string;
  counter: string;
  target: number;
  reward: string | null;
}

// A paint: the colours it gives the hull, by the parts the painter names.
export interface PaintSpec {
  id: string;
  hull: string;
  hullShade: string;
  fin: string;
  window: string;
  accent: string | null;
}

// An engine trail: the colours of the flame's core and edge, and the particles it leaves.
export interface TrailSpec {
  id: string;
  core: string;
  edge: string;
  style: "flame" | "ion" | "sparkle" | "pixel" | "rainbow";
}

// Whatever unlocks a cosmetic: an achievement (by id) or a total of stars.
export interface CosmeticUnlock {
  cosmetic: string;
  stars: number | null;
}

// What happened when progress moved: levels gained, achievements unlocked, cosmetics won.
export interface ProgressOutcome {
  levels: number;
  level: number;
  achievements: string[];
  cosmetics: string[];
}
