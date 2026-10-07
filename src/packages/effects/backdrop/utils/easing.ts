import { clamp01 } from "@/packages/math/clamp";

export { clamp01 };

export const easeInOut = (value: number) => {
  const t = clamp01(value);

  return t * t * (3 - 2 * t);
};
