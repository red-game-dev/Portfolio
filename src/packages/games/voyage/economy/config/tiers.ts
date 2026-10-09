import { VoyageConfig } from "../../config";
import { ModuleId } from "../../domain/components";
import { HullTier } from "../domain/economy";

export const TIERS: readonly HullTier[] = ["rocket", "shuttle", "corvette", "starship", "intergalactic"];

export const MARKS = 5;
export const MAX_LEVEL = TIERS.length * MARKS - 1;

// What each hull is: how much stronger in hull, shields and fuel, how much more thrust and speed, its hold, the
// heat its plating is built for (Celsius) and the pressure it can bear (bar), how much harder its guns hit and
// how much faster they fire, its size, and what it fires.
export interface TierSpec {
  strength: number;
  thrust: number;
  speed: number;
  cargo: number;
  plating: number;
  pressure: number;
  guns: number;
  rate: number;
  radius: number;
  weapon: "cannon" | "laser";
}

// A Shuttle's heat shield lands it on Venus (465 C, 92 bar); a Corvette dives into a giant's clouds; a Starship
// skims the Sun's corona for a while; an intergalactic starship goes nearly anywhere. Each hull's first mark is
// better in every way than the last hull's fifth, so an upgrade never makes the ship worse at anything.
export const TIER_SPECS: Readonly<Record<HullTier, TierSpec>> = {
  rocket: { strength: 1, thrust: 1, speed: 1, cargo: 14, plating: 600, pressure: 50, guns: 1, rate: 1, radius: 0.06, weapon: "cannon" },
  shuttle: { strength: 1.35, thrust: 1.2, speed: 1.1, cargo: 22, plating: 950, pressure: 120, guns: 1.5, rate: 1.15, radius: 0.068, weapon: "cannon" },
  corvette: { strength: 1.8, thrust: 1.45, speed: 1.2, cargo: 34, plating: 1350, pressure: 260, guns: 2.2, rate: 1.3, radius: 0.078, weapon: "laser" },
  starship: { strength: 2.4, thrust: 1.75, speed: 1.35, cargo: 50, plating: 1900, pressure: 550, guns: 3.2, rate: 1.45, radius: 0.09, weapon: "laser" },
  intergalactic: { strength: 3.2, thrust: 2.1, speed: 1.6, cargo: 80, plating: 2700, pressure: 1300, guns: 4.6, rate: 1.6, radius: 0.1, weapon: "laser" },
};

const clampLevel = (level: number) => Math.max(0, Math.min(MAX_LEVEL, Math.floor(level)));

export const tierOf = (level: number): HullTier => TIERS[Math.floor(clampLevel(level) / MARKS)];

export const markOf = (level: number): number => (clampLevel(level) % MARKS) + 1;

export const levelOf = (tier: HullTier, mark: number): number => TIERS.indexOf(tier) * MARKS + mark - 1;

// How much room a ship at a level has in its hold.
export const cargoFor = (level: number): number => TIER_SPECS[tierOf(level)].cargo + 2 * (markOf(level) - 1);

// What a ship at a level can do, over the config every run starts from: each mark a little better, each hull a
// lot. A greater hull also bears more heat and pressure, so the plating rating rises with it and every other
// system's by part of as much, and fires harder and faster, from the Corvette on with a laser.
export const configForLevel = (base: VoyageConfig, level: number): VoyageConfig => {
  const spec = TIER_SPECS[tierOf(level)];
  const mark = markOf(level) - 1;
  const grow = (1 + 0.07 * mark) * spec.strength;
  const heat = spec.plating / TIER_SPECS.rocket.plating;
  const rate = (id: ModuleId) => Math.round(base.thermal.ratings[id] * (id === "hull" ? heat : 1 + (heat - 1) * 0.6) + mark * 15);

  return {
    ...base,
    ship: {
      ...base.ship,
      radius: spec.radius,
      hull: Math.round(base.ship.hull * grow),
      shields: Math.round(base.ship.shields * grow),
      shieldRegen: base.ship.shieldRegen * grow,
      fuel: Math.round(base.ship.fuel * (1 + 0.05 * mark) * spec.strength),
      thrust: base.ship.thrust * (1 + 0.04 * mark) * spec.thrust,
      brake: base.ship.brake * spec.thrust,
      maxSpeed: base.ship.maxSpeed * spec.speed,
    },
    thermal: {
      ...base.thermal,
      ratings: { hull: rate("hull"), engines: rate("engines"), shields: rate("shields"), sensors: rate("sensors"), fuel: rate("fuel"), radiators: rate("radiators") },
      pressureBar: spec.pressure + mark * 10,
    },
    arms: {
      ...base.arms,
      kind: spec.weapon,
      damage: base.arms.damage * (1 + 0.1 * mark) * spec.guns,
      rate: base.arms.rate * spec.rate,
      range: base.arms.range * (1 + 0.05 * TIERS.indexOf(tierOf(level))),
    },
  };
};
