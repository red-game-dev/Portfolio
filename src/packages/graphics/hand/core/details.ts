import { add, dot, normalize, sub, vec3 } from "@/packages/math/space";

import { placeOnChain } from "./chain";
import { HandField } from "./field";

// What the skin's shader needs beyond its shape, worked out once per vertex: where the creases are (over each joint
// on the back of a digit, a few fine wrinkles; under it, on the palm side, a fold or two), and how its colour shifts
// across the hand (warmer over the knuckles and round the nails, pinker at the fingertips, paler on the palm).

export interface SkinDetails {
  // Per vertex: the crease's strength (0 to 1), the millimetres along the digit from the joint's centre (the shader
  // draws its lines from it), and 1 on the back of the digit or -1 on the palm side.
  creases: Float32Array;
  colours: Float32Array;
}

// How far along a digit a joint's creases reach either side, as a share of its radius there.
const CREASE_REACH = 0.85;

// Colour shifts, as factors on the skin's own colour: towards red over a knuckle and at a nail's fold, pink at a
// fingertip, lighter on the palm.
const KNUCKLE = [1.0, 0.88, 0.86];

const FINGERTIP = [1.02, 0.9, 0.88];

const NAIL_FOLD = [0.98, 0.84, 0.82];

const PALM = [1.04, 0.97, 0.95];

const mix = (target: Float32Array, at: number, factor: number[], amount: number) => {
  for (let channel = 0; channel < 3; channel += 1) {
    target[at + channel] *= 1 + (factor[channel] - 1) * amount;
  }
};

export const skinDetails = (positions: Float32Array, normals: Float32Array, field: HandField): SkinDetails => {
  const count = positions.length / 3;
  const creases = new Float32Array(count * 3);
  const colours = new Float32Array(count * 3).fill(1);
  const distances = new Float64Array(field.groups.length);

  for (let vertex = 0; vertex < count; vertex += 1) {
    const point = vec3(positions[vertex * 3], positions[vertex * 3 + 1], positions[vertex * 3 + 2]);
    const normal = vec3(normals[vertex * 3], normals[vertex * 3 + 1], normals[vertex * 3 + 2]);

    field.groupDistances(point.x, point.y, point.z, distances);

    let nearest = 0;

    distances.forEach((distance, group) => {
      nearest = distance < distances[nearest] ? group : nearest;
    });

    const group = field.groups[nearest].name;

    // The palm side, by which way the skin faces.
    if (normal.z < -0.3) {
      mix(colours, vertex * 3, PALM, Math.min((-normal.z - 0.3) / 0.4, 1));
    }

    if (group === "arm" || group === "palm") {
      continue;
    }

    const frame = field.frames[group];
    const place = placeOnChain(frame, point);
    const isBack = dot(normal, frame.backs[place.segment]) > 0;
    let best = { strength: 0, offset: 0 };

    // The joints whose creases show: a finger's knuckle and two joints, the thumb's knuckle and joint, each measured
    // along the way the digit runs through it.
    for (let joint = 1; joint < frame.joints.length - 1; joint += 1) {
      const through = normalize(add(frame.directions[joint - 1], frame.directions[joint]));
      const offset = dot(sub(point, frame.joints[joint]), through);
      const reach = frame.radii[joint] * CREASE_REACH;
      const strength = Math.abs(offset) < reach ? Math.exp(-((offset / (reach * 0.5)) ** 2)) : 0;

      if (strength > best.strength) {
        best = { strength, offset };
      }
    }

    creases[vertex * 3] = best.strength;
    creases[vertex * 3 + 1] = best.offset;
    creases[vertex * 3 + 2] = isBack ? 1 : -1;

    if (isBack) {
      mix(colours, vertex * 3, KNUCKLE, best.strength * 0.8);
    }

    // The last phalanx: pinker towards the tip, and redder in the fold where the nail starts.
    const last = frame.joints.length - 2;

    if (place.segment === last) {
      const share = place.along / place.length;

      mix(colours, vertex * 3, FINGERTIP, Math.max(0, (share - 0.45) / 0.55));

      if (isBack) {
        mix(colours, vertex * 3, NAIL_FOLD, Math.exp(-(((share - 0.4) / 0.06) ** 2)));
      }
    }
  }

  return { creases, colours };
};

