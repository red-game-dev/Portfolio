import { clamp01 } from "@/packages/math/clamp";

export { mixRgb, rgba } from "@/packages/graphics/colour";
export type { Rgb } from "@/packages/graphics/colour";

// Rises from 0 to 1 and back to 0 as progress runs 0 to 1: the shape of a flash.
export const pulse = (progress: number) => Math.sin(Math.PI * clamp01(progress));
