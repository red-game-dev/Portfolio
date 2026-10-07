import { BugKind } from "../domain/types";

export interface BugKindConfig {
  points: number;
  // Strikes needed to squash it.
  hits: number;
  // Walking speed range at wave 1, in pixels per second.
  minSpeed: number;
  maxSpeed: number;
  radius: number;
  // Relative chance of spawning.
  weight: number;
  // Time between sideways jumps; 0 walks straight.
  sidestepEveryMs: number;
}

export interface BugRaidConfig {
  framesPerSecond: number;
  maxStepMs: number;
  maxPixelRatio: number;
  lives: number;
  spawnEveryMs: number;
  minSpawnEveryMs: number;
  waveEveryMs: number;
  // Each wave multiplies the spawn interval by this, and bug speed by `speedPerWave`.
  spawnSpeedup: number;
  speedPerWave: number;
  // Height of the production strip at the bottom. A bug that reaches it costs a life.
  productionHeight: number;
  // Extra reach around a bug for a strike, so fingers are as good as a mouse.
  strikeSlop: number;
  // Distance one key press moves the cursor.
  cursorStep: number;
  splatMs: number;
  kinds: Record<BugKind, BugKindConfig>;
}

export type BugRaidConfigOverrides = Partial<Omit<BugRaidConfig, "kinds">> & { kinds?: Partial<Record<BugKind, Partial<BugKindConfig>>> };

export interface BugRaidTheme {
  background: string;
  grid: string;
  production: string;
  text: string;
  cursor: string;
  splat: string;
  bugs: Record<BugKind, string>;
}

export const DEFAULT_BUG_RAID_CONFIG: BugRaidConfig = {
  framesPerSecond: 60,
  maxStepMs: 50,
  maxPixelRatio: 2,
  lives: 3,
  spawnEveryMs: 1100,
  minSpawnEveryMs: 260,
  waveEveryMs: 12000,
  spawnSpeedup: 0.82,
  speedPerWave: 1.12,
  productionHeight: 28,
  strikeSlop: 10,
  cursorStep: 24,
  splatMs: 420,
  kinds: {
    bug: { points: 10, hits: 1, minSpeed: 34, maxSpeed: 52, radius: 13, weight: 6, sidestepEveryMs: 0 },
    regression: { points: 25, hits: 2, minSpeed: 24, maxSpeed: 34, radius: 16, weight: 2, sidestepEveryMs: 0 },
    flaky: { points: 40, hits: 1, minSpeed: 40, maxSpeed: 60, radius: 11, weight: 2, sidestepEveryMs: 900 },
  },
};

export const DEFAULT_BUG_RAID_THEME: BugRaidTheme = {
  background: "#0d0d0d",
  grid: "rgba(255, 255, 255, 0.04)",
  production: "#ffc45c",
  text: "#999999",
  cursor: "#ffffff",
  splat: "#ffc45c",
  bugs: { bug: "#ff5a5a", regression: "#ff9f43", flaky: "#b896ff" },
};

export const resolveBugRaidConfig = ({ kinds, ...overrides }: BugRaidConfigOverrides = {}): BugRaidConfig => ({
  ...DEFAULT_BUG_RAID_CONFIG,
  ...overrides,
  kinds: {
    bug: { ...DEFAULT_BUG_RAID_CONFIG.kinds.bug, ...kinds?.bug },
    regression: { ...DEFAULT_BUG_RAID_CONFIG.kinds.regression, ...kinds?.regression },
    flaky: { ...DEFAULT_BUG_RAID_CONFIG.kinds.flaky, ...kinds?.flaky },
  },
});
