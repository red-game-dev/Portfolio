import { clamp01 } from "@/packages/math/clamp";

// Starts and ends slowly: the curve for anything that should settle rather than stop.
export const easeInOut = (value: number): number => {
  const t = clamp01(value);

  return t * t * (3 - 2 * t);
};

// Starts slowly and keeps speeding up, like something pushing off.
export const easeIn = (value: number): number => {
  const t = clamp01(value);

  return t * t;
};

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;
