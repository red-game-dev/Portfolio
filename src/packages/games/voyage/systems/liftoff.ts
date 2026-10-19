import { angleBetween } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { VoyageState } from "../domain/state";

// Within this far (world units) a world counts as close by on a lift off, and one within this angle of straight up
// tips the climb aside until it is that far off. However many tip it, the climb stays within that angle of straight
// up, so it never turns into the ground.
const NEARBY = 3;
const CLEAR_ANGLE = Math.PI / 3;

// The way a lift off climbs from a spot on the ground: straight up, tipped aside from any world close by and nearly
// overhead (Earth over the Moon's near side, the Moon over a run's first climb from Earth).
export const climbDirection = (
  bodies: ReadonlyArray<{ id: string; x: number; y: number; radius: number }>, ground: { id: string; x: number; y: number }, at: { x: number; y: number },
): { x: number; y: number } => {
  const normal = Math.atan2(at.y - ground.y, at.x - ground.x);
  let angle = normal;

  bodies.forEach((other) => {
    const towardX = other.x - at.x;
    const towardY = other.y - at.y;

    if (other.id === ground.id || Math.hypot(towardX, towardY) - other.radius > NEARBY) {
      return;
    }

    const toward = Math.atan2(towardY, towardX);
    const off = angleBetween(toward, angle);

    if (Math.abs(off) < CLEAR_ANGLE) {
      angle = toward + (off >= 0 ? CLEAR_ANGLE : -CLEAR_ANGLE);
    }
  });

  angle = normal + clamp(angleBetween(normal, angle), -CLEAR_ANGLE, CLEAR_ANGLE);

  return { x: Math.cos(angle), y: Math.sin(angle) };
};

// How much of gravity a ship climbing away from a world feels: none as it lifts off, all of it once the grace is over,
// so a giant's pull beside a moon cannot drag a short climb back down any more than the moon's own can.
export const gravityFelt = (state: VoyageState): number => {
  const { liftoff } = state;

  return liftoff && state.elapsedMs < liftoff.untilMs ? clamp((state.elapsedMs - liftoff.sinceMs) / (liftoff.untilMs - liftoff.sinceMs), 0, 1) : 1;
};
