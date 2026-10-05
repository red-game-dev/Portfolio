export interface BackdropConfig {
  framesPerSecond: number;
  maxPixelRatio: number;
  // How long one scene takes to fade into the next.
  fadeMs: number;
  background: string;
}

export type BackdropConfigOverrides = Partial<BackdropConfig>;

export const DEFAULT_BACKDROP_CONFIG: BackdropConfig = {
  framesPerSecond: 30,
  maxPixelRatio: 1.5,
  fadeMs: 1700,
  background: "#101010",
};

export const resolveBackdropConfig = (overrides: BackdropConfigOverrides = {}): BackdropConfig => ({
  ...DEFAULT_BACKDROP_CONFIG,
  ...overrides,
});
