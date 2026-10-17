import type { ModelAsset } from "@/packages/graphics/stage3d";

import { buildHeadModel } from "./buildHeadModel";

// The head's slots: a customer at the counter, looking at the terminal's camera to pay by face.
export const HEAD_MODELS = { customer: "head.customer" } as const;

const SLOTS: string[] = Object.values(HEAD_MODELS);

export const isHeadModel = (model: string): boolean => SLOTS.includes(model);

// Builds the model a head slot names, for a model source (in a worker, so the page never waits on it).
export const buildHeadSlot = (model: string): ModelAsset => {
  if (!isHeadModel(model)) {
    throw new Error(`No head slot "${model}"`);
  }

  return buildHeadModel(model);
};
