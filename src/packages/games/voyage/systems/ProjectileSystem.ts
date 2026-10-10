import type { System } from "@/packages/games/engine";

import { damageAlien } from "./combat";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { damageImpactor } from "./impacts";
import { shipOf } from "./queries";
import { leaveWreck } from "./salvage";

// How far round a shot the grid is searched: the largest thing it can hit.
const REACH = 1.4;
// How much of a pickup a shattered rock leaves, now and then.
const DROP_CHANCE = 0.18;

// Shots meeting what they were fired at, found through the spatial hash. The ship's shots strike the living,
// break drifting rocks (leaving ore or ice to gather, or a pickup) and chip and push rocks headed for worlds; theirs strike the ship. A shot is spent on
// the first thing it hits.
export class ProjectileSystem implements System<VoyageContext> {
  public readonly name = "projectiles";

  public update(context: VoyageContext): void {
    const { world, grid, state, random, events } = context;

    if (world.stores.projectile.size === 0) {
      return;
    }

    grid.clear();
    [world.stores.alien, world.stores.hazard, world.stores.impactor].forEach((store) => store.entities.forEach((entity) => {
      const at = world.stores.body.get(entity);

      if (at) {
        grid.insert(entity, at.x, at.y, at.radius);
      }
    }));

    const ship = shipOf(context);

    world.stores.projectile.entities.forEach((entity, index) => {
      const shot = world.stores.projectile.values[index];
      const at = world.stores.body.get(entity);

      if (!at || !world.isAlive(entity)) {
        return;
      }

      if (shot.team === "aliens") {
        if (ship && Math.hypot(ship.body.x - at.x, ship.body.y - at.y) < ship.body.radius + at.radius) {
          applyDamage(context, shot.damage, Math.atan2(at.y - ship.body.y, at.x - ship.body.x), "weapon");
          world.despawn(entity);
        }

        return;
      }

      let isSpent = false;

      grid.near(at.x, at.y, REACH, (other) => {
        const target = world.stores.body.get(other);

        if (isSpent || !target || !world.isAlive(other) || Math.hypot(target.x - at.x, target.y - at.y) > target.radius + at.radius) {
          return;
        }

        isSpent = true;

        if (world.stores.alien.has(other)) {
          damageAlien(context, other, shot.damage);
        } else if (world.stores.impactor.has(other)) {
          damageImpactor(context, other, shot.damage, at.vx, at.vy);
        } else {
          events.emit("shattered", { x: target.x, y: target.y, radius: target.radius });

          const hazard = world.stores.hazard.get(other);

          if (random() < context.config.salvage.debris && state.phase !== "lost") {
            leaveWreck(context, hazard?.isIcy ? "ice" : "ore", { x: target.x, y: target.y, vx: target.vx * 0.6, vy: target.vy * 0.6 });
          } else if (random() < DROP_CHANCE && state.phase !== "lost") {
            const item = world.spawn();

            const { x, y } = target;

            world.stores.body.set(item, { x, y, vx: target.vx * 0.5, vy: target.vy * 0.5, prevX: x, prevY: y, radius: 0.045, mass: 0.01 });
            world.stores.pickup.set(item, { kind: random() < 0.5 ? "coin" : "repair" });
          }

          world.despawn(other);
        }
      });

      if (isSpent) {
        world.despawn(entity);
      }
    });
  }
}
