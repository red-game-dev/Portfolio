import { meshSurface } from "@/packages/graphics/sdf";
import type { ModelAsset } from "@/packages/graphics/stage3d";

import { RIGHT_HAND } from "../config/anatomy";
import { HandAnatomy, HandPose } from "../domain/types";
import { skinDetails } from "./details";
import { handField } from "./field";
import { nailMeshes } from "./nails";
import { createHandPoser } from "./poser";
import { handSkeleton } from "./skeleton";
import { skinMap, skinMapArea } from "./skinMap";
import { skinWeights } from "./skinning";

export interface HandModelOptions {
  // The grid the skin is meshed on, in millimetres: finer is smoother and heavier (1.6 makes about 30,000 vertices).
  spacing?: number;
  // The skin's colour, which its own per vertex shifts multiply.
  skin?: string;
  // The pose the hand is meshed in. Its bones then rest in that pose, so a hand shown near it (pointing, then pressing)
  // bends only a little from how it was made and every joint keeps the flesh the pose gave it.
  pose?: HandPose;
}

// A light skin tone, as sRGB.
export const LIGHT_SKIN = "#f0c3a3";

// The whole hand as a slot's model, built from its anatomy in millimetres and meshed in a pose: the skin (from its
// field, rigged to the WebXR joints from the shapes it is made of, with its joints' lines, colour shifts and place on
// the map of its veins and hair for the shader) and the nails, on one skeleton whose bones rest in that pose.
export const buildHandModel = (id: string, anatomy: HandAnatomy = RIGHT_HAND, { spacing = 1.6, skin = LIGHT_SKIN, pose }: HandModelOptions = {}): ModelAsset => {
  const skeleton = handSkeleton(anatomy);
  const bindTurns = pose ? createHandPoser(anatomy, skeleton).turnsOf(pose) : [];
  const field = handField(anatomy, bindTurns);
  const surface = meshSurface(field.evaluate, field, spacing);
  const weights = skinWeights(surface.positions, field);
  const area = skinMapArea(anatomy);
  const details = skinDetails(surface.positions, surface.normals, field, area);

  return {
    id,
    skeleton,
    bindTurns,
    textures: { skin: skinMap(anatomy) },
    parts: [
      {
        name: "skin",
        material: { kind: "skin", colour: skin, detail: "skin" },
        mesh: {
          ...surface,
          colors: details.colours,
          uvs: details.uvs,
          skinIndices: weights.indices,
          skinWeights: weights.weights,
          extras: { crease: { size: 4, data: details.creases }, mapped: { size: 1, data: details.mapped } },
        },
      },
      { name: "nails", material: { kind: "nail" }, mesh: nailMeshes(field, anatomy, skeleton) },
    ],
  };
};
