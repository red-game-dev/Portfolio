import { ZoneId } from "@/config/zones";
import { clamp } from "@/packages/math/clamp";

// The share card as a film of the journey: eight seconds at thirty frames, recorded frame by frame from the page.
export const CARD_MS = 8000;
export const CARD_FPS = 30;

// The name decodes from binary first, the role and the line under it a moment after.
const DECODE: Readonly<Record<"name" | "role" | "availability", readonly [number, number]>> = {
  name: [150, 1250],
  role: [450, 1650],
  availability: [700, 1900],
};

// Then each universe lights in turn on the band, the backdrop crossing into it, the last into the stars, and the card
// holds still to the end so the loop's last frame is the picture shown where nothing plays.
const ZONES_FROM = 1100;
const ZONE_MS = 720;
const FIGURES: readonly [number, number] = [1400, 5300];

export interface CardFrame {
  // How much of each line has resolved out of its bits, 0 to 1.
  name: number;
  role: number;
  availability: number;
  // How far the figures have counted up, 0 to 1.
  figures: number;
  // How many universes are lit on the band, with a fraction while one fills.
  lit: number;
  // The universe the backdrop is in.
  zone: ZoneId;
  // A frame count, for the bits that flicker while they wait.
  tick: number;
}

const share = (ms: number, [from, to]: readonly [number, number]) => clamp((ms - from) / (to - from), 0, 1);

export const cardAt = (ms: number, zones: readonly ZoneId[]): CardFrame => {
  const lit = clamp((ms - ZONES_FROM) / ZONE_MS, 0, zones.length);
  const zone = zones[clamp(Math.floor(lit), 0, zones.length - 1)] ?? zones[0];

  return {
    name: share(ms, DECODE.name),
    role: share(ms, DECODE.role),
    availability: share(ms, DECODE.availability),
    figures: share(ms, FIGURES),
    lit,
    zone,
    tick: Math.floor(ms / (1000 / CARD_FPS)),
  };
};

// A figure as it counts up: "200M+" reads "0M+" at the start and "200M+" at the end, keeping its sign, its unit and
// its decimals; a figure with no number in it is shown whole.
export const countUp = (value: string, progress: number): string => {
  const match = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);

  if (!match) {
    return value;
  }

  const [, before, digits, after] = match;
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  const shown = (Number(digits) * clamp(progress, 0, 1)).toFixed(decimals);

  return `${before}${shown}${after}`;
};
