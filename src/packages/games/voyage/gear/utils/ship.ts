import { VoyageConfig } from "../../config";
import { configForLevel } from "../../economy/config/tiers";
import { PILOT_LEVEL_POWER } from "../config/levels";
import { GearStats } from "../domain/gear";

// What a ship can do: its hull and mark (`configForLevel`), then everything its fitted pieces add and a little for
// every level its pilot has reached. Speed grows by half its share and range by half, so no fitting outruns what
// the space allows or fires from off the screen.
export const configForShip = (base: VoyageConfig, level: number, stats: GearStats, pilotLevel = 1): VoyageConfig => {
  const hull = configForLevel(base, level);
  const pilot = 1 + PILOT_LEVEL_POWER * (Math.max(1, pilotLevel) - 1);
  const share = (stat: keyof GearStats) => stats[stat] ?? 0;
  const { ship, thermal, arms } = hull;
  const heat = 1 + share("heat");

  return {
    ...hull,
    ship: {
      ...ship,
      hull: Math.round(ship.hull * (1 + share("hull")) * pilot),
      shields: Math.round(ship.shields * (1 + share("shields")) * pilot),
      shieldRegen: ship.shieldRegen * (1 + share("regen")),
      shieldDelayMs: ship.shieldDelayMs * Math.max(0.4, 1 - share("regen") / 2),
      fuel: Math.round(ship.fuel * (1 + share("fuel"))),
      burn: ship.burn / (1 + share("economy")),
      thrust: ship.thrust * (1 + share("thrust")),
      brake: ship.brake * (1 + share("thrust")),
      turnRate: ship.turnRate * (1 + share("turn")),
      maxSpeed: ship.maxSpeed * (1 + share("speed") * 0.5),
      resist: share("resist"),
    },
    thermal: {
      ...thermal,
      ratings: {
        hull: Math.round(thermal.ratings.hull * (1 + share("plating"))),
        engines: Math.round(thermal.ratings.engines * heat),
        shields: Math.round(thermal.ratings.shields * heat),
        sensors: Math.round(thermal.ratings.sensors * heat * (1 + share("sensors"))),
        fuel: Math.round(thermal.ratings.fuel * heat),
        radiators: Math.round(thermal.ratings.radiators * heat),
      },
      pressureBar: Math.round(thermal.pressureBar * (1 + share("pressure") + share("plating") / 2)),
    },
    arms: {
      ...arms,
      damage: arms.damage * (1 + share("damage")) * pilot,
      rate: arms.rate * (1 + share("rate")),
      range: arms.range * (1 + share("range") * 0.5),
      crit: share("crit"),
    },
    faults: { ...hull.faults, aim: hull.faults.aim / (1 + share("sensors")) },
    pickups: { ...hull.pickups, magnet: hull.pickups.magnet * (1 + share("magnet")) },
  };
};
