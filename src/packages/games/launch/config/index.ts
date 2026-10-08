export interface LaunchConfig {
  framesPerSecond: number;
  maxStepMs: number;
  // Holding for this long fills the engines.
  chargeMs: number;
  // After a single press, the engines fill by themselves in this long.
  autoChargeMs: number;
  // Let go early and the charge drains in this long.
  drainMs: number;
  // From lift off to orbit.
  ascentMs: number;
  // The bands passed on the way up, one per zone crossed.
  markers: number;
  stars: number;
}

export type LaunchConfigOverrides = Partial<LaunchConfig>;

export const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  framesPerSecond: 60,
  maxStepMs: 50,
  chargeMs: 900,
  autoChargeMs: 650,
  drainMs: 500,
  ascentMs: 4200,
  markers: 5,
  stars: 110,
};

export const resolveLaunchConfig = (overrides: LaunchConfigOverrides = {}): LaunchConfig => ({ ...DEFAULT_LAUNCH_CONFIG, ...overrides });

export interface LaunchTheme {
  space: string;
  horizon: string;
  ground: string;
  star: string;
  hull: string;
  window: string;
  fin: string;
  flameCore: string;
  flameEdge: string;
  planet: string;
  // One colour per band, bottom first.
  markers: string[];
}

export const DEFAULT_LAUNCH_THEME: LaunchTheme = {
  space: "#05070f",
  horizon: "#3a2a0d",
  ground: "#14110a",
  star: "#ecf1ff",
  hull: "#e8ecf5",
  window: "#c4d2ff",
  fin: "#3e4a6b",
  flameCore: "#fff6df",
  flameEdge: "#ffb03a",
  planet: "#1d2a4d",
  markers: ["#4bffa5", "#4fd8ff", "#b896ff", "#ff5fa2", "#ffc45c"],
};
