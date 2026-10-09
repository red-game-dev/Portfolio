import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { shipOf } from "./queries";

// Over time: shields recharge after a pause without hits, the hull sheds heat (and burns while it is over its
// limit), and when the hull is gone the ship is destroyed and the run ends.
export class HealthSystem implements System<VoyageContext> {
  public readonly name = "health";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying") {
      return;
    }

    const { body, ship, health } = parts;

    health.rechargeIn = Math.max(0, health.rechargeIn - dt * 1000);

    if (health.rechargeIn === 0) {
      health.shields = Math.min(health.maxShields, health.shields + config.ship.shieldRegen * dt);
    }

    if (ship.heat > 1) {
      applyDamage(context, config.flight.overheat * (ship.heat - 1 + 0.5) * dt, ship.angle, "heat");
    }

    ship.heat = Math.max(0, ship.heat - config.flight.cooling * ship.heat * dt);

    if (health.hull <= 0) {
      state.status = "over";
      state.phaseMs = 0;
      events.emit("destroyed", { x: body.x, y: body.y, vx: body.vx, vy: body.vy, angle: ship.angle });
    }
  }
}
