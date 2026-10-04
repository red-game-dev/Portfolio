import { RandomSource } from "@/packages/math/random";

export interface RainGrid {
  width: number;
  height: number;
  fontSize: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
}

export interface RainStream {
  // Row of the leading glyph. Fractional, so speed does not depend on the frame rate.
  head: number;
  // Rows per second.
  speed: number;
  // Trail length in rows, including the head.
  length: number;
}

export interface RainColumn {
  glyphs: string[];
  stream: RainStream;
}

export interface RainMessageCell {
  column: number;
  row: number;
  // A space is a real cell: it locks like a letter and keeps the rain out of the gaps between words.
  glyph: string;
  order: number;
  lockedAt: number | null;
}

// Mutated in place by the simulation, so a frame allocates nothing.
export interface RainState {
  grid: RainGrid;
  columns: RainColumn[];
  message: RainMessageCell[];
  // One byte per grid cell, 1 where a letter has locked. The renderer checks it for every glyph it
  // draws, so it is a flat typed array rather than a map.
  locked: Uint8Array;
  armedAt: number | null;
}

// Supplies the characters that fall. Binary by default; any character set plugs in.
export interface GlyphSource {
  next(random: RandomSource): string;
}

// The only thing that touches pixels. The canvas renderer is the default; WebGL, DOM or a test spy
// only have to implement these two calls.
export interface RainRenderer {
  resize(grid: RainGrid, pixelRatio: number): void;
  draw(state: RainState, now: number): void;
}
