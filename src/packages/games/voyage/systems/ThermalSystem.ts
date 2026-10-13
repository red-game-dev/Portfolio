import type { System } from "@/packages/games/engine";

import { MODULE_IDS, ModuleId } from "../domain/components";
import { boostStrength } from "../utils/boosts";
import { levelOf } from "./boosts";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { environmentAt } from "./environment";
import { shipOf } from "./queries";

// Sensors take radiation this hard (integrity per second per million uSv/h) without shields, a fifth of it with.
const RADIATION_WEAR = 1;
// A heat sink draws the hull down to its temperature this many times as fast as it would cool on its own.
const SINK_SPEED = 0.15;

// Heat and what it does: the hull drifts towards the temperature of its surroundings (cooling slower as its
// radiators fail), each system past the temperature it was built for wears out (the sensors first, then the
// shields, the tank boils, the plating melts, the engines last), a holed tank leaks, and radiation eats at the
// sensors. Each system that falls below half, or goes, is announced once. Heating in a star's light, the pilot is
// warned before any of it begins, early enough to burn away: a ship left alone falls sunward.
export class ThermalSystem implements System<VoyageContext> {
  public readonly name = "thermal";
  private isMelting = false;
  private isWarned = false;

  public reset(): void {
    this.isMelting = false;
    this.isWarned = false;
  }

  public update(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying") {
      this.isMelting = false;

      return;
    }

    const { body, ship, health, modules } = parts;
    const environment = environmentAt(context, body, ship);
    const { ratings } = config.thermal;
    // A heat sink holds the hull no warmer than its own temperature, and nothing wears from heat while it lasts.
    const heatSink = levelOf(context, "heatSink");
    const isSunk = heatSink > 0;
    const around = isSunk ? Math.min(environment.temperatureC, boostStrength("heatSink", heatSink)) : environment.temperatureC;
    // A magnetic shield keeps radiation off the sensors.
    const isShielded = levelOf(context, "magneticShield") > 0;

    state.readings.environmentC = environment.temperatureC;
    state.readings.sunlight = environment.sunlight;
    state.readings.radiation = environment.radiation;

    const isCooling = ship.temperatureC > around;
    const timeConstant = config.thermal.timeConstant * (isCooling ? 1 / (0.3 + 0.7 * modules.radiators) : 1) * (isSunk ? SINK_SPEED : 1);

    ship.temperatureC += (around - ship.temperatureC) * (1 - Math.exp(-dt / timeConstant));

    // The first harm heat does: the fuel boiling off, or the system built for the least heat starting to wear.
    let firstHarmC = config.thermal.boilOffC;

    MODULE_IDS.forEach((id) => {
      const over = (ship.temperatureC - ratings[id]) / Math.max(100, ratings[id]);

      firstHarmC = Math.min(firstHarmC, ratings[id]);

      if (over > 0 && !isSunk) {
        this.wear(context, id, config.thermal.wear * over * dt);
      }
    });

    // Only the open sky's heat is warned of: air and the ground have their own dangers and their own lines.
    const isInStarlight = environment.heatFrom !== null && state.readings.airC === null && !ship.landedOn;

    this.warn(context, ship.temperatureC, around, isInStarlight ? environment.heatFrom : null, firstHarmC);

    const shielded = health.shields > 0 ? 0.2 : 1;

    if (!isShielded) {
      this.wear(context, "sensors", (environment.radiation / 1e6) * RADIATION_WEAR * shielded * dt);
    }

    if (ship.temperatureC > config.thermal.boilOffC) {
      ship.fuel = Math.max(0, ship.fuel - config.thermal.boilOff * ((ship.temperatureC - config.thermal.boilOffC) / 100) * dt);
    }

    if (modules.fuel < 0.6) {
      ship.fuel = Math.max(0, ship.fuel - (0.6 - modules.fuel) * 2 * dt);
    }

    const melting = (ship.temperatureC - ratings.hull) / ratings.hull;

    if (melting > 0) {
      if (!this.isMelting) {
        events.emit("melting", { temperatureC: ship.temperatureC });
      }

      // Melting in the open, from the star itself, is not something the warm up saves the ship from.
      applyDamage(context, config.thermal.melt * (melting + 0.3) * dt, environment.heatAngle, environment.temperatureC > ratings.hull ? "melt" : "heat");
    }

    this.isMelting = melting > 0;
  }

  // Still heating in a star's light (`star`, null elsewhere) and within the margin of the first harm, the pilot is
  // told once, and again only once the hull has cooled as far below the warning as the margin.
  private warn({ config, events }: VoyageContext, temperatureC: number, aroundC: number, star: string | null, firstHarmC: number): void {
    const { warnMarginC } = config.thermal;
    const warnC = firstHarmC - warnMarginC;

    if (!this.isWarned && star !== null && temperatureC >= warnC && aroundC > temperatureC) {
      this.isWarned = true;
      events.emit("heating", { temperatureC, star });
    } else if (this.isWarned && temperatureC < warnC - warnMarginC) {
      this.isWarned = false;
    }
  }

  private wear({ world, state, events }: VoyageContext, id: ModuleId, amount: number): void {
    const modules = world.stores.modules.get(state.ship);

    if (!modules || amount <= 0 || modules[id] <= 0) {
      return;
    }

    const before = modules[id];

    modules[id] = Math.max(0, before - amount);

    if (before >= 0.5 && modules[id] < 0.5) {
      events.emit("failing", { module: id, isGone: false });
    }

    if (modules[id] === 0) {
      events.emit("failing", { module: id, isGone: true });
    }
  }
}
