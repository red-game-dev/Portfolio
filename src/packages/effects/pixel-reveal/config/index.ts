export interface PixelRevealTheme {
  background: string;
  // The colour of the binary glyphs and the enhance scanline.
  signal: string;
  // The spark colour around the scanline.
  spark: string;
}

export interface PixelRevealConfig {
  framesPerSecond: number;
  maxPixelRatio: number;
  binaryMs: number;
  pixelsMs: number;
  enhanceMs: number;
  // Size of one binary glyph cell, in CSS pixels.
  binaryCell: number;
  // Mosaic sizes the pixel stage steps through, coarse to fine.
  blockSizes: number[];
  // How often a binary glyph may flip.
  flickerMs: number;
  theme: PixelRevealTheme;
}

export type PixelRevealConfigOverrides = Partial<Omit<PixelRevealConfig, "theme">> & { theme?: Partial<PixelRevealTheme> };

export const DEFAULT_PIXEL_REVEAL_CONFIG: PixelRevealConfig = {
  framesPerSecond: 30,
  maxPixelRatio: 2,
  binaryMs: 1100,
  pixelsMs: 1400,
  enhanceMs: 1000,
  binaryCell: 7,
  blockSizes: [20, 12, 8, 5, 3],
  flickerMs: 110,
  theme: { background: "#101010", signal: "#4bffa5", spark: "#eafff3" },
};

export const resolvePixelRevealConfig = ({ theme, ...overrides }: PixelRevealConfigOverrides = {}): PixelRevealConfig => ({
  ...DEFAULT_PIXEL_REVEAL_CONFIG,
  ...overrides,
  theme: { ...DEFAULT_PIXEL_REVEAL_CONFIG.theme, ...theme },
});
