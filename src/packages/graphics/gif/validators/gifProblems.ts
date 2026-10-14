import { GifImage } from "../domain/types";

// The largest a GIF's sides and palette can be.
const MOST_SIDE = 0xffff;
const MOST_COLOURS = 256;

const isByte = (value: number) => Number.isInteger(value) && value >= 0 && value <= 255;

// Everything wrong with an image before it is written: its size, its palette, each frame's length, indices and delay,
// and how often it loops.
export const gifProblems = ({ width, height, palette, frames, loops }: GifImage): string[] => {
  const problems: string[] = [];
  const pixels = width * height;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > MOST_SIDE || height > MOST_SIDE) {
    problems.push(`size ${width} by ${height} is not between 1 and ${MOST_SIDE} on each side`);
  }

  if (palette.length < 1 || palette.length > MOST_COLOURS) {
    problems.push(`palette has ${palette.length} colours, not 1 to ${MOST_COLOURS}`);
  }

  palette.forEach((colour, index) => {
    if (colour.length !== 3 || !colour.every(isByte)) {
      problems.push(`palette colour ${index} is not three bytes`);
    }
  });

  if (frames.length === 0) {
    problems.push("there are no frames");
  }

  frames.forEach(({ indices, delayMs }, index) => {
    if (indices.length !== pixels) {
      problems.push(`frame ${index} has ${indices.length} pixels, not ${pixels}`);
    } else if (indices.some((value) => value >= palette.length)) {
      problems.push(`frame ${index} names a colour past the palette`);
    }

    if (!Number.isFinite(delayMs) || delayMs < 0) {
      problems.push(`frame ${index} has no delay it can show for`);
    }
  });

  if (loops !== undefined && (!Number.isInteger(loops) || loops < 0 || loops > MOST_SIDE)) {
    problems.push(`loops ${loops} is not a whole number from 0 to ${MOST_SIDE}`);
  }

  return problems;
};
