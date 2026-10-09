import type { System } from "@/packages/games/engine";

import { MODULE_IDS } from "../domain/components";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { shipOf } from "./queries";

// The rock size the impact damage is measured against.
const REFERENCE_RADIUS = 0.08;
// How much of a system one repair kit restores.
const REPAIR_SHARE = 0.35;

// Contact between the ship and everything else, found through a spatial hash so the cost grows with what is near
// the ship, not with what is in the world. A rock hits as hard as its size times the square of the closing speed,
// shatters, and knocks the ship by momentum; a pickup is collected; a black hole's horizon starts the capture.
export class CollisionSystem implements System<VoyageContext> {
  public readonly name = "collision";

  public update(context: VoyageContext): void {
    const { state, world, grid, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.capture || state.phase === "lost") {
      return;
    }

    const { body } = parts;

    grid.clear();
    world.stores.hazard.entities.forEach((entity) => {
      const rock = world.stores.body.get(entity);

      if (rock) {
        grid.insert(entity, rock.x, rock.y, rock.radius);
      }
    });
    world.stores.pickup.entities.forEach((entity) => {
      const item = world.stores.body.get(entity);

      if (item) {
        grid.insert(entity, item.x, item.y, item.radius);
      }
    });

    grid.near(body.x, body.y, body.radius + config.spawn.maxRadius, (entity) => {
      const other = world.stores.body.get(entity);

      if (!other || !world.isAlive(entity) || Math.hypot(other.x - body.x, other.y - body.y) > body.radius + other.radius) {
        return;
      }

      const pickup = world.stores.pickup.get(entity);

      if (pickup) {
        this.collect(context, pickup.kind, other.x, other.y);
        world.despawn(entity);

        return;
      }

      const dx = other.x - body.x;
      const dy = other.y - body.y;
      const closing = Math.hypot(other.vx - body.vx, other.vy - body.vy);
      const share = other.mass / (other.mass + body.mass);

      applyDamage(context, config.flight.impact * (other.radius / REFERENCE_RADIUS) * Math.max(0.35, closing) ** 2, Math.atan2(dy, dx), "impact");
      body.vx += (other.vx - body.vx) * share;
      body.vy += (other.vy - body.vy) * share;
      world.despawn(entity);
    });

    world.stores.hole.entities.forEach((entity, index) => {
      const hole = world.stores.body.get(entity);
      const { horizon } = world.stores.hole.values[index];

      if (hole && Math.hypot(hole.x - body.x, hole.y - body.y) < horizon) {
        state.capture = {
          centre: { x: hole.x, y: hole.y },
          angle: Math.atan2(body.y - hole.y, body.x - hole.x),
          from: Math.max(horizon * 0.6, Math.hypot(body.x - hole.x, body.y - hole.y)),
          progress: 0,
          hole: entity,
        };
        events.emit("captured", { x: hole.x, y: hole.y, isSingularity: world.stores.hole.values[index].isSingularity });
      }
    });
  }

  private collect(context: VoyageContext, kind: "score" | "shield" | "fuel" | "repair", x: number, y: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    const { ship, health, modules } = parts;

    if (kind === "score") {
      state.score += config.scoring.pickup;
    } else if (kind === "fuel") {
      ship.fuel = Math.min(ship.maxFuel, ship.fuel + config.pickups.fuel);
    } else if (kind === "shield") {
      health.shields = Math.min(health.maxShields, health.shields + config.pickups.shield);
    } else {
      health.hull = Math.min(health.maxHull, health.hull + config.pickups.repair);
      // A patched hull loses its worst scar, and its worst system is patched up too.
      health.decals.sort((first, second) => second.severity - first.severity).shift();

      const worst = MODULE_IDS.reduce((low, id) => (modules[id] < modules[low] ? id : low), MODULE_IDS[0]);

      modules[worst] = Math.min(1, modules[worst] + REPAIR_SHARE);
    }

    events.emit("collected", { kind, x, y });
  }
}
