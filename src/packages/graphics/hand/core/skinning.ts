import { HandField } from "./field";

// How a vertex follows the skeleton, read from the shapes the hand is made of: each shape belongs to a bone, and a
// vertex follows the bones of the shapes it lies nearest, each by how near (falling away over `SOFTNESS` millimetres
// from the nearest), so where two bones' flesh blends at a joint, their pull blends the same way. At most four joints.

export interface SkinWeights {
  indices: Uint16Array;
  weights: Float32Array;
}

const SOFTNESS = 1.8;

// Shapes further than this many softnesses beyond the nearest have no pull worth keeping.
const REACH = 5;

export const skinWeights = (positions: Float32Array, field: HandField): SkinWeights => {
  const count = positions.length / 3;
  const indices = new Uint16Array(count * 4);
  const weights = new Float32Array(count * 4);
  const distances = new Float64Array(field.owners.length);
  const pull = new Map<number, number>();

  for (let vertex = 0; vertex < count; vertex += 1) {
    field.shapeDistances(positions[vertex * 3], positions[vertex * 3 + 1], positions[vertex * 3 + 2], distances);

    let nearest = Number.POSITIVE_INFINITY;

    distances.forEach((distance) => {
      nearest = Math.min(nearest, distance);
    });

    pull.clear();
    distances.forEach((distance, shape) => {
      const beyond = distance - nearest;

      if (beyond < SOFTNESS * REACH) {
        const owner = field.owners[shape];

        pull.set(owner, (pull.get(owner) ?? 0) + Math.exp(-beyond / SOFTNESS));
      }
    });

    const strongest = [...pull.entries()].sort((one, two) => two[1] - one[1]).slice(0, 4);
    const total = strongest.reduce((sum, [, weight]) => sum + weight, 0) || 1;

    strongest.forEach(([joint, weight], slot) => {
      indices[vertex * 4 + slot] = joint;
      weights[vertex * 4 + slot] = weight / total;
    });
  }

  return { indices, weights };
};
