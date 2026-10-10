import { VoyageStyle } from "./theme";

// The boosts found as glowing cores in space. Four turn up anywhere; three belong to our solar system and lean on
// its real physics; each of the site's universes and each kind of deep one has one of its own.
export type BoostId =
  | "afterburner"
  | "overcharge"
  | "tractor"
  | "decoy"
  | "solarSail"
  | "magneticShield"
  | "ionBurn"
  | "bulletTime"
  | "wingman"
  | "blockShield"
  | "luckyRoll"
  | "pixelBlink"
  | "cloak"
  | "warpJump"
  | "prism"
  | "heatSink"
  | "gravityWell";

// Where a boost is found: anywhere, our solar system, or the universes of one style.
export type BoostOrigin = "anywhere" | "solar" | VoyageStyle;

// One boost: where it is found, how common it is there (a weight), how long it lasts (seconds, nothing for one that
// acts at once), how long before it can be used again (seconds), and how much stronger each level makes it.
export interface BoostSpec {
  id: BoostId;
  origin: BoostOrigin;
  weight: number;
  durationS: number;
  cooldownS: number;
  strength: number;
  perLevel: number;
}

// A boost at work: which, at what level, and until when (ms on the run's clock).
export interface ActiveBoost {
  id: BoostId;
  level: number;
  until: number;
}
