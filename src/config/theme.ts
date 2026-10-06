import {
  BlockSnapTransitionOptions,
  CasinoSceneOptions,
  ChainSceneOptions,
  ChipFlipTransitionOptions,
  CollapseTransitionOptions,
  EmberSceneOptions,
  NeuralSceneOptions,
  PortalTransitionOptions,
  RainSceneOptions
} from "@/packages/effects/backdrop";
import { RainConfigOverrides } from "@/packages/effects/binary-rain";
import { BugRaidTheme, DEFAULT_BUG_RAID_THEME } from "@/packages/games/bug-raid";
import { DEFAULT_LIVE_TABLE_THEME, LiveTableTheme } from "@/packages/games/live-table";

// Runtime colours for things twin.macro cannot reach, such as canvas drawing. Styled components keep
// their colours in the tw`` strings, which have to be static at build time.
export const COLORS = {
  accent: "#4bffa5",
  accentRgb: "75, 255, 165",
  accentMuted: "#2f6b4d",
  surface: "#101010",
  screen: "#0a0f0c",
} as const;

export const BINARY_RAIN_CONFIG: RainConfigOverrides = {
  theme: {
    background: COLORS.screen,
    trail: COLORS.accent,
    head: "#eafff3",
    letter: "#f2fff8",
    freshLetter: "#ffffff",
    caret: COLORS.accent,
    glow: `rgba(${COLORS.accentRgb}, 0.85)`,
  },
};

// The journey backdrop, one palette per zone. Kept dim: it sits behind the content, not in front of it.
export const BACKDROP_THEME: {
  rain: RainSceneOptions;
  neural: NeuralSceneOptions;
  chain: ChainSceneOptions;
  casino: CasinoSceneOptions;
  ember: EmberSceneOptions;
} = {
  rain: { color: COLORS.accent, headColor: "#eafff3", glowColor: `rgba(${COLORS.accentRgb}, 0.8)`, intensity: 0.3 },
  neural: { linkRgb: COLORS.accentRgb, nodeColor: COLORS.accent, pulseColor: "rgba(234, 255, 243, 0.95)", intensity: 0.75 },
  chain: { block: [184, 150, 255], flash: [233, 220, 255], intensity: 0.7 },
  casino: {
    felt: "rgba(28, 120, 78, 0.38)",
    chipColors: ["#ff5fa2", "#ffc45c", "#4fd8ff", "#e6edf3"],
    suitColor: "rgba(255, 95, 162, 0.9)",
    wheelColor: "rgba(255, 196, 92, 0.55)",
    intensity: 0.6,
  },
  ember: { emberColor: "rgba(255, 196, 92, 0.95)", intensity: 0.75 },
};

// The moments between zones, matched to each zone's accent in globals.css.
export const TRANSITION_THEME: {
  collapse: CollapseTransitionOptions;
  snap: BlockSnapTransitionOptions;
  flip: ChipFlipTransitionOptions;
  portal: PortalTransitionOptions;
} = {
  collapse: { from: [75, 255, 165], to: [79, 216, 255], fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  snap: { from: [79, 216, 255], to: [184, 150, 255], cell: 64 },
  flip: { chipColors: [[255, 95, 162], [255, 196, 92], [79, 216, 255]], rim: [255, 255, 255] },
  portal: { ring: [255, 196, 92], glow: [255, 170, 60] },
};

// Bug Raid sits in the MMO zone, so production takes that zone's gold.
export const BUG_RAID_THEME: BugRaidTheme = {
  ...DEFAULT_BUG_RAID_THEME,
  background: "#0d0d0d",
  production: "#ffc45c",
  splat: "#ffc45c",
};

// The finale's rain, in the MMO zone's gold.
export const FINALE_RAIN_CONFIG: RainConfigOverrides = {
  theme: {
    background: "#0d0b06",
    trail: "#ffc45c",
    head: "#fff3d6",
    letter: "#fff8e8",
    freshLetter: "#ffffff",
    caret: "#ffc45c",
    glow: "rgba(255, 196, 92, 0.85)",
  },
};

// The live table sits in the casino zone: green felt, a gold rim and the casino's red card backs.
export const LIVE_TABLE_THEME: LiveTableTheme = { ...DEFAULT_LIVE_TABLE_THEME };
