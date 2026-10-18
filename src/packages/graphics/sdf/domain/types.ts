import type { Vec3 } from "@/packages/math/space";

// A shape as a signed distance field: negative inside, positive outside, in its own units.

export type Field = (x: number, y: number, z: number) => number;

// A box round something, axis aligned.
export interface Box {
  min: Vec3;
  max: Vec3;
}

// One shape a thing is blended from, and the joint whose bone carries it (0 for a thing with no bones).
export interface Primitive extends Box {
  owner: number;
  distance(x: number, y: number, z: number): number;
  // How far it reaches along a direction (a unit vector) from the origin.
  reach(direction: Vec3): number;
}

export interface SurfaceMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}
