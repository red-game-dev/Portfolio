import { recordOf } from "@/packages/core/domain";
import type { JointTurns, Skeleton } from "@/packages/graphics/stage3d";
import { DEG } from "@/packages/math/angles";
import { cross, fromAxisAngle, IDENTITY, multiply, normalize, scale, slerp, vec3 } from "@/packages/math/space";

import { DigitName, HandAnatomy, HandPose } from "../domain/types";
import { digitFrames, FINGERS, jointNamesOf } from "./skeleton";

// A pose as joint turns: each joint of a digit bent towards the palm about its hinge (the axis across the digit, square
// to the way it points and the way its back faces), a finger's knuckle also turned sideways, and the thumb's base also
// swung across the palm and turned on its own axis. The skeleton's joints rest unturned, so a turn in a joint's own
// frame is a turn about these axes as they stood at rest.

// The axis the thumb swings across the palm about: the hand's own length, so it comes under the palm.
const ACROSS_AXIS = vec3(0, -1, 0);

export interface HandPoser {
  turnsOf(pose: HandPose): JointTurns;
}

export const createHandPoser = (anatomy: HandAnatomy, skeleton: Skeleton): HandPoser => {
  const frames = digitFrames(anatomy);
  const jointOf = new Map(skeleton.joints.map((joint, index) => [joint.name, index]));
  const hingeOf = (digit: DigitName) => normalize(cross(frames[digit].back, frames[digit].direction));

  return {
    turnsOf: (pose) => {
      const turns: JointTurns = skeleton.joints.map(() => undefined);

      FINGERS.forEach((finger) => {
        const names = jointNamesOf(finger);
        const hinge = hingeOf(finger);
        const { curl, splay = 0 } = pose.fingers[finger];

        curl.forEach((angle, index) => {
          const joint = jointOf.get(names[index + 1]);

          if (joint === undefined) {
            return;
          }

          const bend = fromAxisAngle(hinge, angle * DEG);

          turns[joint] = index === 0 ? multiply(bend, fromAxisAngle(scale(frames[finger].back, -1), splay * DEG)) : bend;
        });
      });

      const names = jointNamesOf("thumb");
      const hinge = hingeOf("thumb");
      const { curl, across = 0, roll = 0 } = pose.thumb;

      curl.forEach((angle, index) => {
        const joint = jointOf.get(names[index]);

        if (joint === undefined) {
          return;
        }

        const bend = fromAxisAngle(hinge, angle * DEG);

        turns[joint] = index === 0
          ? multiply(multiply(fromAxisAngle(ACROSS_AXIS, across * DEG), fromAxisAngle(frames.thumb.direction, roll * DEG)), bend)
          : bend;
      });

      return turns;
    },
  };
};

// Partway from one pose's turns to another's, joint by joint.
export const blendTurns = (from: JointTurns, to: JointTurns, t: number): JointTurns =>
  from.map((turn, index) => slerp(turn ?? IDENTITY, to[index] ?? IDENTITY, t));

export const mixPoses = (from: HandPose, to: HandPose, t: number): HandPose => {
  const mixAngle = (a: number, b: number) => a + (b - a) * t;
  const mixDigit = <T extends { curl: [number, number, number]; splay?: number }>(a: T, b: T): T => ({
    ...a,
    curl: [mixAngle(a.curl[0], b.curl[0]), mixAngle(a.curl[1], b.curl[1]), mixAngle(a.curl[2], b.curl[2])],
    splay: (a.splay ?? 0) + ((b.splay ?? 0) - (a.splay ?? 0)) * t,
  });

  return {
    fingers: recordOf(FINGERS, (finger) => mixDigit(from.fingers[finger], to.fingers[finger])),
    thumb: {
      ...mixDigit(from.thumb, to.thumb),
      across: (from.thumb.across ?? 0) + ((to.thumb.across ?? 0) - (from.thumb.across ?? 0)) * t,
      roll: (from.thumb.roll ?? 0) + ((to.thumb.roll ?? 0) - (from.thumb.roll ?? 0)) * t,
    },
  };
};

