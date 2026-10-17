import { dot, sub, Vec3 } from "@/packages/math/space";

import { DigitFrame } from "./skeleton";

// Where a point lies along a digit: the segment (between joint `segment` and the next) it is nearest, how far along
// that segment it projects (millimetres from its start, clamped to the segment), and how far it is from the axis.
export interface ChainPlace {
  segment: number;
  along: number;
  length: number;
  away: number;
}

export const placeOnChain = (frame: DigitFrame, point: Vec3): ChainPlace => {
  let best: ChainPlace = { segment: 0, along: 0, length: 1, away: Number.POSITIVE_INFINITY };

  for (let segment = 0; segment < frame.joints.length - 1; segment += 1) {
    const start = frame.joints[segment];
    const end = frame.joints[segment + 1];
    const axis = sub(end, start);
    const length = Math.hypot(axis.x, axis.y, axis.z);
    const offset = sub(point, start);
    const along = Math.min(Math.max(dot(offset, axis) / length, 0), length);
    const t = along / length;
    const nearest = { x: start.x + axis.x * t, y: start.y + axis.y * t, z: start.z + axis.z * t };
    const away = Math.hypot(point.x - nearest.x, point.y - nearest.y, point.z - nearest.z);

    if (away < best.away) {
      best = { segment, along, length, away };
    }
  }

  return best;
};

// The smooth step from 0 at `-width` to 1 at `width`.
export const blendAcross = (offset: number, width: number): number => {
  const t = Math.min(Math.max((offset + width) / (2 * width), 0), 1);

  return t * t * (3 - 2 * t);
};
