// What the player asks for this step.
export interface VoyageInput {
  // A world point to turn towards, from a pointer or a finger; null when there is none.
  aim: { x: number; y: number } | null;
  // 0 to 1: how hard to burn. A pointer sets it by how far the aim is; keys set 0 or 1.
  thrust: number;
  // -1 to 1 from keys, to turn without a pointer.
  turn: number;
  brake: boolean;
  // With the guns aimed by hand: the world point they aim at, and whether the pilot is firing.
  target: { x: number; y: number } | null;
  fire: boolean;
}

export const NO_INPUT: VoyageInput = { aim: null, thrust: 0, turn: 0, brake: false, target: null, fire: false };

// How the pilot likes their landings: the way down sped up the same for every world (never longer than the config
// allows) or as long as the real thing, and flown by the guidance or, where there is an engine to fly, by hand
// from the low gate.
export interface LandingOptions {
  time: "compressed" | "real";
  control: "auto" | "manual";
}

export const DEFAULT_LANDING: LandingOptions = { time: "compressed", control: "auto" };

// How much the space round the ship slows it: felt, each place in the real order (voids emptiest, then open space,
// belts, nebulae and rings) and scaled up so it shows, or real, where space is too empty to slow a ship at all and
// how fast it goes is the engines' alone.
export type SpaceDrag = "felt" | "real";
