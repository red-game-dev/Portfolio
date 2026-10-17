import type { ModelSocket, Skeleton } from "@/packages/graphics/stage3d";
import { add, scale } from "@/packages/math/space";

import { HandAnatomy } from "../domain/types";
import { digitFrames, digitJoints } from "./skeleton";

export type HandSocketName = "index-pad" | "thumb-pad";

// Where a hand is held to things: the index fingertip's pad (what presses a key) and the thumb's pad (what lies on a
// card's face), each facing the way its digit points, with its nail up.
export const handSockets = (anatomy: HandAnatomy, skeleton: Skeleton): Record<HandSocketName, ModelSocket> => {
  const frames = digitFrames(anatomy);
  const joints = digitJoints(skeleton);
  const index = frames.index;
  const thumb = frames.thumb;
  const indexRadius = index.radii[index.radii.length - 1];
  const thumbRadius = thumb.radii[thumb.radii.length - 1];

  return {
    "index-pad": {
      joint: joints.index[joints.index.length - 1],
      offset: add(scale(index.direction, -indexRadius * 0.35), scale(index.back, -indexRadius * 0.55)),
      forward: index.direction,
      up: index.back,
    },
    "thumb-pad": {
      joint: joints.thumb[joints.thumb.length - 1],
      offset: add(scale(thumb.direction, -thumbRadius * 0.9), scale(thumb.back, -thumbRadius * 0.75)),
      forward: thumb.direction,
      up: thumb.back,
    },
  };
};
