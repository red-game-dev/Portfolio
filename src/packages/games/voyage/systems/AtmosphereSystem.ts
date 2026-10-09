import type { System } from "@/packages/games/engine";
import { densityAt, dragDeceleration, entryHeating } from "@/packages/physics/newtonian";

import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { placeBody, shipOf } from "./queries";

// Air: drag slows the ship and entry heats the hull, in proportion to density, the square and the cube of its
// speed. Skimming a giant's upper air scoops fuel. Below a giant's one bar level the pressure crushes the hull,
// harder the deeper it goes; in the warm up an emergency burn throws the ship clear instead of letting it die.
export class AtmosphereSystem implements System<VoyageContext> {
  public readonly name = "atmosphere";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    state.readings.density = 0;
    state.readings.airOf = null;

    if (!parts || state.status !== "flying" || state.capture || (state.phase !== "solar" && state.phase !== "singularity")) {
      return;
    }

    const { body, ship } = parts;

    for (const route of state.route.bodies) {
      const dx = body.x - route.x;
      const dy = body.y - route.y;
      const distance = Math.hypot(dx, dy);
      const altitude = distance - route.radius;

      if (!route.atmosphere || altitude > route.atmosphere.top) {
        continue;
      }

      const density = densityAt(route.atmosphere, altitude);
      const speed = Math.hypot(body.vx, body.vy);

      state.readings.density = density;
      state.readings.airOf = route.id;

      if (speed > 0 && !ship.landedOn) {
        const slow = Math.min(speed, dragDeceleration(density, speed, config.flight.drag) * dt);

        body.vx -= (body.vx / speed) * slow;
        body.vy -= (body.vy / speed) * slow;
        ship.heat += entryHeating(density, speed, config.flight.heating) * dt;
      }

      if (route.isGiant) {
        if (altitude >= 0) {
          ship.fuel = Math.min(ship.maxFuel, ship.fuel + config.flight.skim * Math.min(1, density) * dt);
        } else {
          const depth = -altitude / route.radius;
          const limit = 1 - config.flight.crushDepth;

          if (depth >= limit && config.isSolarSafe) {
            // Thrown clear to the top of the air, moving outward.
            const outX = dx / distance;
            const outY = dy / distance;
            const top = route.radius + route.atmosphere.top;

            placeBody(body, route.x + outX * top, route.y + outY * top, outX * 1.4, outY * 1.4);
            events.emit("emergency", { body: route.id });
          } else {
            applyDamage(context, config.flight.crush * (depth / limit) ** 2 * dt, Math.atan2(-dy, -dx), "crush");
          }
        }
      }

      break;
    }
  }
}
