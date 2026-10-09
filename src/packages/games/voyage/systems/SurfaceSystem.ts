import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { isInSystem, shipOf } from "./queries";

// Solid ground: touching a rocky body slowly (against its own motion) is a landing, the ship coming to rest
// upright on the surface and riding along with it; touching it fast is a crash, damage growing with the square
// of the excess speed and the ship bouncing off. Giants have no surface, only air that gets denser (see the
// atmosphere). Rocks that reach a surface are gone.
export class SurfaceSystem implements System<VoyageContext> {
  public readonly name = "surface";

  public update(context: VoyageContext): void {
    const { state, world, config, events } = context;

    if (!isInSystem(context)) {
      return;
    }

    world.stores.hazard.entities.forEach((entity) => {
      const rock = world.stores.body.get(entity);

      if (rock && state.system.bodies.some((place) => !place.isShattered && Math.hypot(rock.x - place.x, rock.y - place.y) < place.radius * (place.isGiant ? 0.9 : 1))) {
        world.despawn(entity);
      }
    });

    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.capture || parts.ship.landedOn) {
      return;
    }

    const { body, ship } = parts;

    for (const place of state.system.bodies) {
      if (place.isGiant || place.isShattered) {
        continue;
      }

      const dx = body.x - place.x;
      const dy = body.y - place.y;
      const distance = Math.hypot(dx, dy);
      const contact = place.radius + body.radius;

      if (distance >= contact || distance === 0) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const vx = body.vx - place.vx;
      const vy = body.vy - place.vy;
      const speed = Math.hypot(vx, vy);
      const inward = vx * nx + vy * ny;

      body.x = place.x + nx * contact;
      body.y = place.y + ny * contact;

      if (speed <= config.flight.safeLanding && place.isLandable) {
        body.vx = place.vx;
        body.vy = place.vy;
        ship.angle = Math.atan2(ny, nx);
        ship.landedOn = place.id;
        ship.landedOffset = { x: nx * contact, y: ny * contact };

        if (!state.landings.has(place.id)) {
          state.landings.add(place.id);
          state.score += config.scoring.landing;
        }

        events.emit("landed", { body: place.id });
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
