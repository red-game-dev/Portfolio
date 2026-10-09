import { Vec2 } from "../domain/types";

export const length = (x: number, y: number): number => Math.hypot(x, y);

export const distance = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.y - a.y);

// The angle of a direction, counter clockwise from +x in a y up frame (clockwise on a y down screen).
export const angleOf = (x: number, y: number): number => Math.atan2(y, x);

// The shortest signed turn from one angle to another, in (-PI, PI].
export const angleBetween = (from: number, to: number): number => {
  const turn = (to - from) % (Math.PI * 2);

  if (turn > Math.PI) {
    return turn - Math.PI * 2;
  }

  return turn <= -Math.PI ? turn + Math.PI * 2 : turn;
};

// A unit vector for an angle, written into `out`.
export const directionInto = (angle: number, out: Vec2): Vec2 => {
  out.x = Math.cos(angle);
  out.y = Math.sin(angle);

  return out;
};

// `value` with its length capped at `max`, written into `out`.
export const clampLengthInto = (x: number, y: number, max: number, out: Vec2): Vec2 => {
  const size = Math.hypot(x, y);
  const scale = size > max && size > 0 ? max / size : 1;

  out.x = x * scale;
  out.y = y * scale;

  return out;
};
