import type { System } from "@/packages/games/engine";
import { damp } from "@/packages/physics/newtonian";

import { boostStrength } from "../utils/boosts";
import { levelOf } from "./boosts";
import { VoyageContext } from "./context";
import { mediumAt } from "./medium";
import { bodyById, shipOf } from "./queries";

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

        // How fast it can go is the engines' top speed, and with space felt, as the space round it allows. The limit
        // eases from one kind of space to the next, so entering denser space slows the ship rather than stopping it
        // dead, and leaving it lets it speed up again.
        const medium = mediumAt(context, body.x, body.y);
        const afterburner = levelOf(context, "afterburner");
        const top = config.ship.maxSpeed * (context.spaceDrag === "felt" ? config.medium.speeds[medium] : 1) *
          (afterburner > 0 ? boostStrength("afterburner", afterburner) : 1);
        const speed = Math.hypot(body.vx, body.vy);

        state.readings.medium = medium;
        state.speedLimit += (top - state.speedLimit) * (1 - Math.exp(-config.medium.easing * dt));

        if (speed > state.speedLimit) {
          body.vx *= state.speedLimit / speed;
          body.vy *= state.speedLimit / speed;
        }

        if (state.status === "flying") {
          state.flown += Math.min(speed, top) * dt;
          state.score += config.scoring.perUnit * Math.min(speed, top) * dt;
        }
      }
    }

    // Under bullet time everything but the ship moves at a share of its speed.
    const bulletTime = levelOf(context, "bulletTime");
    const others = bulletTime > 0 ? boostStrength("bulletTime", bulletTime) : 1;

    const { entities } = world.stores.body;

    for (let index = 0; index < bodies.length; index += 1) {
      const body = bodies[index];
      const step = entities[index] === state.ship ? dt : dt * others;

      body.x += body.vx * step;
      body.y += body.vy * step;
    }

    // A landed ship stays where it set down on its world, wherever the world has moved.
    const ground = parts?.ship.landedOn ? bodyById(context, parts.ship.landedOn) : undefined;

    if (parts && ground && parts.ship.landedOffset) {
      parts.body.x = ground.x + parts.ship.landedOffset.x;
      parts.body.y = ground.y + parts.ship.landedOffset.y;
    }
  }
}
