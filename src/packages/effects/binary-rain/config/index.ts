export interface RainTheme {
  // Opaque fill behind the rain. Lets the host request an opaque canvas, which composites faster.
  background: string;
  // Trail colour at full strength; the fade is applied with globalAlpha, not with more colours.
  trail: string;
  head: string;
  letter: string;
  freshLetter: string;
  caret: string;
  glow: string;
}

export interface RainConfig {
  framesPerSecond: number;
  maxStepMs: number;
  maxPixelRatio: number;
  fontFamily: string;
  // Below this width the grid switches to the smaller font.
  narrowWidth: number;
  narrowFontSize: number;
  wideFontSize: number;
  cellWidthRatio: number;
  cellHeightRatio: number;
  // Rows per second.
  minSpeed: number;
  maxSpeed: number;
  minTrail: number;
  // Share of the grid height a trail can reach.
  maxTrailRatio: number;
  // Glow radii in CSS pixels, baked into cached sprites.
  headGlow: number;
  letterGlow: number;
  freshLetterGlow: number;
  // Chance per column per step that one glyph changes.
  flickerChance: number;
  // Letters no stream has reached by then lock anyway, one after another, so the message always completes.
  forceLockAfterMs: number;
  forceLockStaggerMs: number;
  lockFlashMs: number;
  caretBlinkMs: number;
  trailLevels: number;
  maxTrailAlpha: number;
  theme: RainTheme;
}

export type RainConfigOverrides = Partial<Omit<RainConfig, "theme">> & { theme?: Partial<RainTheme> };

// Classic terminal green. Hosts pass their own palette through `theme`.
export const DEFAULT_RAIN_THEME: RainTheme = {
  background: "#000000",
  trail: "rgb(0, 255, 65)",
  head: "#e6ffe9",
  letter: "#f0fff2",
  freshLetter: "#ffffff",
  caret: "rgb(0, 255, 65)",
  glow: "rgba(0, 255, 65, 0.85)",
};

export const DEFAULT_RAIN_CONFIG: RainConfig = {
  framesPerSecond: 30,
  maxStepMs: 100,
  maxPixelRatio: 2,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  narrowWidth: 640,
  narrowFontSize: 14,
  wideFontSize: 18,
  cellWidthRatio: 0.95,
  cellHeightRatio: 1.2,
  minSpeed: 7,
  maxSpeed: 18,
  minTrail: 6,
  maxTrailRatio: 0.9,
  headGlow: 8,
  letterGlow: 6,
  freshLetterGlow: 16,
  flickerChance: 0.06,
  forceLockAfterMs: 2400,
  forceLockStaggerMs: 35,
  lockFlashMs: 450,
  caretBlinkMs: 530,
  trailLevels: 12,
  maxTrailAlpha: 0.7,
  theme: DEFAULT_RAIN_THEME,
};

export const resolveRainConfig = (overrides: RainConfigOverrides = {}): RainConfig => ({
  ...DEFAULT_RAIN_CONFIG,
  ...overrides,
  theme: { ...DEFAULT_RAIN_THEME, ...overrides.theme },
});
