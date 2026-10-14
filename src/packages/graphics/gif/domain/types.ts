// A colour in the palette, as red, green and blue from 0 to 255.
export type GifColour = readonly [number, number, number];

// One frame: a palette index for every pixel, row by row across the whole image, and how long it shows.
export interface GifFrame {
  indices: Uint8Array;
  delayMs: number;
}

// An image as a GIF holds it: its size, one palette of at most 256 colours shared by every frame, and the frames. Left
// without `loops` it plays once and rests on its last frame; 0 plays it for ever, and any other number plays it that
// many times more after the first.
export interface GifImage {
  width: number;
  height: number;
  palette: readonly GifColour[];
  frames: readonly GifFrame[];
  loops?: number;
}
