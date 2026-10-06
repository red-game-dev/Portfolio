import { Lens } from "@/config/lenses";
import { NETRUNNER_SPRITE, SCOUT_SPRITE, SpriteArt, STRATEGIST_SPRITE } from "@/config/sprites";

export const LENS_SPRITES: Record<Lens, SpriteArt> = {
  recruiter: SCOUT_SPRITE,
  product: STRATEGIST_SPRITE,
  engineer: NETRUNNER_SPRITE,
};

// How long each entrance takes. Reduced motion skips straight to the exit.
export const ENTRANCE_TIMING = {
  recruiterMs: 650,
  productStageMs: 480,
  productHoldMs: 700,
  engineerLineMs: 360,
  engineerGrantedMs: 1000,
  // The overlay opening onto the page once the entrance has played.
  exitMs: 650,
} as const;
