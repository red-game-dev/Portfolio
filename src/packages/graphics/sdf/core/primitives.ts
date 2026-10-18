import { normalize, Vec3, vec3 } from "@/packages/math/space";

import { Box, Primitive } from "../domain/types";

// The shapes things are blended from, as signed distance fields, and the ways they join: round cones (a bone in its
// flesh, a neck), ellipsoids (a pad, a cheek, a skull), spheres, and the smooth minimum that blends them as flesh does.
// Written in plain numbers, since a mesher asks for them hundreds of thousands of times.

// The polynomial smooth minimum: the nearer of two, rounded where they come within `k` of each other.
export const smoothMin = (a: number, b: number, k: number): number => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;

  return Math.min(a, b) - h * h * k * 0.25;
};

export const boxOf = (points: Vec3[], pad: number): Box => ({
  min: vec3(Math.min(...points.map((p) => p.x)) - pad, Math.min(...points.map((p) => p.y)) - pad, Math.min(...points.map((p) => p.z)) - pad),
  max: vec3(Math.max(...points.map((p) => p.x)) + pad, Math.max(...points.map((p) => p.y)) + pad, Math.max(...points.map((p) => p.z)) + pad),
});

// How far a point is outside a box (0 inside): never more than its distance to anything in the box.
export const boxDistance = (box: Box, x: number, y: number, z: number): number => {
  const dx = Math.max(box.min.x - x, 0, x - box.max.x);
  const dy = Math.max(box.min.y - y, 0, y - box.max.y);
  const dz = Math.max(box.min.z - z, 0, z - box.max.z);

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// A cone with rounded ends from `a` (radius `ra`) to `b` (radius `rb`): a bone in its flesh.
export const roundCone = (a: Vec3, b: Vec3, ra: number, rb: number, owner = 0): Primitive => {
  const bax = b.x - a.x;
  const bay = b.y - a.y;
  const baz = b.z - a.z;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = ra - rb;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const sign = Math.sign(rr);

  return {
    ...boxOf([a, b], Math.max(ra, rb)),
    owner,
    reach: (d) => Math.max(a.x * d.x + a.y * d.y + a.z * d.z + ra, b.x * d.x + b.y * d.y + b.z * d.z + rb),
    distance: (x, y, z) => {
      const pax = x - a.x;
      const pay = y - a.y;
      const paz = z - a.z;
      const along = pax * bax + pay * bay + paz * baz;
      const past = along - l2;
      const qx = pax * l2 - bax * along;
      const qy = pay * l2 - bay * along;
      const qz = paz * l2 - baz * along;
      const x2 = qx * qx + qy * qy + qz * qz;
      const y2 = along * along * l2;
      const z2 = past * past * l2;
      const k = sign * rr * rr * x2;

      if (Math.sign(past) * a2 * z2 > k) {
        return Math.sqrt(x2 + z2) * il2 - rb;
      }

      if (Math.sign(along) * a2 * y2 < k) {
        return Math.sqrt(x2 + y2) * il2 - ra;
      }

      return (Math.sqrt(x2 * a2 * il2) + along * rr) * il2 - ra;
    },
  };
};

// An ellipsoid at `centre` with its radii along three axes at right angles: a pad, a mound of the palm, a knuckle.
export const ellipsoid = (centre: Vec3, axes: [Vec3, Vec3, Vec3], radii: [number, number, number], owner = 0): Primitive => {
  const [u, v, w] = axes.map(normalize);
  const [ru, rv, rw] = radii;
  const reach = Math.max(...radii);

  return {
    min: vec3(centre.x - reach, centre.y - reach, centre.z - reach),
    max: vec3(centre.x + reach, centre.y + reach, centre.z + reach),
    owner,
    reach: (d) => centre.x * d.x + centre.y * d.y + centre.z * d.z
      + Math.hypot(ru * (u.x * d.x + u.y * d.y + u.z * d.z), rv * (v.x * d.x + v.y * d.y + v.z * d.z), rw * (w.x * d.x + w.y * d.y + w.z * d.z)),
    distance: (x, y, z) => {
      const dx = x - centre.x;
      const dy = y - centre.y;
      const dz = z - centre.z;
      const a = (dx * u.x + dy * u.y + dz * u.z) / ru;
      const b = (dx * v.x + dy * v.y + dz * v.z) / rv;
      const c = (dx * w.x + dy * w.y + dz * w.z) / rw;
      const k0 = Math.sqrt(a * a + b * b + c * c);
      const k1 = Math.sqrt((a / ru) ** 2 + (b / rv) ** 2 + (c / rw) ** 2);

      return k1 > 0 ? (k0 * (k0 - 1)) / k1 : -Math.min(ru, rv, rw);
    },
  };
};

export const sphere = (centre: Vec3, radius: number, owner = 0): Primitive =>
  ellipsoid(centre, [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)], [radius, radius, radius], owner);

// The polynomial smooth maximum: the farther of two, rounded where they meet, for carving one shape out of another
// (smoothMax(a, -b) is a without b).
export const smoothMax = (a: number, b: number, k: number): number => -smoothMin(-a, -b, k);
