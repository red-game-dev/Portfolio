import { GifColour } from "../domain/types";

export interface QuantizeOptions {
  // How many colours the palette may hold, the fixed ones among them.
  colours?: number;
  // Colours the palette keeps exactly, and that a pixel of exactly that colour always gets: a background the image must
  // meet without a seam.
  fixed?: readonly GifColour[];
}

export interface Quantized {
  palette: GifColour[];
  frames: Uint8Array[];
}

// Colours are counted at five bits a channel, in 32768 bins: close enough for a palette of 256 and small enough to sort.
const LEVELS = 32;
const STEP = 256 / LEVELS;

const binOf = (red: number, green: number, blue: number) =>
  Math.floor(red / STEP) * LEVELS * LEVELS + Math.floor(green / STEP) * LEVELS + Math.floor(blue / STEP);

const channelOf = (bin: number, channel: number) => Math.floor(bin / LEVELS ** (2 - channel)) % LEVELS;

interface Box {
  bins: number[];
  count: number;
}

// The channel a box is widest in, and how wide.
const widest = ({ bins }: Box): [number, number] => [0, 1, 2]
  .map((channel): [number, number] => {
    let least = LEVELS;
    let most = -1;

    for (const bin of bins) {
      least = Math.min(least, channelOf(bin, channel));
      most = Math.max(most, channelOf(bin, channel));
    }

    return [channel, most - least];
  })
  .reduce((best, next) => (next[1] > best[1] ? next : best));

// A box cut in two along its widest channel where half its pixels fall each side.
const split = (box: Box, counts: Uint32Array): [Box, Box] => {
  const [channel] = widest(box);
  const sorted = [...box.bins].sort((one, two) => channelOf(one, channel) - channelOf(two, channel));
  let running = 0;
  let cut = 1;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    running += counts[sorted[index]];
    cut = index + 1;

    if (running >= box.count / 2) {
      break;
    }
  }

  const low = sorted.slice(0, cut);
  const high = sorted.slice(cut);
  const countOf = (bins: number[]) => bins.reduce((total, bin) => total + counts[bin], 0);

  return [{ bins: low, count: countOf(low) }, { bins: high, count: countOf(high) }];
};

const distance = (one: GifColour, two: GifColour) => (one[0] - two[0]) ** 2 + (one[1] - two[1]) ** 2 + (one[2] - two[2]) ** 2;

// Frames of full colour pixels (three bytes each, row by row) as one palette shared by all of them and each frame's
// indices into it, by median cut: the colours every frame uses, counted together, are cut into boxes until there are
// as many as the palette holds, each box giving the average of its colours, and every pixel takes the nearest.
export const quantize = (frames: readonly Uint8Array[], { colours = 256, fixed = [] }: QuantizeOptions = {}): Quantized => {
  const counts = new Uint32Array(LEVELS ** 3);
  const sums = new Float64Array(LEVELS ** 3 * 3);
  const exact = new Map(fixed.map(([red, green, blue], index) => [red * 65536 + green * 256 + blue, index]));
  const room = Math.max(0, colours - fixed.length);

  // A pixel of a fixed colour already has its place, so it is not counted towards the others.
  for (const pixels of frames) {
    for (let offset = 0; offset < pixels.length; offset += 3) {
      if (exact.has(pixels[offset] * 65536 + pixels[offset + 1] * 256 + pixels[offset + 2])) {
        continue;
      }

      const bin = binOf(pixels[offset], pixels[offset + 1], pixels[offset + 2]);

      counts[bin] += 1;
      sums[bin * 3] += pixels[offset];
      sums[bin * 3 + 1] += pixels[offset + 1];
      sums[bin * 3 + 2] += pixels[offset + 2];
    }
  }

  const used = Array.from(counts.keys()).filter((bin) => counts[bin] > 0);
  const boxes: Box[] = used.length > 0 && room > 0 ? [{ bins: used, count: used.reduce((total, bin) => total + counts[bin], 0) }] : [];

  // The box most worth cutting is the one with the most pixels spread the widest.
  while (boxes.length < room) {
    const candidates = boxes.filter(({ bins }) => bins.length > 1);

    if (candidates.length === 0) {
      break;
    }

    const box = candidates.reduce((best, next) => (next.count * widest(next)[1] > best.count * widest(best)[1] ? next : best));

    boxes.splice(boxes.indexOf(box), 1, ...split(box, counts));
  }

  const averageOf = ({ bins, count }: Box): GifColour => [0, 1, 2]
    .map((channel) => Math.round(bins.reduce((total, bin) => total + sums[bin * 3 + channel], 0) / count)) as unknown as GifColour;
  const palette: GifColour[] = [...fixed, ...boxes.map(averageOf)];
  const nearest = new Int16Array(LEVELS ** 3).fill(-1);

  const indexOf = (red: number, green: number, blue: number): number => {
    const fixedIndex = exact.get(red * 65536 + green * 256 + blue);

    if (fixedIndex !== undefined) {
      return fixedIndex;
    }

    const bin = binOf(red, green, blue);

    if (nearest[bin] < 0) {
      const colour: GifColour = [sums[bin * 3] / counts[bin], sums[bin * 3 + 1] / counts[bin], sums[bin * 3 + 2] / counts[bin]];

      nearest[bin] = palette.reduce((best, entry, index) => (distance(entry, colour) < distance(palette[best], colour) ? index : best), 0);
    }

    return nearest[bin];
  };

  return {
    palette,
    frames: frames.map((pixels) => Uint8Array.from({ length: pixels.length / 3 }, (_, index) =>
      indexOf(pixels[index * 3], pixels[index * 3 + 1], pixels[index * 3 + 2]))),
  };
};
