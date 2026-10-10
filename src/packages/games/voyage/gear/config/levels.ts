import { LevelCurveSpec } from "@/packages/progression/levels";

// The pilot's levels, from experience earned for everything done, and each piece's levels, from its use. The caps
// are one number each, so either can go past 300.
export const PILOT_CURVE: LevelCurveSpec = { cap: 300, base: 25, growth: 1.25 };
export const GEAR_CURVE: LevelCurveSpec = { cap: 300, base: 20, growth: 1.2 };

// Each level the pilot reaches makes the ship this much stronger in hull, shields and damage.
export const PILOT_LEVEL_POWER = 0.0025;

// Experience each deed earns the pilot (a bounty by the fallen's level, a boss and a universe more the deeper).
export const PILOT_EXP = {
  discovery: 25,
  landing: 40,
  hosted: 40,
  bountyPerLevel: 10,
  rescue: 80,
  boss: 500,
  bossPerUniverse: 40,
  universe: 300,
  universePerIndex: 60,
  salvage: 20,
  coin: 1,
  boost: 15,
  pointsPerExp: 25,
  star: 120,
};

// Experience a piece earns: a weapon for each hit and kill it lands, the armour and shield for each hundred points
// of damage they take, and every fitted piece a share of what the pilot earns.
export const GEAR_EXP = { hit: 2, kill: 25, perHundredTaken: 6, shareOfPilot: 0.25 };
