// Points, directions and turns in three dimensions, as plain objects so they cross a worker or a test as they are:
// vectors, quaternions (unit, for turns), and the few operations everything in 3D is built from.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

export const scale = (a: Vec3, by: number): Vec3 => ({ x: a.x * by, y: a.y * by, z: a.z * by });

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

export const length = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);

export const distance = (a: Vec3, b: Vec3): number => length(sub(a, b));

// The vector at length 1, or the vector itself when it has no length to keep.
export const normalize = (a: Vec3): Vec3 => {
  const size = length(a);

  return size > 0 ? scale(a, 1 / size) : a;
};

export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });

export const IDENTITY: Quat = { x: 0, y: 0, z: 0, w: 1 };

// A turn of `angle` radians about `axis`, right handed.
export const fromAxisAngle = (axis: Vec3, angle: number): Quat => {
  const unit = normalize(axis);
  const half = Math.sin(angle / 2);

  return { x: unit.x * half, y: unit.y * half, z: unit.z * half, w: Math.cos(angle / 2) };
};

// The turn `b` followed by the turn `a`, as rotating by a * b does.
export const multiply = (a: Quat, b: Quat): Quat => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});

export const conjugate = (q: Quat): Quat => ({ x: -q.x, y: -q.y, z: -q.z, w: q.w });

// A vector turned by a unit quaternion.
export const rotate = (q: Quat, v: Vec3): Vec3 => {
  const u = { x: q.x, y: q.y, z: q.z };
  const twice = scale(cross(u, v), 2);

  return add(add(v, scale(twice, q.w)), cross(u, twice));
};

// The turn that takes the axes x, y and z to the three given (which must be at right angles and of length 1).
export const fromBasis = (x: Vec3, y: Vec3, z: Vec3): Quat => {
  const trace = x.x + y.y + z.z;

  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);

    return { w: 0.25 / s, x: (y.z - z.y) * s, y: (z.x - x.z) * s, z: (x.y - y.x) * s };
  }

  if (x.x > y.y && x.x > z.z) {
    const s = 2 * Math.sqrt(1 + x.x - y.y - z.z);

    return { w: (y.z - z.y) / s, x: 0.25 * s, y: (y.x + x.y) / s, z: (z.x + x.z) / s };
  }

  if (y.y > z.z) {
    const s = 2 * Math.sqrt(1 + y.y - x.x - z.z);

    return { w: (z.x - x.z) / s, x: (y.x + x.y) / s, y: 0.25 * s, z: (z.y + y.z) / s };
  }

  const s = 2 * Math.sqrt(1 + z.z - x.x - y.y);

  return { w: (x.y - y.x) / s, x: (z.x + x.z) / s, y: (z.y + y.z) / s, z: 0.25 * s };
};

// The shorter way between two turns, `t` of the way from `a` to `b`.
export const slerp = (a: Quat, b: Quat, t: number): Quat => {
  let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  const sign = cos < 0 ? -1 : 1;

  cos *= sign;

  if (cos > 0.9995) {
    const mixed = {
      x: a.x + (b.x * sign - a.x) * t,
      y: a.y + (b.y * sign - a.y) * t,
      z: a.z + (b.z * sign - a.z) * t,
      w: a.w + (b.w * sign - a.w) * t,
    };
    const size = Math.hypot(mixed.x, mixed.y, mixed.z, mixed.w);

    return { x: mixed.x / size, y: mixed.y / size, z: mixed.z / size, w: mixed.w / size };
  }

  const angle = Math.acos(cos);
  const sin = Math.sin(angle);
  const from = Math.sin((1 - t) * angle) / sin;
  const to = (Math.sin(t * angle) / sin) * sign;

  return { x: a.x * from + b.x * to, y: a.y * from + b.y * to, z: a.z * from + b.z * to, w: a.w * from + b.w * to };
};
