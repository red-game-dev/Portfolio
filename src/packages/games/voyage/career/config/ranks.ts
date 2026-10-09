import { RankSpec } from "../domain/career";

// A pilot's ranks, by the experience missions pay.
export const RANKS: readonly RankSpec[] = [
  { id: "cadet", xp: 0 },
  { id: "ensign", xp: 150 },
  { id: "lieutenant", xp: 450 },
  { id: "lieutenantCommander", xp: 900 },
  { id: "commander", xp: 1600 },
  { id: "captain", xp: 2600 },
  { id: "commodore", xp: 4000 },
  { id: "rearAdmiral", xp: 6000 },
  { id: "viceAdmiral", xp: 8500 },
  { id: "admiral", xp: 12000 },
  { id: "fleetAdmiral", xp: 16000 },
];

export const rankFor = (xp: number): number => {
  let rank = 0;

  RANKS.forEach((spec, index) => {
    if (xp >= spec.xp) {
      rank = index;
    }
  });

  return rank;
};
