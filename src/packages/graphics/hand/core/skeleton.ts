import type { PosedSkeleton, Skeleton, SkeletonJoint } from "@/packages/graphics/stage3d";
import { DEG } from "@/packages/math/angles";
import { add, cross, dot, normalize, rotate, scale, sub, Vec3, vec3 } from "@/packages/math/space";

import { DigitName, FingerName, HandAnatomy } from "../domain/types";

export const FINGERS: FingerName[] = ["index", "middle", "ring", "pinky"];

export const DIGITS: DigitName[] = ["thumb", ...FINGERS];

// The joints of a hand as the WebXR hand standard names and orders them, so any model on the standard poses the same.
const FINGER_JOINTS = ["metacarpal", "phalanx-proximal", "phalanx-intermediate", "phalanx-distal", "tip"];

const THUMB_JOINTS = ["metacarpal", "phalanx-proximal", "phalanx-distal", "tip"];

export const jointNamesOf = (digit: DigitName): string[] =>
  (digit === "thumb" ? THUMB_JOINTS.map((joint) => `thumb-${joint}`) : FINGER_JOINTS.map((joint) => `${digit}-finger-${joint}`));

// A digit laid out: its joints from its base in the wrist to its tip (a finger has a joint more than the thumb), the
// way it points, the way its back (and nail) faces, the way across it, and its radius at each joint.
export interface DigitFrame {
  digit: DigitName;
  joints: Vec3[];
  direction: Vec3;
  back: Vec3;
  side: Vec3;
  radii: number[];
  // The phalanges' lengths, knuckle out.
  lengths: number[];
  // Each segment's own way along, back and across, from one joint to the next: all the same at rest, each turned
  // with its bone once the digit is posed.
  directions: Vec3[];
  backs: Vec3[];
  sides: Vec3[];
}

const segmentsOf = (count: number, value: Vec3) => Array.from({ length: count - 1 }, () => value);

// A metacarpal's radius where it starts in the wrist.
const METACARPAL_RADIUS = 7;

const fingerFrame = (digit: FingerName, anatomy: HandAnatomy): DigitFrame => {
  const finger = anatomy.fingers[digit];
  const turn = finger.splay * DEG;
  const direction = vec3(Math.sin(turn), Math.cos(turn), 0);
  const back = vec3(0, 0, 1);
  const joints = [finger.base, finger.knuckle];

  finger.lengths.forEach((length) => joints.push(add(joints[joints.length - 1], scale(direction, length))));

  const side = cross(direction, back);

  return {
    digit,
    joints,
    direction,
    back,
    side,
    radii: [METACARPAL_RADIUS, ...finger.widths.map((width) => width / 2)],
    lengths: [...finger.lengths],
    directions: segmentsOf(joints.length, direction),
    backs: segmentsOf(joints.length, back),
    sides: segmentsOf(joints.length, side),
  };
};

const thumbFrame = (anatomy: HandAnatomy): DigitFrame => {
  const { thumb } = anatomy;
  const direction = normalize(thumb.direction);
  // Its back made square to the way it points.
  const back = normalize(sub(thumb.back, scale(direction, dot(thumb.back, direction))));
  const joints = [thumb.base, thumb.knuckle];

  thumb.lengths.forEach((length) => joints.push(add(joints[joints.length - 1], scale(direction, length))));

  const side = cross(direction, back);

  return {
    digit: "thumb",
    joints,
    direction,
    back,
    side,
    radii: thumb.widths.map((width) => width / 2),
    lengths: [...thumb.lengths],
    directions: segmentsOf(joints.length, direction),
    backs: segmentsOf(joints.length, back),
    sides: segmentsOf(joints.length, side),
  };
};

export const digitFrames = (anatomy: HandAnatomy): Record<DigitName, DigitFrame> => ({
  thumb: thumbFrame(anatomy),
  index: fingerFrame("index", anatomy),
  middle: fingerFrame("middle", anatomy),
  ring: fingerFrame("ring", anatomy),
  pinky: fingerFrame("pinky", anatomy),
});

// The wrist at the origin, then each digit's joints after it, in the standard's order.
export const handSkeleton = (anatomy: HandAnatomy): Skeleton => {
  const frames = digitFrames(anatomy);
  const joints: SkeletonJoint[] = [{ name: "wrist", parent: -1, position: vec3() }];

  DIGITS.forEach((digit) => {
    const names = jointNamesOf(digit);

    frames[digit].joints.forEach((position, index) => {
      joints.push({ name: names[index], parent: index === 0 ? 0 : joints.length - 1, position });
    });
  });

  return { joints };
};

// Each digit's joints as indices into the hand's skeleton, in the digit's own order.
export const digitJoints = (skeleton: Skeleton): Record<DigitName, number[]> => {
  const jointOf = new Map(skeleton.joints.map((joint, index) => [joint.name, index]));

  return Object.fromEntries(DIGITS.map((digit) => [digit, jointNamesOf(digit).map((name) => jointOf.get(name) ?? 0)])) as Record<DigitName, number[]>;
};

// A digit's frame once the skeleton is posed: its joints where they went, and each segment's axes turned with the bone
// that carries it (the segment from a joint is carried by that joint).
export const poseFrame = (frame: DigitFrame, joints: number[], posed: PosedSkeleton): DigitFrame => {
  const turnOf = (segment: number) => posed.rotations[joints[segment]];
  const directions = frame.directions.map((direction, segment) => rotate(turnOf(segment), direction));
  const last = directions.length - 1;

  return {
    ...frame,
    joints: joints.map((joint) => posed.positions[joint]),
    directions,
    backs: frame.backs.map((back, segment) => rotate(turnOf(segment), back)),
    sides: frame.sides.map((side, segment) => rotate(turnOf(segment), side)),
    direction: directions[last],
    back: rotate(turnOf(last), frame.back),
    side: rotate(turnOf(last), frame.side),
  };
};
