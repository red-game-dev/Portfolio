import { boxDistance, boxOf, ellipsoid, roundCone, smoothMin, sphere } from "@/packages/graphics/sdf";
import type { Box, Primitive } from "@/packages/graphics/sdf";
import type { JointTurns } from "@/packages/graphics/stage3d";
import { poseSkeleton } from "@/packages/graphics/stage3d";
import { add, conjugate, cross, normalize, Quat, rotate, scale, sub, Vec3, vec3 } from "@/packages/math/space";


import { DigitName, HandAnatomy } from "../domain/types";
import { DigitFrame, digitFrames, digitJoints, DIGITS, FINGERS, handSkeleton, poseFrame } from "./skeleton";

// The hand as a signed distance field: negative inside, positive outside, blended from round cones (the bones in
// their flesh) and ellipsoids (the pads, the palm's mounds, the knuckles) with smooth unions, so joints, the web of
// the thumb and the palm's edges come out rounded the way flesh is. Every shape belongs to a bone, so the field can be
// posed: each shape moved with its bone and the blends worked out afresh, so a bent joint keeps the flesh a real one
// has. Written in plain numbers, since the mesher asks for it hundreds of thousands of times.

// A part blended from its own shapes (a finger, the palm), then blended into the hand with its own softness.
export interface FieldGroup extends Box {
  name: "arm" | "palm" | DigitName;
  primitives: Primitive[];
  // How softly its own shapes join, and how softly it joins the hand, in millimetres.
  blend: number;
  join: number;
  // How many of its first shapes join without blending (a digit's phalanges, in line at rest, so a blend would only
  // bulge each joint into a ring).
  exact: number;
}

export interface HandField extends Box {
  groups: FieldGroup[];
  // Each digit as posed, and its joints' indices in the skeleton.
  frames: Record<DigitName, DigitFrame>;
  joints: Record<DigitName, number[]>;
  // Every shape's joint, in the order of the groups and their shapes.
  owners: Int32Array;
  evaluate: (x: number, y: number, z: number) => number;
  // How far the hand's flesh reaches along a direction (a unit vector) from its origin, or only some of its parts': the
  // furthest of their shapes, and the most the palm's blend rounds out past them.
  reach: (direction: Vec3, parts?: Array<FieldGroup["name"]>) => number;
  // Each group's own distance at a point, in the order of `groups`.
  groupDistances: (x: number, y: number, z: number, out: Float64Array) => Float64Array;
  // Each shape's own distance at a point, in the order of `owners`.
  shapeDistances: (x: number, y: number, z: number, out: Float64Array) => Float64Array;
}

const at = (frame: DigitFrame, joint: number, along: number, back: number) =>
  add(add(frame.joints[joint], scale(frame.direction, along)), scale(frame.back, back));

// A finger or the thumb: its phalanges as cones, the pads under them, the bumps of its joints over them.
const digitPrimitives = (frame: DigitFrame, owners: number[]): Primitive[] => {
  const { joints, radii, lengths, direction, back, side } = frame;
  const isThumb = frame.digit === "thumb";
  // The thumb's metacarpal is part of it; a finger's is part of the palm.
  const first = isThumb ? 0 : 1;
  const last = joints.length - 1;
  const primitives: Primitive[] = [];
  const axes: [Vec3, Vec3, Vec3] = [direction, side, back];

  for (let joint = first; joint < last; joint += 1) {
    const isTip = joint === last - 1;
    const end = isTip ? sub(joints[last], scale(direction, radii[last])) : joints[joint + 1];

    primitives.push(roundCone(joints[joint], end, radii[joint], radii[joint + 1], owners[joint]));
  }

  // The flesh under each phalanx, fullest at the fingertip.
  lengths.forEach((phalanx, index) => {
    const joint = joints.length - 1 - lengths.length + index;
    const radius = radii[joint + 1];
    const isTip = index === lengths.length - 1;
    const centre = at(frame, joint, phalanx * (isTip ? 0.56 : 0.5), -radius * (isTip ? 0.42 : 0.46));

    primitives.push(ellipsoid(centre, axes, [phalanx * (isTip ? 0.4 : 0.42), radius * (isTip ? 0.88 : 0.8), radius * (isTip ? 0.72 : 0.62)], owners[joint]));
  });

  // The bumps over the joints between the phalanges: the heads of the bones before them.
  for (let joint = last - lengths.length + 1; joint < last; joint += 1) {
    primitives.push(sphere(at(frame, joint, 0, radii[joint] * 0.3), radii[joint] * 0.55, owners[joint - 1]));
  }

  return primitives;
};

// How many cones a digit's own phalanges make (the thumb's metacarpal counts as one of its own).
const phalanxCount = (frame: DigitFrame) => frame.joints.length - (frame.digit === "thumb" ? 1 : 2);

const palmPrimitives = (anatomy: HandAnatomy, frames: Record<DigitName, DigitFrame>, owners: Record<DigitName, number[]>): Primitive[] => {
  const primitives: Primitive[] = [];
  const thumb = frames.thumb;
  const z = vec3(0, 0, 1);

  FINGERS.forEach((finger) => {
    const { joints, radii, back } = frames[finger];

    // The metacarpal in the palm, and its head standing up as the knuckle.
    primitives.push(roundCone(joints[0], joints[1], 9, radii[1] * 0.92, owners[finger][0]));
    primitives.push(sphere(add(joints[1], scale(back, radii[1] * 0.4)), radii[1] * 0.52, owners[finger][0]));
  });

  const knuckleLine = sub(frames.pinky.joints[1], frames.index.joints[1]);

  // The palm's body, thinner than it is wide.
  primitives.push(ellipsoid(vec3(2, 56, -3), [vec3(1, 0, 0), vec3(0, 1, 0), z], [36, 46, anatomy.palm.thickness * 0.5]));
  // The mound at the thumb's base, along its metacarpal.
  const thumbAxis = normalize(sub(thumb.joints[1], thumb.joints[0]));
  const thumbAcross = normalize(cross(z, thumbAxis));

  const thumbMound = add(add(thumb.joints[0], scale(sub(thumb.joints[1], thumb.joints[0]), 0.45)), vec3(4, 0, -3));

  primitives.push(ellipsoid(thumbMound, [thumbAxis, thumbAcross, cross(thumbAxis, thumbAcross)], [26, 15, 15], owners.thumb[0]));
  // The web of skin between the thumb and the index finger.
  const web = sub(frames.index.joints[1], thumb.joints[1]);

  const webCentre = add(add(thumb.joints[1], scale(web, 0.42)), vec3(0, -10, -5));

  primitives.push(ellipsoid(webCentre, [normalize(web), normalize(cross(z, web)), z], [Math.hypot(web.x, web.y, web.z) * 0.42, 10, 6.5]));
  // The mound down the little finger's side.
  primitives.push(ellipsoid(vec3(22, 44, -9), [vec3(0, 1, 0), vec3(1, 0, 0), z], [32, 13, 13]));
  // The ridge of flesh under the knuckles.
  primitives.push(roundCone(add(frames.index.joints[1], vec3(0, -4, -7)), add(frames.pinky.joints[1], vec3(0, -4, -7)), 8.5, 7.5));
  // The web between the fingers' roots, under the knuckle line.
  primitives.push(ellipsoid(add(frames.index.joints[1], scale(knuckleLine, 0.5)), [normalize(knuckleLine), vec3(0, 1, 0), z], [30, 7, 8]));

  return primitives;
};

const armPrimitives = (anatomy: HandAnatomy): Primitive[] => {
  const { forearm, wrist } = anatomy;
  const half = wrist.width / 2;
  const radius = wrist.thickness / 2;
  const reach = half - radius;
  const end = forearm.width / 2 - forearm.thickness / 2;

  return [
    roundCone(vec3(-reach, 6, -3), vec3(-end, -forearm.length, -1), radius, forearm.thickness / 2),
    roundCone(vec3(reach, 6, -3), vec3(end, -forearm.length, -1), radius, forearm.thickness / 2),
    // The two bones standing out either side of the wrist.
    sphere(vec3(-half + 4, -4, 1), 5),
    sphere(vec3(half - 4, -6, 2), 4.5),
  ];
};

const groupOf = (name: FieldGroup["name"], primitives: Primitive[], blend: number, join: number, exact = 0): FieldGroup => ({
  name,
  primitives,
  blend,
  join,
  exact,
  min: vec3(Math.min(...primitives.map((p) => p.min.x)), Math.min(...primitives.map((p) => p.min.y)), Math.min(...primitives.map((p) => p.min.z))),
  max: vec3(Math.max(...primitives.map((p) => p.max.x)), Math.max(...primitives.map((p) => p.max.y)), Math.max(...primitives.map((p) => p.max.z))),
});

// A group's distance, skipping any of its shapes whose box is further than the nearest shape so far plus the blend,
// which could not change the result.
const groupDistance = (group: FieldGroup, x: number, y: number, z: number, cutoff: number): number => {
  const outside = boxDistance(group, x, y, z);

  if (outside > cutoff) {
    return outside;
  }

  let distance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < group.primitives.length; index += 1) {
    const primitive = group.primitives[index];

    if (boxDistance(primitive, x, y, z) <= distance + group.blend) {
      const next = primitive.distance(x, y, z);

      if (distance === Number.POSITIVE_INFINITY) {
        distance = next;
      } else {
        distance = index < group.exact ? Math.min(distance, next) : smoothMin(distance, next, group.blend);
      }
    }
  }

  return distance;
};

// How softly each part joins: the arm and palm broadly, the thumb's web broader than a finger's root.
const BLEND = { arm: 8, palm: 10, digit: 3.2 } as const;

const JOIN = { arm: 20, thumb: 12, finger: 4.5 } as const;

// A part further outside its box than its join (and this margin) cannot change the hand's surface, so it is not
// worked out; nearer, it always is, or the surface would jump where the box's edge passes.
const MARGIN = 4;

// A shape moved with its bone: the point is taken back into the bone's rest frame and measured there, and its box is
// the rest box's corners moved forward.
const posedShape = (shape: Primitive, rest: Vec3, posed: Vec3, turn: Quat): Primitive => {
  const back = conjugate(turn);
  const corners = [shape.min.x, shape.max.x].flatMap((x) => [shape.min.y, shape.max.y].flatMap((y) => [shape.min.z, shape.max.z].map((z) => (
    add(rotate(turn, sub(vec3(x, y, z), rest)), posed)
  ))));
  // The turn back as a matrix, so each measure costs nine multiplications.
  const ex = rotate(back, vec3(1, 0, 0));
  const ey = rotate(back, vec3(0, 1, 0));
  const ez = rotate(back, vec3(0, 0, 1));

  return {
    ...boxOf(corners, 0),
    owner: shape.owner,
    // The direction taken back into the rest frame, measured there, and the move from rest to the pose added.
    reach: (d) => {
      const local = vec3(ex.x * d.x + ey.x * d.y + ez.x * d.z, ex.y * d.x + ey.y * d.y + ez.y * d.z, ex.z * d.x + ey.z * d.y + ez.z * d.z);

      return shape.reach(local) - (rest.x * local.x + rest.y * local.y + rest.z * local.z) + (posed.x * d.x + posed.y * d.y + posed.z * d.z);
    },
    distance: (x, y, z) => {
      const dx = x - posed.x;
      const dy = y - posed.y;
      const dz = z - posed.z;

      return shape.distance(
        ex.x * dx + ey.x * dy + ez.x * dz + rest.x,
        ex.y * dx + ey.y * dy + ez.y * dz + rest.y,
        ex.z * dx + ey.z * dy + ez.z * dz + rest.z,
      );
    },
  };
};

const isStill = (turn: Quat, rest: Vec3, posed: Vec3) =>
  Math.abs(turn.w) > 0.999999 && Math.abs(rest.x - posed.x) + Math.abs(rest.y - posed.y) + Math.abs(rest.z - posed.z) < 1e-6;

// The hand's field at rest, or posed by its joints' turns (as a `HandPoser` gives them).
export const handField = (anatomy: HandAnatomy, turns: JointTurns = []): HandField => {
  const skeleton = handSkeleton(anatomy);
  const joints = digitJoints(skeleton);
  const restFrames = digitFrames(anatomy);
  const posed = poseSkeleton(skeleton, turns);
  const place = (shape: Primitive): Primitive => {
    const rest = skeleton.joints[shape.owner].position;
    const moved = posed.positions[shape.owner];
    const turn = posed.rotations[shape.owner];

    return isStill(turn, rest, moved) ? shape : posedShape(shape, rest, moved, turn);
  };
  const groups: FieldGroup[] = [
    groupOf("arm", armPrimitives(anatomy).map(place), BLEND.arm, JOIN.arm),
    groupOf("palm", palmPrimitives(anatomy, restFrames, joints).map(place), BLEND.palm, 0),
    ...DIGITS.map((digit) => groupOf(
      digit,
      digitPrimitives(restFrames[digit], joints[digit]).map(place),
      BLEND.digit,
      digit === "thumb" ? JOIN.thumb : JOIN.finger,
      phalanxCount(restFrames[digit]),
    )),
  ];
  const [arm, palm, ...digits] = groups;
  const shapes = groups.flatMap((group) => group.primitives);
  const frames = Object.fromEntries(DIGITS.map((digit) => [digit, poseFrame(restFrames[digit], joints[digit], posed)])) as Record<DigitName, DigitFrame>;

  return {
    groups,
    frames,
    joints,
    owners: Int32Array.from(shapes.map((shape) => shape.owner)),
    min: vec3(Math.min(...groups.map((g) => g.min.x)), Math.min(...groups.map((g) => g.min.y)), Math.min(...groups.map((g) => g.min.z))),
    max: vec3(Math.max(...groups.map((g) => g.max.x)), Math.max(...groups.map((g) => g.max.y)), Math.max(...groups.map((g) => g.max.z))),
    evaluate: (x, y, z) => {
      let distance = smoothMin(groupDistance(palm, x, y, z, arm.join + MARGIN), groupDistance(arm, x, y, z, arm.join + MARGIN), arm.join);

      for (const digit of digits) {
        // A digit further away than the hand so far plus its join cannot change it.
        if (boxDistance(digit, x, y, z) <= distance + digit.join) {
          distance = smoothMin(distance, groupDistance(digit, x, y, z, digit.join + MARGIN), digit.join);
        }
      }

      return distance;
    },
    // A smooth union rounds out by at most a quarter of its softness.
    reach: (direction, parts) => groups
      .filter((group) => !parts || parts.includes(group.name))
      .reduce((furthest, group) => group.primitives.reduce((most, shape) => Math.max(most, shape.reach(direction)), furthest), Number.NEGATIVE_INFINITY)
      + BLEND.palm / 4,
    groupDistances: (x, y, z, out) => {
      for (let index = 0; index < groups.length; index += 1) {
        out[index] = groupDistance(groups[index], x, y, z, Number.POSITIVE_INFINITY);
      }

      return out;
    },
    shapeDistances: (x, y, z, out) => {
      for (let index = 0; index < shapes.length; index += 1) {
        out[index] = shapes[index].distance(x, y, z);
      }

      return out;
    },
  };
};

// The way a point's surface faces: the field's gradient, by central differences.
export const fieldNormal = (evaluate: HandField["evaluate"], x: number, y: number, z: number, step = 0.3): Vec3 => normalize(vec3(
  evaluate(x + step, y, z) - evaluate(x - step, y, z),
  evaluate(x, y + step, z) - evaluate(x, y - step, z),
  evaluate(x, y, z + step) - evaluate(x, y, z - step),
));

