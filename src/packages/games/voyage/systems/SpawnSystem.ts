import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { PickupKind } from "../domain/components";
import { VoyageContext } from "./context";
import { distanceFromStar, isInSystem, shipOf, viewRadius } from "./queries";

// How far past the view things appear, and how far out they are let go.
const SPAWN_MARGIN = 0.4;
const SPAWN_DEPTH = 1.6;
const KEEP_RADII = 2.6;

// Keeps space busy round the ship without the world growing: rocks are kept at a density that depends on where
// the ship is (open space, a belt, a universe that gets harder the longer it is in it), appearing just out of
// sight and mostly ahead, and anything left far behind is let go. Pickups lean towards what the ship needs.
export class SpawnSystem implements System<VoyageContext> {
  public readonly name = "spawn";

  public update(context: VoyageContext): void {
    const { state, world } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.phase === "lost" || state.capture) {
      return;
    }

    const reach = viewRadius(context);
    const { body } = parts;

    [world.stores.hazard, world.stores.pickup].forEach((store) => store.entities.forEach((entity) => {
      const other = world.stores.body.get(entity);

      if (other && Math.hypot(other.x - body.x, other.y - body.y) > reach * KEEP_RADII) {
        world.despawn(entity);
      }
    }));

    const { rocks, isIcy } = this.density(context);

    for (let count = world.stores.hazard.size; count < rocks; count += 1) {
      this.spawnRock(context, reach, isIcy);
    }

    // Boost cores drift in on a time of their own (the boost system's) and are not counted here.
    const cores = world.stores.pickup.values.reduce((count, pickup) => count + (pickup.kind === "boost" ? 1 : 0), 0);

    for (let count = world.stores.pickup.size - cores; count < context.config.spawn.pickups; count += 1) {
      this.spawnPickup(context, reach);
    }

    this.comets(context, reach);
  }

  // Now and then, a comet falls through: a big icy rock coming in fast from out of sight, crossing near the ship.
  private comets(context: VoyageContext, reach: number): void {
    const { state, world, config, random } = context;
    const parts = shipOf(context);
    const [soonest, latest] = config.spawn.cometEvery;

    if (!parts || !isInSystem(context)) {
      return;
    }

    state.nextCometAt = state.nextCometAt ?? state.elapsedMs + randomBetween(random, soonest, latest) * 1000;

    if (state.elapsedMs < state.nextCometAt) {
      return;
    }

    state.nextCometAt = state.elapsedMs + randomBetween(random, soonest, latest) * 1000;

    const from = random() * TAU;
    const distance = reach + 2.5;
    const x = parts.body.x + Math.cos(from) * distance;
    const y = parts.body.y + Math.sin(from) * distance;
    // Towards the ship's neighbourhood, a little to one side, so it crosses the view.
    const heading = from + Math.PI + (random() - 0.5) * 0.7;
    const speed = randomBetween(random, 1, 1.8);
    const comet = world.spawn();
    const radius = randomBetween(random, 0.1, 0.16);

    world.stores.body.set(comet, { x, y, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed, prevX: x, prevY: y, radius, mass: radius * radius * 60 });
    world.stores.spin.set(comet, { angle: random() * TAU, rate: randomBetween(random, -0.6, 0.6) });
    world.stores.hazard.set(comet, { shape: Math.floor(random() * 6), isIcy: true, isComet: true });
  }

  private density(context: VoyageContext): { rocks: number; isIcy: boolean } {
    const { state, config } = context;
    const parts = shipOf(context);

    if (state.phase === "universe") {
      return { rocks: Math.round(config.spawn.universe + config.spawn.universeGrowth * (state.deepMs / 60000)), isIcy: false };
    }

    const out = parts ? distanceFromStar(context, parts.body) : 0;
    const belt = state.system.belts.find((candidate) => out >= candidate.inner && out <= candidate.outer);
    // Past Neptune, what drifts is ice.
    const neptune = state.system.bodies.find((body) => body.id === "neptune");
    const isFar = neptune ? out > Math.hypot(neptune.x - state.system.star.x, neptune.y - state.system.star.y) : false;

    return belt ? { rocks: Math.round(config.spawn.belt * belt.density), isIcy: belt.isIcy } : { rocks: config.spawn.open, isIcy: isFar };
  }

  // Just out of sight, mostly ahead of where the ship is going.
  private placeNear(context: VoyageContext, reach: number): { x: number; y: number } {
    const { random } = context;
    const parts = shipOf(context);
    const body = parts?.body ?? { x: 0, y: 0, vx: 0, vy: 0 };
    const speed = Math.hypot(body.vx, body.vy);
    const angle = speed > 0.3 && random() < 0.75 ? Math.atan2(body.vy, body.vx) + (random() - 0.5) * 2.2 : random() * TAU;
    const distance = reach + SPAWN_MARGIN + random() * SPAWN_DEPTH;

    return { x: body.x + Math.cos(angle) * distance, y: body.y + Math.sin(angle) * distance };
  }

  private spawnRock(context: VoyageContext, reach: number, isIcy: boolean): void {
    const { world, config, random } = context;
    const { x, y } = this.placeNear(context, reach);
    const radius = config.spawn.minRadius + (config.spawn.maxRadius - config.spawn.minRadius) * random() * random();
    const drift = randomBetween(random, 0.05, 0.35);
    const heading = random() * TAU;
    const rock = world.spawn();

    world.stores.body.set(rock, { x, y, vx: Math.cos(heading) * drift, vy: Math.sin(heading) * drift, prevX: x, prevY: y, radius, mass: radius * radius * 60 });
    world.stores.spin.set(rock, { angle: random() * TAU, rate: randomBetween(random, -1.4, 1.4) });
    world.stores.hazard.set(rock, { shape: Math.floor(random() * 6), isIcy, isComet: false });
  }

  private spawnPickup(context: VoyageContext, reach: number): void {
    const { world, random } = context;
    const parts = shipOf(context);
    const { x, y } = this.placeNear(context, reach);
    const item = world.spawn();
    const kind = this.pickKind(random(), parts ? parts.ship.fuel / parts.ship.maxFuel : 1, parts ? parts.health.hull / parts.health.maxHull : 1,
      parts ? parts.health.shields / parts.health.maxShields : 1);

    world.stores.body.set(item, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: kind === "coin" ? 0.045 : 0.06, mass: 0.01 });
    world.stores.pickup.set(item, { kind });
  }

  private pickKind(roll: number, fuel: number, hull: number, shields: number): PickupKind {
    if (fuel < 0.45 && roll < 0.45) {
      return "fuel";
    }

    if (hull < 0.6 && roll < 0.65) {
      return "repair";
    }

    if (shields < 0.5 && roll < 0.8) {
      return "shield";
    }

    return roll < 0.12 ? "fuel" : "coin";
  }
}
