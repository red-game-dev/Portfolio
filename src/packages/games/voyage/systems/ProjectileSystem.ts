import type { System } from "@/packages/games/engine";

import { damageAlien, explode } from "./combat";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { damageImpactor } from "./impacts";
import { shipOf } from "./queries";
import { leaveWreck } from "./salvage";

// How far round a shot the grid is searched: the largest thing it can hit.
const REACH = 1.4;
// How much of a pickup a shattered rock leaves, now and then.
const DROP_CHANCE = 0.18;
// How near a flak pellet must pass a missile to bring it down.
const FLAK_REACH = 0.09;

// Shots meeting what they were fired at, found through the spatial hash. The ship's shots strike the living,
// break drifting rocks (leaving ore or ice to gather, or a pickup) and chip and push rocks headed for worlds; theirs
// strike the ship. A shot is spent on the first thing it hits, and one that bursts strikes everything near; a mine
// waits until it is armed and something hostile comes near; flak brings down the missiles it passes.
export class ProjectileSystem implements System<VoyageContext> {
  public readonly name = "projectiles";
  // The missiles flying at the ship this step, kept in one list reused every step.
  private readonly missiles: number[] = [];

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

    this.missiles.length = 0;
    world.stores.projectile.entities.forEach((entity, index) => {
      if (world.stores.projectile.values[index].team === "aliens" && world.stores.projectile.values[index].kind === "missile") {
        this.missiles.push(entity);
      }
    });

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

      // A mine waits until it is armed, then bursts as soon as anything comes near.
      if (shot.armAt !== undefined) {
        if (state.elapsedMs >= shot.armAt && this.isNear(context, at.x, at.y, shot.trigger ?? 0.3)) {
          explode(context, at.x, at.y, shot.blast ?? 0.5, shot.damage, shot.source ?? null);
          world.despawn(entity);
        }

        return;
      }

      // Flak brings down the missiles it passes.
      if (shot.kind === "flak") {
        for (const missile of this.missiles) {
          const threat = world.stores.body.get(missile);

          if (threat && world.isAlive(missile) && Math.hypot(threat.x - at.x, threat.y - at.y) < FLAK_REACH) {
            world.despawn(missile);
            world.despawn(entity);
            events.emit("blast", { x: threat.x, y: threat.y, radius: 0.12 });

            return;
          }
        }
      }

      let isSpent = false;

      grid.near(at.x, at.y, REACH, (other) => {
        const target = world.stores.body.get(other);

        if (isSpent || !target || !world.isAlive(other) || Math.hypot(target.x - at.x, target.y - at.y) > target.radius + at.radius) {
          return;
        }

        isSpent = true;

        if (shot.blast) {
          explode(context, at.x, at.y, shot.blast, shot.damage, shot.source ?? null);
        } else if (world.stores.alien.has(other)) {
          damageAlien(context, other, shot.damage, shot.source ?? null, shot.isCrit ?? false);
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

  // Whether anything a mine bursts for is near a point: someone not at peace, a rock headed for a world, or a rock.
  private isNear({ world, grid, state }: VoyageContext, x: number, y: number, reach: number): boolean {
    let isFound = false;

    grid.near(x, y, reach + REACH, (other) => {
      const at = world.stores.body.get(other);
      const alien = world.stores.alien.get(other);
      const isPeaceful = alien !== undefined && (alien.faction < 0 || state.cosmos?.factions[alien.faction]?.disposition === "peaceful");

      if (!isFound && at && !isPeaceful && Math.hypot(at.x - x, at.y - y) < reach + at.radius) {
        isFound = true;
      }
    });

    return isFound;
  }
}
