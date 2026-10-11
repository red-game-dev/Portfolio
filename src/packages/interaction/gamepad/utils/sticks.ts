import { clamp01 } from "@/packages/math/clamp";

import { GamepadLike, Stick } from "../domain/types";

// One axis of a controller, 0 where it has none or reports something that is not a number.
export const axisAt = (pad: GamepadLike, index: number): number => {
  const value = pad.axes[index];

  return value !== undefined && Number.isFinite(value) ? value : 0;
};

// A stick's raw lean read through a radial dead zone into `out`. The dead zone is measured round the circle rather
// than per axis, so a stick drifting on both axes still rests at exactly 0 and a lean along a diagonal keeps its
// direction. Past the dead zone the lean is stretched to start again from 0 and reach 1 at `edge`, so there is no
// jump where the dead zone ends, and it never runs longer than 1, so a square gate's corner reads like full tilt.
export const readStick = (out: Stick, x: number, y: number, deadZone: number, edge: number): Stick => {
  const length = Math.sqrt(x * x + y * y);

  if (!(length > deadZone)) {
    out.x = 0;
    out.y = 0;

    return out;
  }

  const span = edge - deadZone;
  const scaled = span > 0 ? Math.min(1, (length - deadZone) / span) : 1;

  out.x = (x / length) * scaled;
  out.y = (y / length) * scaled;

  return out;
};

// Shortens a lean in place to at most `max` long, keeping its direction.
export const clampLength = (out: Stick, max: number): Stick => {
  const length = Math.sqrt(out.x * out.x + out.y * out.y);

  if (length > max) {
    out.x = (out.x / length) * max;
    out.y = (out.y / length) * max;
  }

  return out;
};

// How far a trigger is squeezed past its dead zone, stretched to run from 0 to 1.
export const triggerTravel = (value: number, deadZone: number): number => {
  if (!(value > deadZone)) {
    return 0;
  }

  return deadZone < 1 ? clamp01((value - deadZone) / (1 - deadZone)) : 1;
};
