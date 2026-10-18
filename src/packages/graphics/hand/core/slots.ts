import type { ModelAsset } from "@/packages/graphics/stage3d";

import { RIGHT_HAND } from "../config/anatomy";
import { HAND_POSES, HandPoseName } from "../config/poses";
import { buildHandModel } from "./buildHandModel";

// The hand's slots, a right hand meshed in each pose a scene holds it in: pointing (pressing bends a little from it),
// pinching a card and pinching a phone.
export const HAND_MODELS = { point: "hand.right.point", card: "hand.right.card", phone: "hand.right.phone" } as const;

const POSE_OF: Record<string, HandPoseName> = { [HAND_MODELS.point]: "point", [HAND_MODELS.card]: "card", [HAND_MODELS.phone]: "phone" };

export const isHandModel = (model: string): boolean => model in POSE_OF;

// Builds the model a hand slot names, for a model source (in a worker, so the page never waits on it).
export const buildHandSlot = (model: string): ModelAsset => {
  const pose = POSE_OF[model];

  if (!pose) {
    throw new Error(`No hand slot "${model}"`);
  }

  return buildHandModel(model, RIGHT_HAND, { pose: HAND_POSES[pose] });
};
