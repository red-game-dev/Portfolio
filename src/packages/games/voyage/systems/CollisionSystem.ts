import type { System } from "@/packages/games/engine";

import { Body, MODULE_IDS, PickupKind } from "../domain/components";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { placeBody, shipOf } from "./queries";

// The rock size the impact damage is measured against, and how far round the ship the grid is searched.
const REFERENCE_RADIUS = 0.08;
const REACH = 0.6;
// How much of a system one repair kit restores.
const REPAIR_SHARE = 0.35;
// How fast a coin in reach is drawn in to the ship (world units a second): faster the nearer it is.
const MAGNET_SPEED = 3;
const MAGNET_MIN = 0.8;

// Contact between the ship and everything else, found through a spatial hash so the cost grows with what is near
// the ship, not with what is in the world. A rock hits as hard as its size times the square of the closing speed,
// shatters, and knocks the ship by momentum; a pickup is collected, and coins close by are drawn in to it first;
// a black hole's horizon starts the capture.
export class CollisionSystem implements System<VoyageContext> {
  public readonly name = "collision";

  public update(context: VoyageContext): void {
    const { state, world, grid, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.capture || state.phase === "lost") {
      return;
    }

    const { body } = parts;

    this.drawCoins(context, body);
    grid.clear();
    world.stores.hazard.entities.forEach((entity) => {
      const rock = world.stores.body.get(entity);

      if (rock) {
        grid.insert(entity, rock.x, rock.y, rock.radius);
      }
    });
    [world.stores.pickup, world.stores.traffic, world.stores.impactor].forEach((store) => store.entities.forEach((entity) => {
      const other = world.stores.body.get(entity);

      if (other) {
        grid.insert(entity, other.x, other.y, other.radius);
      }
    }));

    grid.near(body.x, body.y, body.radius + REACH, (entity) => {
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
      // Ships and rocks headed for worlds are too big to break on the hull: the ship bounces off them instead.
      const isBig = world.stores.traffic.has(entity) || world.stores.impactor.has(entity);

      applyDamage(context, config.flight.impact * (Math.min(other.radius, 0.2) / REFERENCE_RADIUS) * Math.max(0.35, closing) ** 2, Math.atan2(dy, dx), "impact");
      body.vx += (other.vx - body.vx) * share;
      body.vy += (other.vy - body.vy) * share;

      if (isBig) {
        const distance = Math.hypot(dx, dy) || 1;

        const apart = (body.radius + other.radius) * 1.02;

        placeBody(body, other.x - (dx / distance) * apart, other.y - (dy / distance) * apart, body.vx, body.vy);
      } else {
        world.despawn(entity);
      }
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

  // Coins within reach fly in to the ship, so a pass close by collects them without having to touch each one. The
  // reach is wider than the contact search below: a coin drawn in is caught once it is close.
  private drawCoins({ world, config }: VoyageContext, ship: Body): void {
    const reach = config.pickups.magnet;

    world.stores.pickup.entities.forEach((entity, index) => {
      const coin = world.stores.body.get(entity);

      if (!coin || world.stores.pickup.values[index].kind !== "coin") {
        return;
      }

      const dx = ship.x - coin.x;
      const dy = ship.y - coin.y;
      const distance = Math.hypot(dx, dy);

      if (distance > reach || distance === 0) {
        return;
      }

      const pull = MAGNET_MIN + MAGNET_SPEED * (1 - distance / reach);

      coin.vx = ship.vx + (dx / distance) * pull;
      coin.vy = ship.vy + (dy / distance) * pull;
    });
  }

  private collect(context: VoyageContext, kind: PickupKind, x: number, y: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    const { ship, health, modules } = parts;

    if (kind === "coin") {
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
