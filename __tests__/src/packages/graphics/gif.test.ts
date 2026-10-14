import { ValidationError } from "@/packages/core/domain";
import { encodeGif, GifColour, gifProblems, GifImage, quantize } from "@/packages/graphics/gif";

import { decodeGif } from "./fixtures/decodeGif";

const GREYS: GifColour[] = Array.from({ length: 256 }, (_, index) => [index, index, index]);

// A repeatable scatter of indices, busy enough to fill the LZW table and make it start again.
const scatter = (count: number, seed: number, colours = 256) => {
  let state = seed;

  return Uint8Array.from({ length: count }, () => {
    state = (state * 48271) % 2147483647;

    return state % colours;
  });
};

describe("encodeGif", () => {
  test("writes frames that a reader gets back exactly, through a table that fills and starts again", () => {
    const image: GifImage = {
      width: 120,
      height: 90,
      palette: GREYS,
      frames: [{ indices: scatter(120 * 90, 7), delayMs: 40 }, { indices: scatter(120 * 90, 11), delayMs: 60 }],
    };
    const decoded = decodeGif(encodeGif(image));

    expect(decoded.width).toBe(120);
    expect(decoded.height).toBe(90);
    expect(decoded.palette).toEqual(GREYS.map((colour) => [...colour]));
    expect(decoded.frames.map(({ indices }) => Array.from(indices))).toEqual(image.frames.map(({ indices }) => Array.from(indices)));
    expect(decoded.frames.map(({ delay }) => delay)).toEqual([4, 6]);
  });

  test("keeps runs of one colour small and round trips them, smooth gradients included", () => {
    const flat = new Uint8Array(200 * 50).fill(3);
    const ramp = Uint8Array.from({ length: 200 * 50 }, (_, index) => Math.floor((index % 200) / 200 * 255));
    const bytes = encodeGif({ width: 200, height: 50, palette: GREYS, frames: [{ indices: flat, delayMs: 100 }, { indices: ramp, delayMs: 100 }] });
    const decoded = decodeGif(bytes);

    expect(Array.from(decoded.frames[0].indices)).toEqual(Array.from(flat));
    expect(Array.from(decoded.frames[1].indices)).toEqual(Array.from(ramp));
    // Ten thousand pixels of one colour come to a few hundred bytes at most, most of them the header and palette.
    expect(encodeGif({ width: 200, height: 50, palette: GREYS.slice(0, 4), frames: [{ indices: flat, delayMs: 100 }] }).length).toBeLessThan(250);
  });

  test("draws each frame over the last, cut to where it changed, and lengthens a frame instead of repeating it", () => {
    const first = new Uint8Array(40 * 20).fill(1);
    const second = first.slice();

    second[5 * 40 + 10] = 2;
    second[8 * 40 + 14] = 3;

    const decoded = decodeGif(encodeGif({
      width: 40,
      height: 20,
      palette: GREYS.slice(0, 4),
      frames: [{ indices: first, delayMs: 50 }, { indices: first.slice(), delayMs: 70 }, { indices: second, delayMs: 30 }],
    }));

    expect(decoded.frames).toHaveLength(2);
    expect(decoded.frames[0].delay).toBe(12);
    expect(decoded.frames[1].rect).toEqual({ left: 10, top: 5, width: 5, height: 4 });
    expect(decoded.frames.every(({ disposal }) => disposal === 1)).toBe(true);
    expect(Array.from(decoded.frames[1].indices)).toEqual(Array.from(second));
  });

  test("writes the end code at the width a reader has grown to by then", () => {
    // The table reaches a power of two on the last code here, so a reader widens before the end code.
    const indices = Uint8Array.of(0, 3, 2, 1, 1, 0, 3, 2, 2, 1, 0, 3, 3, 2, 1);
    const decoded = decodeGif(encodeGif({ width: 15, height: 1, palette: GREYS.slice(0, 4), frames: [{ indices, delayMs: 0 }] }));

    expect(Array.from(decoded.frames[0].indices)).toEqual(Array.from(indices));

    for (let seed = 1; seed <= 300; seed += 1) {
      const width = 5 + (seed % 40);
      const scattered = scatter(width * 3, seed, 2 + (seed % 7));

      expect(Array.from(decodeGif(encodeGif({ width, height: 3, palette: GREYS.slice(0, 8), frames: [{ indices: scattered, delayMs: 0 }] })).frames[0].indices))
        .toEqual(Array.from(scattered));
    }
  });

  test("writes a small palette as the power of two above it, with codes of at least three bits", () => {
    const three = decodeGif(encodeGif({ width: 2, height: 2, palette: GREYS.slice(0, 3), frames: [{ indices: Uint8Array.of(0, 1, 2, 1), delayMs: 0 }] }));
    const one = decodeGif(encodeGif({ width: 1, height: 1, palette: [[9, 9, 9]], frames: [{ indices: Uint8Array.of(0), delayMs: 0 }] }));

    expect(three.palette).toEqual([[0, 0, 0], [1, 1, 1], [2, 2, 2], [0, 0, 0]]);
    expect(three.frames[0].leastCodeSize).toBe(2);
    expect(one.palette).toEqual([[9, 9, 9], [0, 0, 0]]);
    expect(Array.from(one.frames[0].indices)).toEqual([0]);
  });

  test("plays once unless told to loop, and no delay is shorter than browsers keep", () => {
    const frame = { indices: Uint8Array.of(0), delayMs: 5 };
    const once = decodeGif(encodeGif({ width: 1, height: 1, palette: GREYS, frames: [frame] }));
    const always = decodeGif(encodeGif({ width: 1, height: 1, palette: GREYS, frames: [frame], loops: 0 }));
    const twice = decodeGif(encodeGif({ width: 1, height: 1, palette: GREYS, frames: [frame], loops: 1 }));

    expect(once.loops).toBeNull();
    expect(always.loops).toBe(0);
    expect(twice.loops).toBe(1);
    expect(once.frames[0].delay).toBe(2);
  });

  test("refuses an image it cannot write, naming everything wrong with it", () => {
    const bad: GifImage = {
      width: 2,
      height: 0,
      palette: [[0, 0, 300]],
      frames: [{ indices: Uint8Array.of(0, 4), delayMs: -1 }],
      loops: 1.5,
    };

    expect(gifProblems(bad)).toEqual([
      "size 2 by 0 is not between 1 and 65535 on each side",
      "palette colour 0 is not three bytes",
      "frame 0 has 2 pixels, not 0",
      "frame 0 has no delay it can show for",
      "loops 1.5 is not a whole number from 0 to 65535",
    ]);
    expect(gifProblems({ width: 1, height: 1, palette: GREYS, frames: [{ indices: Uint8Array.of(0), delayMs: 0 }] })).toEqual([]);
    expect(gifProblems({ width: 1, height: 1, palette: GREYS.slice(0, 2), frames: [{ indices: Uint8Array.of(5), delayMs: 0 }] }))
      .toEqual(["frame 0 names a colour past the palette"]);
    expect(gifProblems({ width: 1, height: 1, palette: [], frames: [] })).toEqual(["palette has 0 colours, not 1 to 256", "there are no frames"]);
    expect(() => encodeGif(bad)).toThrow(ValidationError);
  });
});

describe("quantize", () => {
  const rgb = (colours: number[][]) => Uint8Array.from(colours.flat());

  test("keeps a few colours exactly, and gives every pixel its own", () => {
    const frame = rgb([[200, 30, 40], [10, 220, 90], [200, 30, 40], [40, 40, 250]]);
    const { palette, frames } = quantize([frame]);

    expect(frames[0].length).toBe(4);
    expect(Array.from(frames[0]).map((index) => [...palette[index]])).toEqual([[200, 30, 40], [10, 220, 90], [200, 30, 40], [40, 40, 250]]);
  });

  test("keeps fixed colours first and exact, so an image meets its background without a seam", () => {
    const panel: GifColour = [16, 16, 16];
    // A colour a step off the panel shares its bin, and must not take the panel's place, nor the panel its.
    const { palette, frames } = quantize([rgb([[16, 16, 16], [17, 15, 18], [16, 16, 16]])], { fixed: [panel] });

    expect(palette[0]).toEqual(panel);
    expect(frames[0][0]).toBe(0);
    expect(frames[0][2]).toBe(0);
  });

  test("never makes a palette larger than it is allowed, nor spends a place on a copy of a fixed colour", () => {
    const black: GifColour = [0, 0, 0];
    const onlyFixed = quantize([rgb([[0, 0, 0], [250, 10, 10], [0, 0, 0]])], { colours: 1, fixed: [black] });
    const copy = quantize([rgb([[16, 16, 16], [16, 16, 16]])], { fixed: [[16, 16, 16]] });

    expect(onlyFixed.palette).toEqual([black]);
    expect(Array.from(onlyFixed.frames[0])).toEqual([0, 0, 0]);
    expect(copy.palette).toEqual([[16, 16, 16]]);
  });

  test("fits many colours across frames into the palette it is allowed, staying close to each", () => {
    const ramp = (shift: number) => rgb(Array.from({ length: 4096 }, (_, index) => [index % 256, (index * 7 + shift) % 256, Math.floor(index / 16)]));
    const frames = [ramp(0), ramp(90)];
    const result = quantize(frames, { colours: 64 });
    const error = frames.flatMap((pixels, frame) => Array.from(result.frames[frame], (index, pixel) =>
      Math.abs(result.palette[index][0] - pixels[pixel * 3]) + Math.abs(result.palette[index][1] - pixels[pixel * 3 + 1]) +
      Math.abs(result.palette[index][2] - pixels[pixel * 3 + 2])));

    expect(result.palette.length).toBeLessThanOrEqual(64);
    expect(error.reduce((total, value) => total + value, 0) / error.length).toBeLessThan(60);
  });
});
