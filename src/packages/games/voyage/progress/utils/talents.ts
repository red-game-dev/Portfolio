import { GEAR_STATS } from "../../gear/config/slots";
import { GearStats } from "../../gear/domain/gear";
import { TALENT_EVERY, TalentBranch, TALENTS, TalentSpec } from "../config/talents";

// The points a pilot's level has given.
export const talentPoints = (level: number): number => Math.floor(Math.max(0, level) / TALENT_EVERY);

// The points spent: every rank of every talent.
export const spentPoints = (talents: Readonly<Record<string, number>>): number => TALENTS.reduce((sum, spec) => sum + (talents[spec.id] ?? 0), 0);

// The points sitting in a branch.
export const branchPoints = (talents: Readonly<Record<string, number>>, branch: TalentBranch): number => TALENTS
  .filter((spec) => spec.branch === branch)
  .reduce((sum, spec) => sum + (talents[spec.id] ?? 0), 0);

// Whether a talent can take another rank: below its most, its branch open far enough, and a point free.
export const canLearn = (talents: Readonly<Record<string, number>>, spec: TalentSpec, level: number): boolean =>
  (talents[spec.id] ?? 0) < spec.max && branchPoints(talents, spec.branch) >= spec.requires && spentPoints(talents) < talentPoints(level);

// What the talents learned add to the ship, every rank counted.
export const talentStats = (talents: Readonly<Record<string, number>>): GearStats => {
  const total: GearStats = {};

  for (const spec of TALENTS) {
    const ranks = talents[spec.id] ?? 0;

    for (const stat of GEAR_STATS) {
      const share = spec.stats[stat];

      if (share && ranks > 0) {
        total[stat] = (total[stat] ?? 0) + share * ranks;
      }
    }
  }

  return total;
};

// Talents read back kept to what exists, each within its most, and no more points than the level gives (later
// talents dropped first if a profile claims too many), each only where its branch is open far enough.
export const cleanTalents = (talents: Readonly<Record<string, number>> | undefined, level: number): Record<string, number> => {
  const clean: Record<string, number> = {};
  let left = talentPoints(level);

  for (const spec of TALENTS) {
    const ranks = Math.max(0, Math.min(spec.max, Math.floor(talents?.[spec.id] ?? 0), left));

    if (ranks > 0 && branchPoints(clean, spec.branch) >= spec.requires) {
      clean[spec.id] = ranks;
      left -= ranks;
    }
  }

  return clean;
};
