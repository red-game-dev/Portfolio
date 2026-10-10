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

// Rises from 0 to 1 and back to 0 as progress runs 0 to 1: the shape of a flash.
export const pulse = (progress: number): number => Math.sin(Math.PI * clamp01(progress));

// 0 below `from`, 1 above `to`, easing smoothly between: for anything that fades in over a range.
export const smoothstep = (from: number, to: number, value: number): number => easeInOut((value - from) / (to - from));
