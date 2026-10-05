export type Rgb = [number, number, number];

export const mixRgb = (from: Rgb, to: Rgb, amount: number): Rgb => [0, 1, 2].map((index) => Math.round(from[index] + (to[index] - from[index]) * amount)) as Rgb;

export const rgba = ([red, green, blue]: Rgb, alpha: number) => `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;

// Rises from 0 to 1 and back to 0 as progress runs 0 to 1: the shape of a flash.
export const pulse = (progress: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, progress)));
