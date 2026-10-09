import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { shipOf } from "./queries";

// Solid ground: touching a rocky body slowly is a landing, the ship coming to rest upright on the surface;
// touching it fast is a crash, damage growing with the square of the excess speed and the ship bouncing off.
// Giants have no surface, only air that gets denser (see the atmosphere). Rocks that reach a surface are gone.
export class SurfaceSystem implements System<VoyageContext> {
  public readonly name = "surface";

  public update(context: VoyageContext): void {
    const { state, world, config, events } = context;

    if (state.phase !== "solar" && state.phase !== "singularity") {
      return;
    }

    world.stores.hazard.entities.forEach((entity) => {
      const rock = world.stores.body.get(entity);

      if (rock && state.route.bodies.some((route) => Math.hypot(rock.x - route.x, rock.y - route.y) < route.radius * (route.isGiant ? 0.9 : 1))) {
        world.despawn(entity);
      }
    });

    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.capture || parts.ship.landedOn) {
      return;
    }

    const { body, ship } = parts;

    for (const route of state.route.bodies) {
      if (route.isGiant) {
        continue;
      }

      const dx = body.x - route.x;
      const dy = body.y - route.y;
      const distance = Math.hypot(dx, dy);
      const contact = route.radius + body.radius;

      if (distance >= contact || distance === 0) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const speed = Math.hypot(body.vx, body.vy);
      const inward = body.vx * nx + body.vy * ny;

      body.x = route.x + nx * contact;
      body.y = route.y + ny * contact;

      if (speed <= config.flight.safeLanding && route.isLandable) {
        body.vx = 0;
        body.vy = 0;
        ship.angle = Math.atan2(ny, nx);
        ship.landedOn = route.id;
        ship.heat = Math.max(0, ship.heat - 0.2);

        if (!state.landings.has(route.id)) {
          state.landings.add(route.id);
          state.score += config.scoring.landing;
        }

        events.emit("landed", { body: route.id });
      } else {
        applyDamage(context, config.flight.crash * Math.max(0, speed - config.flight.safeLanding) ** 2, Math.atan2(-ny, -nx), "crash");

        if (inward < 0) {
          body.vx -= 1.35 * inward * nx;
          body.vy -= 1.35 * inward * ny;
        }
      }

      break;
    }
  }
}
