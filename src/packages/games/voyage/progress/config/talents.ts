import type { GearStats } from "../../gear/domain/gear";

// A pilot's talents: three branches, each a few talents bought a rank at a time with the points pilot levels give,
// the later ones open once enough points sit in their branch, and each rank adding to the ship as a fitted piece does.
export type TalentBranch = "gunnery" | "engineering" | "navigation";

export interface TalentSpec {
  id: string;
  branch: TalentBranch;
  max: number;
  // What each rank adds, as gear's stat shares.
  stats: GearStats;
  // Points already in the branch before the first rank can be bought.
  requires: number;
}

export const TALENT_BRANCHES: readonly TalentBranch[] = ["gunnery", "engineering", "navigation"];

export const TALENTS: readonly TalentSpec[] = [
  { id: "sharpshooter", branch: "gunnery", max: 5, stats: { crit: 0.015 }, requires: 0 },
  { id: "rapidLoader", branch: "gunnery", max: 5, stats: { rate: 0.03 }, requires: 0 },
  { id: "heavyCalibre", branch: "gunnery", max: 5, stats: { damage: 0.03 }, requires: 0 },
  { id: "longBarrel", branch: "gunnery", max: 3, stats: { range: 0.04 }, requires: 5 },
  { id: "deadEye", branch: "gunnery", max: 1, stats: { crit: 0.05, damage: 0.05 }, requires: 15 },
  { id: "plating", branch: "engineering", max: 5, stats: { hull: 0.04 }, requires: 0 },
  { id: "shieldTuning", branch: "engineering", max: 5, stats: { shields: 0.04, regen: 0.04 }, requires: 0 },
  { id: "heatSinks", branch: "engineering", max: 5, stats: { heat: 0.05 }, requires: 0 },
  { id: "reinforced", branch: "engineering", max: 3, stats: { resist: 0.02 }, requires: 5 },
  { id: "bulwark", branch: "engineering", max: 1, stats: { hull: 0.08, resist: 0.04 }, requires: 15 },
  { id: "thrusters", branch: "navigation", max: 5, stats: { thrust: 0.03 }, requires: 0 },
  { id: "efficiency", branch: "navigation", max: 5, stats: { economy: 0.04, fuel: 0.03 }, requires: 0 },
  { id: "agility", branch: "navigation", max: 3, stats: { turn: 0.05 }, requires: 0 },
  { id: "scanners", branch: "navigation", max: 3, stats: { sensors: 0.05, magnet: 0.06 }, requires: 5 },
  { id: "voyager", branch: "navigation", max: 1, stats: { speed: 0.06, thrust: 0.05 }, requires: 12 },
];

// A talent point every this many pilot levels: 50 by level 300, fewer than every rank, so a pilot chooses.
export const TALENT_EVERY = 6;
