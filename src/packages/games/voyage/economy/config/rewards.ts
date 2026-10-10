import { Purse } from "../domain/economy";

const purse = (RED: number, VOID = 0): Purse => ({ RED, VOID });

export interface Rewards {
  discovery: Purse;
  landing: Purse;
  hosted: Purse;
  rescue: Purse;
  deflection: Purse;
  boss: Purse;
  universe: Purse;
  coin: Purse;
  bountyPerLevel: number;
  // Red Coin for each kill of a streak, at each milestone.
  streakPerKill: number;
  pointsPerCoin: number;
  knownBlueprint: Purse;
}

// What each deed pays: a new place reached, a first landing, a welcome from those who live on a world (and a Void
// Shard as their gift), a world saved by breaking or turning a rock, a boss
// brought down, a universe reached through a black hole (and a Void Shard torn from it), a Red Coin picked up in
// flight; a bounty per level of the hostile downed; Red Coin for every so many points at the end of a run, which
// counts every rock and pickup; and for a plan found that was already known.
export const REWARDS: Rewards = {
  discovery: purse(15),
  landing: purse(25),
  hosted: purse(60, 1),
  rescue: purse(60),
  deflection: purse(80),
  boss: purse(250, 3),
  universe: purse(100, 1),
  coin: purse(5),
  bountyPerLevel: 6,
  streakPerKill: 4,
  pointsPerCoin: 40,
  knownBlueprint: purse(20),
};

// The rate Void Shards are bought and sold at, in Red Coin.
export const VOID_PRICE: { buy: number; sell: number } = { buy: 400, sell: 150 };
