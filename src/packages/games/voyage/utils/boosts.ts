import { pick, pickWeighted, RandomSource } from "@/packages/math/random";

import { BOOSTS, DURATION_PER_LEVEL, LEVEL_FINDS } from "../config/boosts";
import { BoostId, BoostOrigin } from "../domain/boosts";
import { VoyageState } from "../domain/state";
import { DEEP_STYLES, VoyageStyle } from "../domain/theme";

// Whether a name is one of the boosts.
export const isBoostId = (value: string): value is BoostId => Object.prototype.hasOwnProperty.call(BOOSTS, value);

// The level a boost has reached from how many of its cores have been found: 0 before the first.
export const levelForFinds = (finds: number): number => LEVEL_FINDS.filter((needed) => finds >= needed).length;

// How strong a boost is at a level, and how long it lasts (ms).
export const boostStrength = (id: BoostId, level: number): number => BOOSTS[id].strength + BOOSTS[id].perLevel * (Math.max(1, level) - 1);

export const boostDuration = (id: BoostId, level: number): number => BOOSTS[id].durationS * (1 + DURATION_PER_LEVEL * (Math.max(1, level) - 1)) * 1000;

// The level a boost is at work at now, or 0 when it is not.
export const activeLevel = (state: Readonly<VoyageState>, id: BoostId): number =>
  state.boosts.reduce((level, active) => (active.id === id && active.until > state.elapsedMs ? Math.max(level, active.level) : level), 0);

// A boost's core to set drifting where the ship is: one of the place's own (our solar system's, or the universe's
// style's) more often than not, else one found anywhere, and now and then in the deep one of another deep style's.
export const boostToFind = (random: RandomSource, place: "solar" | VoyageStyle | null, own: number, away: number): BoostId | null => {
  const roll = random();
  const isDeep = place !== null && place !== "solar" && DEEP_STYLES.includes(place);
  const origin: BoostOrigin = place !== null && roll < own ? place : isDeep && roll < own + away
    ? pick(random, DEEP_STYLES.filter((style) => style !== place))
    : "anywhere";
  const choices = Object.values(BOOSTS).filter((spec) => spec.origin === origin);

  return pickWeighted(random, choices, (spec) => spec.weight)?.id ?? null;
};
