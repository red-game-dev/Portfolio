import { Vec3 } from "@/packages/math/space";

// Turns a signed distance field into a mesh with surface nets: the field is sampled on a grid, a vertex goes in every
// cell the surface passes through (where its edges cross zero, on average), and every grid edge the surface crosses
// joins the four cells round it in a quad. Each vertex is then pulled onto the surface itself along the field's
// gradient, and faces it with that gradient, so the mesh is smooth and true to the shape at any grid size.

export type Field = (x: number, y: number, z: number) => number;

export interface SurfaceMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

// Corner offsets of a cell, numbered 1 along x, 2 along y, 4 along z.
const CORNERS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];

// Each corner's place in a cell's mask of which corners are inside.
const CORNER_FLAGS = [1, 2, 4, 8, 16, 32, 64, 128];

// A cell's twelve edges, as pairs of its corners.
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

// The coarse pass samples every this many points along each axis; a field may be off from a true distance by this
// much, so the coarse samples are trusted only that much further out.
const COARSE = 4;

const SAFETY = 1.4;

const gradient = (field: Field, x: number, y: number, z: number, step: number): Vec3 => ({
  x: field(x + step, y, z) - field(x - step, y, z),
  y: field(x, y + step, z) - field(x, y - step, z),
  z: field(x, y, z + step) - field(x, y, z - step),
});

// Every triangle wound to face out, the way its corners' normals do.
export const faceOutwards = (positions: ArrayLike<number>, normals: ArrayLike<number>, indices: number[] | Uint32Array): void => {
  for (let face = 0; face < indices.length; face += 3) {
    const [a, b, c] = [indices[face] * 3, indices[face + 1] * 3, indices[face + 2] * 3];
    const e1 = [positions[b] - positions[a], positions[b + 1] - positions[a + 1], positions[b + 2] - positions[a + 2]];
    const e2 = [positions[c] - positions[a], positions[c + 1] - positions[a + 1], positions[c + 2] - positions[a + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const facing = n[0] * (normals[a] + normals[b] + normals[c]) + n[1] * (normals[a + 1] + normals[b + 1] + normals[c + 1])
      + n[2] * (normals[a + 2] + normals[b + 2] + normals[c + 2]);

    if (facing < 0) {
      [indices[face + 1], indices[face + 2]] = [indices[face + 2], indices[face + 1]];
    }
  }
};

export const meshSurface = (field: Field, bounds: { min: Vec3; max: Vec3 }, spacing: number): SurfaceMesh => {
  const { min, max } = bounds;
  const nx = Math.ceil((max.x - min.x) / spacing) + 2;
  const ny = Math.ceil((max.y - min.y) / spacing) + 2;
  const nz = Math.ceil((max.z - min.z) / spacing) + 2;
  const origin = { x: min.x - spacing / 2, y: min.y - spacing / 2, z: min.z - spacing / 2 };
  const values = new Float32Array(nx * ny * nz);
  const pointAt = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  // A coarse pass first: a fine point whose nearest coarse sample is further from the surface than the two can be
  // apart takes that sample's value (only its sign matters there), so the field is worked out in full only near the
  // surface, a small part of the grid.
  const qx = Math.ceil(nx / COARSE) + 1;
  const qy = Math.ceil(ny / COARSE) + 1;
  const qz = Math.ceil(nz / COARSE) + 1;
  const coarse = new Float32Array(qx * qy * qz);
  const reach = (COARSE / 2) * spacing * Math.sqrt(3) * SAFETY + spacing;

  for (let k = 0; k < qz; k += 1) {
    for (let j = 0; j < qy; j += 1) {
      for (let i = 0; i < qx; i += 1) {
        coarse[i + qx * (j + qy * k)] = field(origin.x + i * COARSE * spacing, origin.y + j * COARSE * spacing, origin.z + k * COARSE * spacing);
      }
    }
  }

  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const near = coarse[Math.round(i / COARSE) + qx * (Math.round(j / COARSE) + qy * Math.round(k / COARSE))];

        values[pointAt(i, j, k)] = Math.abs(near) > reach ? near : field(origin.x + i * spacing, origin.y + j * spacing, origin.z + k * spacing);
      }
    }
  }

  const cx = nx - 1;
  const cy = ny - 1;
  const cz = nz - 1;
  const cellAt = (i: number, j: number, k: number) => i + cx * (j + cy * k);
  const cellVertex = new Int32Array(cx * cy * cz).fill(-1);
  const positions: number[] = [];
  const corner = new Float32Array(8);

  for (let k = 0; k < cz; k += 1) {
    for (let j = 0; j < cy; j += 1) {
      for (let i = 0; i < cx; i += 1) {
        let mask = 0;

        for (let c = 0; c < 8; c += 1) {
          const [di, dj, dk] = CORNERS[c];

          corner[c] = values[pointAt(i + di, j + dj, k + dk)];
          mask += corner[c] < 0 ? CORNER_FLAGS[c] : 0;
        }

        if (mask === 0 || mask === 255) {
          continue;
        }

        let sx = 0;
        let sy = 0;
        let sz = 0;
        let count = 0;

        EDGES.forEach(([a, b]) => {
          const isA = corner[a] < 0;

          if (isA === corner[b] < 0) {
            return;
          }

          const t = corner[a] / (corner[a] - corner[b]);

          sx += CORNERS[a][0] + (CORNERS[b][0] - CORNERS[a][0]) * t;
          sy += CORNERS[a][1] + (CORNERS[b][1] - CORNERS[a][1]) * t;
          sz += CORNERS[a][2] + (CORNERS[b][2] - CORNERS[a][2]) * t;
          count += 1;
        });

        cellVertex[cellAt(i, j, k)] = positions.length / 3;
        positions.push(origin.x + (i + sx / count) * spacing, origin.y + (j + sy / count) * spacing, origin.z + (k + sz / count) * spacing);
      }
    }
  }

  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, isFlipped: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) {
      return;
    }

    if (isFlipped) {
      indices.push(a, c, b, a, d, c);
    } else {
      indices.push(a, b, c, a, c, d);
    }
  };

  for (let k = 1; k < cz; k += 1) {
    for (let j = 1; j < cy; j += 1) {
      for (let i = 1; i < cx; i += 1) {
        const inside = values[pointAt(i, j, k)] < 0;

        // The edge along x from this point, then along y, then along z: each crossed edge joins the four cells round it.
        if (inside !== values[pointAt(i + 1, j, k)] < 0) {
          quad(cellVertex[cellAt(i, j - 1, k - 1)], cellVertex[cellAt(i, j, k - 1)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j - 1, k)], inside);
        }

        if (inside !== values[pointAt(i, j + 1, k)] < 0) {
          quad(cellVertex[cellAt(i - 1, j, k - 1)], cellVertex[cellAt(i - 1, j, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j, k - 1)], inside);
        }

        if (inside !== values[pointAt(i, j, k + 1)] < 0) {
          quad(cellVertex[cellAt(i - 1, j - 1, k)], cellVertex[cellAt(i, j - 1, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i - 1, j, k)], inside);
        }
      }
    }
  }

  // Each vertex pulled onto the surface and faced with the field.
  const step = spacing * 0.25;
  const normals = new Float32Array(positions.length);

  for (let vertex = 0; vertex < positions.length; vertex += 3) {
    let x = positions[vertex];
    let y = positions[vertex + 1];
    let z = positions[vertex + 2];

    // One Newton step onto the surface; the vertex moves less than a cell, so its gradient there faces it too.
    const distance = field(x, y, z);
    const g = gradient(field, x, y, z, step);
    const size = (g.x * g.x + g.y * g.y + g.z * g.z) / (4 * step * step);

    if (size > 1e-6) {
      const move = distance / size / (2 * step);

      x -= g.x * move;
      y -= g.y * move;
      z -= g.z * move;
    }

    const length = Math.hypot(g.x, g.y, g.z) || 1;

    positions[vertex] = x;
    positions[vertex + 1] = y;
    positions[vertex + 2] = z;
    normals[vertex] = g.x / length;
    normals[vertex + 1] = g.y / length;
    normals[vertex + 2] = g.z / length;
  }

  faceOutwards(positions, normals, indices);

  return { positions: Float32Array.from(positions), normals, indices: Uint32Array.from(indices) };
};
