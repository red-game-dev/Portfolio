import type { TextureData } from "@/packages/graphics/stage3d";
import { smoothstep } from "@/packages/math/easing";

import { FingerAnatomy, HandAnatomy } from "../domain/types";

// The back of the hand as a map looked straight down on it, which the skin's shader reads: in red, how far a vein
// under the skin raises it; in green, how much of the vein's blue shows through; in blue, how thick its fine hair
// grows. The veins follow the hand's anatomy: one up each gap between the metacarpals, joining the arch across the
// back of the hand, which drains into the vein up the thumb's side of the wrist and the one up the little finger's,
// each wandering a little as real veins do. The hair is thickest on the forearm, thinning over the back of the hand
// to almost none at the knuckles. The palm and wrist do not move between poses, so one map serves every pose.

export interface SkinMapArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// The map's size in texels: about 0.4 millimetres each.
const TEXELS = { width: 256, height: 512 } as const;

interface Vein {
  points: Array<[number, number]>;
  // Its radius at its start and its end, in millimetres, and how much of its blue shows.
  radius: [number, number];
  showing: number;
}

// How far a vein wanders from its course, in millimetres, and how often.
const WANDER = { amplitude: 1.1, slow: 0.19, quick: 0.47 } as const;

// The part of the hand the map covers: the forearm the hand comes with up to just past the knuckles.
export const skinMapArea = (anatomy: HandAnatomy): SkinMapArea => {
  const top = Math.max(...Object.values(anatomy.fingers).map((finger) => finger.knuckle.y)) + 6;
  const bottom = -anatomy.forearm.length - 6;
  const half = anatomy.forearm.width / 2 + 18;

  return { x: -half, y: bottom, width: half * 2, height: top - bottom };
};

// Where a point of the hand falls on the map, 0 to 1 each way.
export const mapPlace = (area: SkinMapArea, x: number, y: number): [number, number] => [(x - area.x) / area.width, (y - area.y) / area.height];

const veinsOf = (anatomy: HandAnatomy): Vein[] => {
  const { fingers, wrist, forearm } = anatomy;
  // A point up the gap between two metacarpals, from their bases (0) to their knuckles (1).
  const gap = (a: FingerAnatomy, b: FingerAnatomy, share: number): [number, number] => {
    const base = [(a.base.x + b.base.x) / 2, (a.base.y + b.base.y) / 2];
    const knuckle = [(a.knuckle.x + b.knuckle.x) / 2, (a.knuckle.y + b.knuckle.y) / 2];

    return [base[0] + (knuckle[0] - base[0]) * share, base[1] + (knuckle[1] - base[1]) * share];
  };
  const { index, middle, ring, pinky } = fingers;
  const radial: [number, number] = [index.base.x - 13, index.base.y + 8];
  const ulnar: [number, number] = [pinky.base.x + 10, pinky.base.y + 12];

  return [
    // Up each gap from just short of the knuckles to the arch.
    { points: [gap(index, middle, 0.82), gap(index, middle, 0.55), gap(index, middle, 0.27)], radius: [0.9, 1.3], showing: 0.8 },
    { points: [gap(middle, ring, 0.84), gap(middle, ring, 0.58), gap(middle, ring, 0.3)], radius: [0.9, 1.3], showing: 0.8 },
    { points: [gap(ring, pinky, 0.8), gap(ring, pinky, 0.52), gap(ring, pinky, 0.25)], radius: [0.85, 1.25], showing: 0.75 },
    // A branch across between two of them.
    { points: [gap(middle, ring, 0.6), gap(index, middle, 0.42)], radius: [0.75, 0.85], showing: 0.6 },
    // The arch across the back of the hand.
    { points: [ulnar, gap(ring, pinky, 0.25), gap(middle, ring, 0.3), gap(index, middle, 0.27), radial], radius: [1.4, 1.5], showing: 0.9 },
    // Up the thumb's side of the wrist and on up the forearm, and up the little finger's.
    { points: [radial, [-wrist.width / 2 + 5, 10], [-wrist.width / 2 + 3, -20], [-forearm.width / 2 + 9, -forearm.length - 6]], radius: [1.6, 2], showing: 1 },
    { points: [ulnar, [wrist.width / 2 - 6, 8], [wrist.width / 2 - 9, -25], [forearm.width / 2 - 15, -forearm.length - 6]], radius: [1.5, 1.8], showing: 0.9 },
  ];
};

// A vein's course in short steps, each pushed a little to one side.
const wandering = (vein: Vein, seed: number): Array<{ x: number; y: number; radius: number }> => {
  const lengths = vein.points.slice(1).map((point, index) => Math.hypot(point[0] - vein.points[index][0], point[1] - vein.points[index][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const steps = Math.max(2, Math.ceil(total / 2));
  const course: Array<{ x: number; y: number; radius: number }> = [];

  for (let step = 0; step <= steps; step += 1) {
    let left = (step / steps) * total;
    let segment = 0;

    while (segment < lengths.length - 1 && left > lengths[segment]) {
      left -= lengths[segment];
      segment += 1;
    }

    const [ax, ay] = vein.points[segment];
    const [bx, by] = vein.points[segment + 1];
    const t = lengths[segment] > 0 ? Math.min(left / lengths[segment], 1) : 0;
    const share = step / steps;
    const along = share * total;
    const nx = -(by - ay) / (lengths[segment] || 1);
    const ny = (bx - ax) / (lengths[segment] || 1);
    // Still at both ends, so it meets the veins it joins.
    const wander = WANDER.amplitude * Math.sin(Math.PI * share)
      * (0.6 * Math.sin(along * WANDER.slow + seed * 1.7) + 0.4 * Math.sin(along * WANDER.quick + seed * 2.9));

    course.push({ x: ax + (bx - ax) * t + nx * wander, y: ay + (by - ay) * t + ny * wander, radius: vein.radius[0] + (vein.radius[1] - vein.radius[0]) * share });
  }

  return course;
};

// How thick the fine hair grows at a point: thickest on the forearm, thinning towards the knuckles, a little uneven.
const hairAt = (anatomy: HandAnatomy, x: number, y: number): number => {
  const knuckles = Math.min(...Object.values(anatomy.fingers).map((finger) => finger.knuckle.y));
  const thinning = 1 - smoothstep(-10, knuckles - 4, y) * 0.88;
  const uneven = 0.85 + 0.15 * Math.sin(x * 0.31 + y * 0.17) * Math.sin(x * 0.13 - y * 0.29);

  return Math.min(1, thinning * uneven);
};

export const skinMap = (anatomy: HandAnatomy): TextureData => {
  const area = skinMapArea(anatomy);
  const { width, height } = TEXELS;
  const data = new Uint8Array(width * height * 4);
  const raise = new Float32Array(width * height);
  const blue = new Float32Array(width * height);
  const texel = { x: area.width / width, y: area.height / height };

  veinsOf(anatomy).forEach((vein, seed) => {
    const course = wandering(vein, seed);

    course.slice(1).forEach((end, index) => {
      const start = course[index];
      const reach = Math.max(start.radius, end.radius) * 2.4;
      const fromX = Math.max(0, Math.floor((Math.min(start.x, end.x) - reach - area.x) / texel.x));
      const toX = Math.min(width - 1, Math.ceil((Math.max(start.x, end.x) + reach - area.x) / texel.x));
      const fromY = Math.max(0, Math.floor((Math.min(start.y, end.y) - reach - area.y) / texel.y));
      const toY = Math.min(height - 1, Math.ceil((Math.max(start.y, end.y) + reach - area.y) / texel.y));
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length2 = dx * dx + dy * dy || 1;

      for (let row = fromY; row <= toY; row += 1) {
        for (let column = fromX; column <= toX; column += 1) {
          const x = area.x + (column + 0.5) * texel.x;
          const y = area.y + (row + 0.5) * texel.y;
          const t = Math.min(Math.max(((x - start.x) * dx + (y - start.y) * dy) / length2, 0), 1);
          const distance = Math.hypot(x - start.x - dx * t, y - start.y - dy * t);
          const radius = start.radius + (end.radius - start.radius) * t;
          const at = row * width + column;
          const across = (distance / radius) ** 2;

          raise[at] = Math.max(raise[at], Math.exp(-1.6 * across));
          blue[at] = Math.max(blue[at], vein.showing * Math.exp(-2.2 * across));
        }
      }
    });
  });

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const at = row * width + column;
      const x = area.x + (column + 0.5) * texel.x;
      const y = area.y + (row + 0.5) * texel.y;

      data[at * 4] = Math.round(raise[at] * 255);
      data[at * 4 + 1] = Math.round(blue[at] * 255);
      data[at * 4 + 2] = Math.round(hairAt(anatomy, x, y) * 255);
      data[at * 4 + 3] = 255;
    }
  }

  return { width, height, data };
};
