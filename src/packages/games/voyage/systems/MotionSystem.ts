import type { System } from "@/packages/games/engine";
import { damp } from "@/packages/physics/newtonian";

import { VoyageContext } from "./context";
import { shipOf } from "./queries";

// Moves everything by its velocity, one fixed step at a time, keeping the previous position for drawing between
// steps; bleeds the ship's velocity through its dampers and caps its speed; turns what spins; and counts the
// distance flown, which scores.
export class MotionSystem implements System<VoyageContext> {
  public readonly name = "motion";

  public update(context: VoyageContext, dt: number): void {
    const { world, state, config } = context;
    const bodies = world.stores.body.values;

    for (const body of bodies) {
      body.prevX = body.x;
      body.prevY = body.y;
    }

    world.stores.spin.values.forEach((spin) => {
      spin.angle += spin.rate * dt;
    });

    const parts = shipOf(context);

    if (parts) {
      const { body, ship } = parts;

      ship.prevAngle = ship.angle;

      if (!state.capture) {
        damp(body, config.ship.dampers, dt);

        const speed = Math.hypot(body.vx, body.vy);

        if (speed > config.ship.maxSpeed) {
          body.vx *= config.ship.maxSpeed / speed;
          body.vy *= config.ship.maxSpeed / speed;
        }

        if (state.status === "flying") {
          state.flown += Math.min(speed, config.ship.maxSpeed) * dt;
          state.score += config.scoring.perUnit * Math.min(speed, config.ship.maxSpeed) * dt;
        }
      }
    }

    for (const body of bodies) {
      body.x += body.vx * dt;
      body.y += body.vy * dt;
    }
  }
}
