import type { MeshData, Skeleton } from "@/packages/graphics/stage3d";
import { add, scale, Vec3 } from "@/packages/math/space";

import { DigitName, HandAnatomy } from "../domain/types";
import { fieldNormal, HandField } from "./field";
import { faceOutwards } from "./mesher";
import { DIGITS, jointNamesOf } from "./skeleton";

// The nails, each a thin curved plate laid on its digit's last phalanx: found by dropping a grid of points onto the
// skin from above and lifting them a fraction of a millimetre off it, with a skirt down into the skin round the edge
// so no gap shows. Each follows its last phalanx's bone alone. Their colour goes from the pale half moon at the root,
// through the pink of the bed, to the white free edge.

const ACROSS = 9;

const ALONG = 12;

// Where the nail starts and ends along the last phalanx, as shares of its length, and how far it stands off the skin.
const ROOT = 0.42;

const EDGE = 0.97;

const LIFT = 0.32;

const SINK = 0.25;

// Linear colours: the half moon, the bed and the free edge.
const LUNULA = [0.88, 0.68, 0.63];

const BED = [0.81, 0.47, 0.42];

const FREE_EDGE = [0.93, 0.86, 0.8];

// Its half width at a share of its length, rounded at the root and gently at the free edge.
const shapeAt = (v: number): number => {
  if (v < 0.18) {
    return Math.sqrt(Math.max(0, 1 - ((0.18 - v) / 0.18) ** 2)) * 0.92 + 0.08;
  }

  if (v > 0.88) {
    return Math.sqrt(Math.max(0, 1 - (((v - 0.88) / 0.12) ** 2) * 0.55));
  }

  return 1;
};

const colourAt = (v: number): number[] => {
  const toBed = Math.min(Math.max((v - 0.1) / 0.1, 0), 1);
  const toEdge = Math.min(Math.max((v - 0.86) / 0.06, 0), 1);

  return [0, 1, 2].map((channel) => LUNULA[channel] + (BED[channel] - LUNULA[channel]) * toBed + (FREE_EDGE[channel] - BED[channel]) * toEdge);
};

// Drops a point onto the digit's skin along `down`, by bisection between a point outside and one inside.
const dropOnto = (distance: (x: number, y: number, z: number) => number, from: Vec3, down: Vec3, depth: number): Vec3 | null => {
  let outside = 0;
  let inside = depth;
  const at = (t: number) => add(from, scale(down, t));
  const value = (t: number) => {
    const point = at(t);

    return distance(point.x, point.y, point.z);
  };

  if (value(inside) > 0) {
    return null;
  }

  for (let step = 0; step < 24; step += 1) {
    const middle = (outside + inside) / 2;

    if (value(middle) > 0) {
      outside = middle;
    } else {
      inside = middle;
    }
  }

  return at((outside + inside) / 2);
};

const nailOf = (digit: DigitName, field: HandField, anatomy: HandAnatomy, joint: number) => {
  const frame = field.frames[digit];
  const last = frame.joints.length - 2;
  const start = frame.joints[last];
  const length = frame.lengths[frame.lengths.length - 1];
  const halfWidth = frame.radii[last + 1] * 2 * anatomy.nails.width * 0.5;
  const evaluate = field.evaluate;
  const positions: number[] = [];
  const normals: number[] = [];
  const colours: number[] = [];
  const grid: number[][] = [];

  for (let row = 0; row < ALONG; row += 1) {
    const v = row / (ALONG - 1);
    const along = length * (ROOT + (EDGE - ROOT) * v);
    const width = halfWidth * shapeAt(v);
    const line: number[] = [];

    for (let column = 0; column < ACROSS; column += 1) {
      const u = (column / (ACROSS - 1)) * 2 - 1;
      const above = add(add(add(start, scale(frame.direction, along)), scale(frame.side, u * width)), scale(frame.back, frame.radii[last] * 2));
      const surface = dropOnto(evaluate, above, scale(frame.back, -1), frame.radii[last] * 3);

      if (!surface) {
        line.push(-1);
        continue;
      }

      const normal = fieldNormal(evaluate, surface.x, surface.y, surface.z);
      const top = add(surface, scale(normal, LIFT));

      line.push(positions.length / 3);
      positions.push(top.x, top.y, top.z);
      normals.push(normal.x, normal.y, normal.z);
      colours.push(...colourAt(v));
    }

    grid.push(line);
  }

  const indices: number[] = [];

  for (let row = 0; row < ALONG - 1; row += 1) {
    for (let column = 0; column < ACROSS - 1; column += 1) {
      const [a, b, c, d] = [grid[row][column], grid[row][column + 1], grid[row + 1][column + 1], grid[row + 1][column]];

      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) {
        indices.push(a, c, b, a, d, c);
      }
    }
  }

  // The skirt: each edge vertex again, sunk into the skin, joined to the top edge all the way round.
  const ring = [
    ...grid[0],
    ...grid.slice(1, -1).map((line) => line[ACROSS - 1]),
    ...[...grid[ALONG - 1]].reverse(),
    ...grid.slice(1, -1).map((line) => line[0])
.reverse(),
  ].filter((index) => index >= 0);
  const sunk = ring.map((index) => {
    const at = index * 3;

    positions.push(
      positions[at] - normals[at] * (LIFT + SINK),
      positions[at + 1] - normals[at + 1] * (LIFT + SINK),
      positions[at + 2] - normals[at + 2] * (LIFT + SINK),
    );
    normals.push(normals[at], normals[at + 1], normals[at + 2]);
    colours.push(colours[at], colours[at + 1], colours[at + 2]);

    return positions.length / 3 - 1;
  });

  ring.forEach((index, slot) => {
    const next = (slot + 1) % ring.length;

    indices.push(index, ring[next], sunk[next], index, sunk[next], sunk[slot]);
  });

  faceOutwards(positions, normals, indices);

  return { positions, normals, colours, indices, joint };
};

export const nailMeshes = (field: HandField, anatomy: HandAnatomy, skeleton: Skeleton): MeshData => {
  const jointOf = new Map(skeleton.joints.map((joint, index) => [joint.name, index]));
  const positions: number[] = [];
  const normals: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];
  const skinIndices: number[] = [];

  DIGITS.forEach((digit) => {
    const names = jointNamesOf(digit);
    const nail = nailOf(digit, field, anatomy, jointOf.get(names[names.length - 2]) ?? 0);
    const offset = positions.length / 3;

    positions.push(...nail.positions);
    normals.push(...nail.normals);
    colours.push(...nail.colours);
    indices.push(...nail.indices.map((index) => index + offset));
    nail.positions.forEach((_, index) => {
      if (index % 3 === 0) {
        skinIndices.push(nail.joint, 0, 0, 0);
      }
    });
  });

  const count = positions.length / 3;
  const skinWeights = new Float32Array(count * 4);

  for (let vertex = 0; vertex < count; vertex += 1) {
    skinWeights[vertex * 4] = 1;
  }

  return {
    positions: Float32Array.from(positions),
    normals: Float32Array.from(normals),
    indices: Uint32Array.from(indices),
    colors: Float32Array.from(colours),
    skinIndices: Uint16Array.from(skinIndices),
    skinWeights,
  };
};
