import { createWarmedRandom } from "@/packages/math/random";

import { Relief } from "../domain/types";

// How tall each layer of land stands for each kind of ground, as a share of the view's height: the far range, the
// middle distance and the ground near by. Ridged land has sharp crests; smooth land rolls.
export const RELIEF: Readonly<Record<Relief, { heights: [number, number, number]; isRidged: boolean }>> = {
  sea: { heights: [0, 0, 0], isRidged: false },
  flat: { heights: [0.014, 0.007, 0.002], isRidged: false },
  dunes: { heights: [0.03, 0.05, 0.028], isRidged: false },
  hills: { heights: [0.06, 0.045, 0.02], isRidged: false },
  mountains: { heights: [0.17, 0.09, 0.03], isRidged: true },
  craters: { heights: [0.035, 0.02, 0.008], isRidged: false },
  ice: { heights: [0.045, 0.018, 0.004], isRidged: true },
  forest: { heights: [0.05, 0.03, 0.01], isRidged: false },
};

const OCTAVES: ReadonlyArray<{ points: number; weight: number }> = [
  { points: 4, weight: 1 },
  { points: 9, weight: 0.45 },
  { points: 23, weight: 0.18 },
];

// Smooth between two values, so the line has no corners.
const blend = (from: number, to: number, t: number) => from + (to - from) * (1 - Math.cos(t * Math.PI)) / 2;

// Heights across the view from 0 to 1 for one layer of land, sampled `count` times from left to right: value noise
// summed over three octaves from the seed, folded into sharp crests where the land is ridged. The same seed and
// layer always give the same line.
export const ridgeline = (relief: Relief, seed: number, layer: number, count: number): Float32Array => {
  const random = createWarmedRandom(seed * 7919 + layer * 104729 + 13, 4);
  const heights = new Float32Array(count);
  const total = OCTAVES.reduce((sum, { weight }) => sum + weight, 0);

  OCTAVES.forEach(({ points, weight }) => {
    const knots = Array.from({ length: points + 1 }, () => random());

    for (let index = 0; index < count; index += 1) {
      const at = (index / Math.max(1, count - 1)) * points;
      const knot = Math.min(points - 1, Math.floor(at));

      heights[index] += (blend(knots[knot], knots[knot + 1], at - knot) * weight) / total;
    }
  });

  if (RELIEF[relief].isRidged) {
    for (let index = 0; index < count; index += 1) {
      heights[index] = 1 - Math.abs(heights[index] * 2 - 1);
    }
  }

  return heights;
};
