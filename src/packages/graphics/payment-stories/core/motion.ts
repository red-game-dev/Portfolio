import { clamp01 } from "@/packages/math/clamp";

import { Point, StoryWire } from "../domain/types";

// 0 before `from`, 1 after `to`, straight between.
export const span = (t: number, from: number, to: number): number => clamp01((t - from) / Math.max(to - from, 1e-6));

// Eased in and out, quick in the middle: a payment leaving and arriving.
export const glide = (value: number): number => (value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2);

// Eased out: quick then settling, for something landing.
export const settle = (value: number): number => 1 - (1 - value) ** 3;

// A rise and fall over a window, 0 outside it.
export const flash = (t: number, from: number, to: number): number => (t <= from || t >= to ? 0 : Math.sin(Math.PI * span(t, from, to)));

// The point `at` of the way along a wire, a quadratic curve bowed by its bend at right angles to it.
export const along = (wire: Pick<StoryWire, "from" | "to" | "bend">, at: number): Point => {
  const { from, to, bend } = wire;
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const control = { x: middle.x - ((to.y - from.y) / length) * bend, y: middle.y + ((to.x - from.x) / length) * bend };
  const rest = 1 - at;

  return {
    x: rest * rest * from.x + 2 * rest * at * control.x + at * at * to.x,
    y: rest * rest * from.y + 2 * rest * at * control.y + at * at * to.y,
  };
};
