import { meshSurface } from "@/packages/graphics/sdf";
import type { MeshData, ModelAsset } from "@/packages/graphics/stage3d";

import { ADULT_HEAD } from "../config/anatomy";
import { HeadAnatomy, headField, HeadField } from "./field";

export interface HeadModelOptions {
  // The grid the head is meshed on, in millimetres: finer is smoother and heavier.
  spacing?: number;
  // The skin's colour, which its own per vertex shifts multiply, and the hair's.
  skin?: string;
  hair?: string;
}

// A light skin tone, as the hands have, and dark brown hair.
const LIGHT_SKIN = "#f0c3a3";

const DARK_HAIR = "#2a1d15";

// Colour shifts, as factors on the skin's own colour: the lips, the brows, a little colour in the cheeks, and the
// shade inside the eye sockets.
const LIPS = [1.0, 0.76, 0.76];

const BROWS = [0.4, 0.31, 0.26];

const CHEEKS = [1.02, 0.92, 0.9];

const SOCKETS = [0.86, 0.8, 0.78];

const mix = (colours: Float32Array, at: number, factor: number[], amount: number) => {
  for (let channel = 0; channel < 3; channel += 1) {
    colours[at + channel] *= 1 + (factor[channel] - 1) * Math.min(Math.max(amount, 0), 1);
  }
};

const gauss = (value: number, width: number) => Math.exp(-((value / width) ** 2));

// The skin's colour per vertex, from where each vertex is on the face.
const skinColours = (positions: Float32Array, field: HeadField, head: HeadAnatomy): Float32Array => {
  const colours = new Float32Array(positions.length).fill(1);
  const { eyes, brow } = head;

  for (let at = 0; at < positions.length; at += 3) {
    const x = positions[at];
    const y = positions[at + 1];
    const z = positions[at + 2];
    const isFront = z > 40;

    mix(colours, at, LIPS, (1 - field.lips(x, y, z) / 1.2) * 0.85);

    if (isFront) {
      // Each brow an arch over its eye, thinning towards its end.
      const along = Math.abs(Math.abs(x) - eyes.apart);

      mix(colours, at, BROWS, gauss(y - (brow + 4 - along * 0.12), 2.6) * gauss(along, 15) * 0.9);
      mix(colours, at, CHEEKS, gauss(Math.abs(x) - 40, 12) * gauss(y - 90, 12) * 0.8);
      mix(colours, at, SOCKETS, gauss(Math.hypot(Math.abs(x) - eyes.apart, y - eyes.y), 12) * 0.7);
    }
  }

  return colours;
};

// An eye: a ball, white but for its iris and pupil looking forward, in a fine mesh of its own.
const eyeMesh = (centres: HeadField["eyes"], radius: number): MeshData => {
  const rings = 18;
  const segments = 28;
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  centres.forEach((centre) => {
    const base = positions.length / 3;

    for (let ring = 0; ring <= rings; ring += 1) {
      // From the front (looking forward, +z) to the back.
      const polar = (ring / rings) * Math.PI;

      for (let segment = 0; segment <= segments; segment += 1) {
        const around = (segment / segments) * Math.PI * 2;
        const nx = Math.sin(polar) * Math.cos(around);
        const ny = Math.sin(polar) * Math.sin(around);
        const nz = Math.cos(polar);
        const degrees = (polar * 180) / Math.PI;
        const colour = degrees < 9 ? [0.04, 0.035, 0.03] : degrees < 24 ? [0.33, 0.22, 0.13] : [0.95, 0.93, 0.9];

        positions.push(centre.x + nx * radius, centre.y + ny * radius, centre.z + nz * radius);
        normals.push(nx, ny, nz);
        colors.push(...colour);
      }
    }

    for (let ring = 0; ring < rings; ring += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        const a = base + ring * (segments + 1) + segment;
        const b = a + segments + 1;

        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  });

  return { positions: Float32Array.from(positions), normals: Float32Array.from(normals), indices: Uint32Array.from(indices), colors: Float32Array.from(colors) };
};

// A head as a slot's model, facing forward: its skin (meshed from its field, coloured per vertex), its hair, and its
// eyes, in millimetres. It has no bones; a stage stands and turns it whole.
export const buildHeadModel = (id: string, head: HeadAnatomy = ADULT_HEAD, { spacing = 2.4, skin = LIGHT_SKIN, hair = DARK_HAIR }: HeadModelOptions = {}): ModelAsset => {
  const field = headField(head);
  const surface = meshSurface(field.skin, field.bounds, spacing);
  const hairSurface = meshSurface(field.hair, field.hairBounds, spacing);

  return {
    id,
    parts: [
      { name: "skin", material: { kind: "skin", colour: skin }, mesh: { ...surface, colors: skinColours(surface.positions, field, head) } },
      { name: "hair", material: { kind: "cloth", colour: hair, roughness: 0.75 }, mesh: hairSurface },
      { name: "eyes", material: { kind: "nail" }, mesh: eyeMesh(field.eyes, field.eyeRadius) },
    ],
  };
};
