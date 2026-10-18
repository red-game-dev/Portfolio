import { add, conjugate, cross, fromBasis, IDENTITY, multiply, normalize, Quat, rotate, scale, sub, Vec3 } from "@/packages/math/space";

import { JointTurns, ModelSocket, Skeleton } from "../domain/types";

export interface PosedSkeleton {
  // Each joint's place and turn in the model's space.
  positions: Vec3[];
  rotations: Quat[];
}

// Forward kinematics: where every joint of a skeleton ends up once each is turned in its parent's frame. A joint
// keeps its rest offset from its parent, turned by everything above it.
export const poseSkeleton = (skeleton: Skeleton, turns: JointTurns): PosedSkeleton => {
  const positions: Vec3[] = [];
  const rotations: Quat[] = [];

  skeleton.joints.forEach((joint, index) => {
    const turn = turns[index] ?? IDENTITY;

    if (joint.parent < 0) {
      positions.push(joint.position);
      rotations.push(turn);

      return;
    }

    const parentRotation = rotations[joint.parent];
    const offset = sub(joint.position, skeleton.joints[joint.parent].position);

    positions.push(add(positions[joint.parent], rotate(parentRotation, offset)));
    rotations.push(multiply(parentRotation, turn));
  });

  return { positions, rotations };
};

export const jointIndex = (skeleton: Skeleton, name: string): number => skeleton.joints.findIndex((joint) => joint.name === name);

// Where a point stands and which ways it faces, forward and up.
export interface Socketed {
  position: Vec3;
  forward: Vec3;
  up: Vec3;
}

// A socket on a posed skeleton, in the model's space.
export const socketAt = (posed: PosedSkeleton, socket: ModelSocket): Socketed => {
  const turn = posed.rotations[socket.joint];

  return {
    position: add(posed.positions[socket.joint], rotate(turn, socket.offset)),
    forward: rotate(turn, socket.forward),
    up: rotate(turn, socket.up),
  };
};

// The point halfway between two sockets, facing up from the second to the first and forward as the first does: where
// a thumb and a fingertip pinch, and the way out of what they hold.
export const socketBetween = (first: Socketed, second: Socketed): Socketed => {
  const up = normalize(sub(first.position, second.position));
  const along = sub(first.forward, scale(up, first.forward.x * up.x + first.forward.y * up.y + first.forward.z * up.z));

  return { position: scale(add(first.position, second.position), 0.5), forward: normalize(along), up };
};

// The frame of a forward and up direction, made square (up kept as near as it can be while square to forward).
const frameOf = (forward: Vec3, up: Vec3): Quat => {
  const ahead = normalize(forward);
  const side = normalize(cross(ahead, up));

  return fromBasis(side, ahead, cross(side, ahead));
};

// Where to stand and how to turn an actor (its model at `unit` scale) so that a socket of it lands on a target, facing
// the target's way forward and up: a hand's fingertip on a key, its thumb on a card.
export const attachBy = (socket: Socketed, unit: number, target: Socketed): { position: Vec3; rotation: Quat } => {
  const rotation = multiply(frameOf(target.forward, target.up), conjugate(frameOf(socket.forward, socket.up)));

  return { position: sub(target.position, rotate(rotation, scale(socket.position, unit))), rotation };
};

