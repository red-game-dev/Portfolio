import type { System } from "@/packages/games/engine";

import { boostStrength } from "../utils/boosts";
import { levelOf } from "./boosts";
import { VoyageContext } from "./context";
import { faultSeverity } from "./faults";
import { shipOf } from "./queries";

// Over time: shields recharge after a pause without hits, only as far and as fast as their generator still
// allows, and barely with a faulty emitter; and when the hull is gone the ship is destroyed and the run ends.
export class HealthSystem implements System<VoyageContext> {
  public readonly name = "health";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying") {
      return;
    }

    const { body, ship, health, modules } = parts;
    // An overcharge holds the shields past their most while it lasts.
    const overcharge = levelOf(context, "overcharge");
    const ceiling = health.maxShields * modules.shields * (overcharge > 0 ? boostStrength("overcharge", overcharge) : 1);

    health.rechargeIn = Math.max(0, health.rechargeIn - dt * 1000);

    if (health.rechargeIn === 0 && health.shields < ceiling) {
      const emitter = 1 - config.faults.emitter * faultSeverity(state, "emitter");

      health.shields = Math.min(ceiling, health.shields + config.ship.shieldRegen * modules.shields * emitter * dt);
    }

    health.shields = Math.min(health.shields, ceiling);

    if (health.hull <= 0) {
      state.status = "over";
      state.phaseMs = 0;
      events.emit("destroyed", { x: body.x, y: body.y, vx: body.vx, vy: body.vy, angle: ship.angle });
    }
  }
}
