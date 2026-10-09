import type { System } from "@/packages/games/engine";

import { MODULE_IDS, ModuleId } from "../domain/components";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { environmentAt } from "./environment";
import { shipOf } from "./queries";

// Sensors take radiation this hard (integrity per second per million uSv/h) without shields, a fifth of it with.
const RADIATION_WEAR = 1;

// Heat and what it does: the hull drifts towards the temperature of its surroundings (cooling slower as its
// radiators fail), each system past the temperature it was built for wears out (the sensors first, then the
// shields, the tank boils, the plating melts, the engines last), a holed tank leaks, and radiation eats at the
// sensors. Each system that falls below half, or goes, is announced once.
export class ThermalSystem implements System<VoyageContext> {
  public readonly name = "thermal";
  private isMelting = false;

  public reset(): void {
    this.isMelting = false;
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

    state.readings.environmentC = environment.temperatureC;
    state.readings.sunlight = environment.sunlight;
    state.readings.radiation = environment.radiation;

    const isCooling = ship.temperatureC > environment.temperatureC;
    const timeConstant = config.thermal.timeConstant * (isCooling ? 1 / (0.3 + 0.7 * modules.radiators) : 1);

    ship.temperatureC += (environment.temperatureC - ship.temperatureC) * (1 - Math.exp(-dt / timeConstant));

    MODULE_IDS.forEach((id) => {
      const over = (ship.temperatureC - ratings[id]) / Math.max(100, ratings[id]);

      if (over > 0) {
        this.wear(context, id, config.thermal.wear * over * dt);
      }
    });

    const shielded = health.shields > 0 ? 0.2 : 1;

    this.wear(context, "sensors", (environment.radiation / 1e6) * RADIATION_WEAR * shielded * dt);

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
