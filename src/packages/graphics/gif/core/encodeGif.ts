import { ValidationError } from "@/packages/core/domain";

import { GifImage } from "../domain/types";
import { gifProblems } from "../validators/gifProblems";
import { ByteWriter } from "./ByteWriter";
import { writeLzw } from "./lzw";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Shown {
  indices: Uint8Array;
  delayMs: number;
  rect: Rect;
}

// The screen descriptor's flags: a palette for the whole image, its colours eight bits a channel (its size goes in the low
// three bits); and a frame's, left in place for the next to draw over (disposal 1, in bits 2 to 4), no transparent colour.
const WHOLE_PALETTE = 0x80 + 0x70;
const LEAVE_IN_PLACE = 4;

// Browsers stretch a delay under two hundredths of a second to a tenth, so none is written shorter.
const LEAST_DELAY = 2;
const MOST_DELAY = 0xffff;

// The rectangle where two frames differ, or null where they are the same.
const changedRect = (from: Uint8Array, to: Uint8Array, width: number, height: number): Rect | null => {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (from[y * width + x] !== to[y * width + x]) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  return right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
};

const crop = (indices: Uint8Array, width: number, rect: Rect): Uint8Array => {
  const out = new Uint8Array(rect.width * rect.height);

  for (let row = 0; row < rect.height; row += 1) {
    const start = (rect.top + row) * width + rect.left;

    out.set(indices.subarray(start, start + rect.width), row * rect.width);
  }

  return out;
};

// The frames as they will be written: one the same as the frame before only lengthens it, and each other is cut to the
// rectangle where it differs from the one before and drawn over it, so a frame where little moves costs little.
const shownFrames = ({ width, height, frames }: GifImage): Shown[] => {
  const shown: Shown[] = [];
  let previous: Uint8Array | null = null;

  for (const { indices, delayMs } of frames) {
    const rect = previous ? changedRect(previous, indices, width, height) : { left: 0, top: 0, width, height };

    if (!rect) {
      shown[shown.length - 1].delayMs += delayMs;
    } else {
      shown.push({ indices, delayMs, rect });
      previous = indices;
    }
  }

  return shown;
};

// An image as GIF89a bytes: its screen and one palette for every frame, a loop count where it repeats, then each frame
// with its delay, compressed by LZW. Throws a ValidationError naming every problem with an image that cannot be written.
export const encodeGif = (image: GifImage): Uint8Array => {
  const problems = gifProblems(image);

  if (problems.length > 0) {
    throw new ValidationError(problems);
  }

  const { width, height, palette, loops } = image;
  // The palette is written as a power of two colours, at least two; codes start a bit wider, at least three bits.
  const tableBits = Math.max(1, Math.ceil(Math.log2(palette.length)));
  const leastCodeSize = Math.max(2, tableBits);
  const out = new ByteWriter();

  out.text("GIF89a").word(width)
    .word(height)
    .byte(WHOLE_PALETTE + tableBits - 1)
    .byte(0)
    .byte(0);

  for (let index = 0; index < 2 ** tableBits; index += 1) {
    out.bytes(palette[index] ?? [0, 0, 0]);
  }

  if (loops !== undefined) {
    out.byte(0x21).byte(0xff)
      .byte(11)
      .text("NETSCAPE2.0")
      .byte(3)
      .byte(1)
      .word(loops)
      .byte(0);
  }

  for (const { indices, delayMs, rect } of shownFrames(image)) {
    const delay = Math.min(MOST_DELAY, Math.max(LEAST_DELAY, Math.round(delayMs / 10)));

    out.byte(0x21).byte(0xf9)
      .byte(4)
      .byte(LEAVE_IN_PLACE)
      .word(delay)
      .byte(0)
      .byte(0);
    out.byte(0x2c).word(rect.left)
      .word(rect.top)
      .word(rect.width)
      .word(rect.height)
      .byte(0);
    writeLzw(out, crop(indices, width, rect), leastCodeSize);
  }

  return out.byte(0x3b).result();
};
