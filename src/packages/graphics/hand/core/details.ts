import { DEG } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";
import { smoothstep } from "@/packages/math/easing";
import { add, cross, dot, normalize, sub, Vec3, vec3 } from "@/packages/math/space";

import { blendAcross, placeOnChain } from "./chain";
import { HandField } from "./field";
import { DigitFrame, FINGERS } from "./skeleton";
import { mapPlace, SkinMapArea } from "./skinMap";

// What the skin's shader needs beyond its shape, worked out once per vertex: the lines at each joint (over it, on the
// back of a digit, wrinkles in rings round its middle, smoothed out as the joint bends and the skin stretches; under
// it, on the palm side, a fold, or two at a finger's middle joint, deeper as it bends), where the vertex falls on the
// back of the hand's map of veins and hair, and how the skin's colour shifts across the hand (redder over a relaxed
// knuckle, paler over a bent one, pinker at the fingertips, paler on the palm).

export interface SkinDetails {
  // Per vertex, four values: how deep its joint's lines show (0 to 1, from the joint's kind, how near its middle and
  // how far it is bent); where it lies along the digit from the joint's middle (on the back in wrinkle spacings, on the
  // palm side in millimetres); where it lies across the digit, -1 to 1; and 1 on the back, or on the palm side -1 less
  // the gap in millimetres between a double fold's two lines.
  creases: Float32Array;
  // Per vertex, where it falls on the back of the hand's map (two values), and how much of the map shows there: all of
  // it on the back of the palm, the wrist and the forearm, none on a digit or the palm side.
  uvs: Float32Array;
  mapped: Float32Array;
  colours: Float32Array;
}

type JointKind = "knuckle" | "middle" | "end";

// Each kind of joint's lines: on the back, how deep its wrinkles are, how far apart (in millimetres) and how far they
// reach along the digit (as a share of its radius there); on the palm side, how deep its fold is and the gap between
// the two lines a finger's middle joint folds in.
const JOINT_LINES: Record<JointKind, { wrinkle: number; spacing: number; reach: number; fold: number; gap: number }> = {
  knuckle: { wrinkle: 0.5, spacing: 2.4, reach: 1, fold: 0.7, gap: 0 },
  middle: { wrinkle: 1, spacing: 1.3, reach: 0.95, fold: 1, gap: 2.4 },
  end: { wrinkle: 0.65, spacing: 1.05, reach: 0.7, fold: 0.85, gap: 0 },
};

// A finger's knuckle, its middle joint and its last; the thumb has a knuckle and its last.
const kindOf = (frame: DigitFrame, joint: number): JointKind => (joint === 1 ? "knuckle" : joint === frame.joints.length - 2 ? "end" : "middle");

// Colour shifts, as factors on the skin's own colour: towards red over a relaxed knuckle, paler and yellower over a
// bent one where the skin is stretched over the bone, pink at a fingertip, redder at a nail's fold, lighter on the palm.
const KNUCKLE = [1.0, 0.88, 0.86];

const STRETCHED = [1.04, 1.01, 0.96];

const FINGERTIP = [1.02, 0.9, 0.88];

const NAIL_FOLD = [0.98, 0.84, 0.82];

const PALM = [1.04, 0.97, 0.95];

const mix = (target: Float32Array, at: number, factor: number[], amount: number) => {
  for (let channel = 0; channel < 3; channel += 1) {
    target[at + channel] *= 1 + (factor[channel] - 1) * amount;
  }
};

interface JointLine {
  // How near the joint's middle, for picking the nearest joint.
  nearness: number;
  depth: number;
  along: number;
  across: number;
  side: number;
  // 0 straight to 1 bent right over.
  stretch: number;
}

// A point's place in a joint's lines, or null where they do not reach.
const lineAt = (frame: DigitFrame, joint: number, point: Vec3, normal: Vec3): JointLine | null => {
  const through = normalize(add(frame.directions[joint - 1], frame.directions[joint]));
  const back = normalize(add(frame.backs[joint - 1], frame.backs[joint]));
  const way = normalize(cross(through, back));
  const kind = JOINT_LINES[kindOf(frame, joint)];
  const radius = frame.radii[joint];
  const reach = radius * kind.reach;
  const offset = sub(point, frame.joints[joint]);
  const along = dot(offset, through);
  const across = dot(offset, way) / radius;

  if (Math.abs(along) > reach * 1.6 || Math.abs(across) > 1.2) {
    return null;
  }

  const bend = Math.acos(clamp(dot(frame.directions[joint - 1], frame.directions[joint]), -1, 1)) / DEG;
  const nearness = Math.exp(-2.2 * ((along / reach) ** 2 + (across / 0.9) ** 2));

  if (dot(normal, back) > 0) {
    const stretch = smoothstep(10, 75, bend);

    return { nearness, depth: kind.wrinkle * nearness * (1 - 0.78 * stretch), along: along / kind.spacing, across, side: 1, stretch };
  }

  const folding = smoothstep(5, 60, bend);

  return { nearness, depth: kind.fold * (1 - smoothstep(0.55, 0.95, Math.abs(across))) * (0.45 + 0.55 * folding), along, across, side: -1 - kind.gap, stretch: 0 };
};

// The nearest joint's lines at a point: among a digit's own joints, or for the back of the hand, the knuckles.
const nearestLine = (candidates: Array<[DigitFrame, number]>, point: Vec3, normal: Vec3): JointLine | null =>
  candidates.reduce<JointLine | null>((best, [frame, joint]) => {
    const line = lineAt(frame, joint, point, normal);

    return line && (!best || line.nearness > best.nearness) ? line : best;
  }, null);

export const skinDetails = (positions: Float32Array, normals: Float32Array, field: HandField, area: SkinMapArea): SkinDetails => {
  const count = positions.length / 3;
  const creases = new Float32Array(count * 4);
  const uvs = new Float32Array(count * 2);
  const mapped = new Float32Array(count);
  const colours = new Float32Array(count * 3).fill(1);
  const distances = new Float64Array(field.groups.length);
  const knuckles = FINGERS.map((finger): [DigitFrame, number] => [field.frames[finger], 1]);

  for (let vertex = 0; vertex < count; vertex += 1) {
    const point = vec3(positions[vertex * 3], positions[vertex * 3 + 1], positions[vertex * 3 + 2]);
    const normal = vec3(normals[vertex * 3], normals[vertex * 3 + 1], normals[vertex * 3 + 2]);

    field.groupDistances(point.x, point.y, point.z, distances);

    let nearest = 0;
    let palmOrArm = Number.POSITIVE_INFINITY;
    let digit = Number.POSITIVE_INFINITY;

    distances.forEach((distance, group) => {
      const name = field.groups[group].name;

      nearest = distance < distances[nearest] ? group : nearest;

      if (name === "arm" || name === "palm") {
        palmOrArm = Math.min(palmOrArm, distance);
      } else {
        digit = Math.min(digit, distance);
      }
    });

    const group = field.groups[nearest].name;
    const [u, v] = mapPlace(area, point.x, point.y);

    uvs[vertex * 2] = u;
    uvs[vertex * 2 + 1] = v;
    // The map lies on the back of the palm and the forearm, which no pose moves.
    mapped[vertex] = smoothstep(0.15, 0.55, normal.z) * blendAcross(digit - palmOrArm, 2.5);

    // The palm side, by which way the skin faces.
    if (normal.z < -0.3) {
      mix(colours, vertex * 3, PALM, Math.min((-normal.z - 0.3) / 0.4, 1));
    }

    if (group === "arm") {
      continue;
    }

    const frame = group === "palm" ? null : field.frames[group];
    const candidates = frame ? Array.from({ length: frame.joints.length - 2 }, (_, index): [DigitFrame, number] => [frame, index + 1]) : knuckles;
    const line = nearestLine(candidates, point, normal);

    if (line) {
      creases.set([line.depth, line.along, line.across, line.side], vertex * 4);

      if (line.side > 0) {
        mix(colours, vertex * 3, KNUCKLE, line.nearness * 0.8 * (1 - line.stretch));
        mix(colours, vertex * 3, STRETCHED, line.nearness * 0.7 * line.stretch);
      }
    }

    if (!frame) {
      continue;
    }

    // The last phalanx: pinker towards the tip, and redder in the fold where the nail starts.
    const place = placeOnChain(frame, point);
    const last = frame.joints.length - 2;

    if (place.segment === last) {
      const share = place.along / place.length;

      mix(colours, vertex * 3, FINGERTIP, Math.max(0, (share - 0.45) / 0.55));

      if (dot(normal, frame.backs[place.segment]) > 0) {
        mix(colours, vertex * 3, NAIL_FOLD, Math.exp(-(((share - 0.4) / 0.06) ** 2)));
      }
    }
  }

  return { creases, uvs, mapped, colours };
};
