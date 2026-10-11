// One tier of an enhancement ladder, such as moons, then stars, then galaxies: how many steps it has, how many steps
// a failed attempt loses while in it, the chance of success at its first and its last step (shares, eased between),
// and how much each of its steps adds to whatever the host enhances (a share, such as 0.03 for three per cent).
export interface EnhanceTier {
  id: string;
  steps: number;
  fall: number;
  chance: readonly [number, number];
  bonus: number;
}

// How a step reads: which tier it is in (null for none yet), that tier's place in the ladder, and how many of the
// tier it counts, so step 13 of moons, stars and galaxies of ten reads as three stars.
export interface EnhanceForm {
  step: number;
  tier: string | null;
  tierIndex: number;
  count: number;
}

// What an attempt did: a step gained, a failure that fell some steps (perhaps back across a tier), a failure a
// protection kept from falling, or nothing at all because the top had been reached.
export type EnhanceOutcome = "success" | "fell" | "kept" | "top";

export interface EnhanceResult {
  from: number;
  to: number;
  outcome: EnhanceOutcome;
  chance: number;
}
