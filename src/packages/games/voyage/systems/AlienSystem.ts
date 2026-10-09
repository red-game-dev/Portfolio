import type { Entity, System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";

import { Alien, AlienRole, Weapon } from "../domain/components";
import { FactionSpec } from "../domain/universe";
import { damageAlien, fire, leadDirection } from "./combat";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { placeBody, shipOf } from "./queries";

// Each hull's size (world units), and how much bigger a boss, a trader and a whale are.
const SIZES = { saucer: 0.12, insect: 0.1, crystal: 0.11, organic: 0.13, monolith: 0.15, swarm: 0.07 };
const BOSS_SCALE = 3.2;
const TRADER_RADIUS = 0.18;
const WHALE_RADIUS = 0.55;
// What each kind of gun does at level 1: damage, shots a second, range, shot speed.
const GUNS: Record<Weapon["kind"], [number, number, number, number]> = {
  cannon: [14, 1.6, 6, 6],
  laser: [10, 3, 7.5, 11],
  missile: [34, 0.45, 9, 3.5],
  spit: [18, 1.1, 5, 4.5],
  photoid: [700, 0.2, 60, 9],
};
// Packs are let go this far from the ship when not chasing it; a fleeing one escapes this far.
const LET_GO = 32;
const ESCAPED = 18;
// A ram costs both sides this much.
const RAM = 45;

// Who lives in a universe, and how they behave, as an MMO's mobs do. Packs of each faction gather round the
// ship's path (more as danger grows), each with a home. Hostile ones attack what comes within their aggro
// radius, territorial ones what comes near their home, neutral ones only once struck, peaceful ones never
// (traders go about their business, void whales drift and flee when hurt). Threat comes from damage and from
// being seen; a pack fights together. Chased too far from home, they leash: give up, go home and heal to full,
// ignoring everything on the way. The badly hurt flee. In a fight they keep to their gun's range, circling, and
// lead their shots. After a while in a universe its boss shows itself, calls for help as it weakens and fires
// faster near the end.
export class AlienSystem implements System<VoyageContext> {
  public readonly name = "aliens";

  public update(context: VoyageContext, dt: number): void {
    const { state, world } = context;
    const parts = shipOf(context);

    if (state.phase !== "universe" || state.status !== "flying" || !state.cosmos || !parts) {
      return;
    }

    this.populate(context);
    this.summonBoss(context);

    world.stores.alien.entities.forEach((entity, index) => {
      if (world.isAlive(entity)) {
        this.think(context, entity, world.stores.alien.values[index], dt);
      }
    });
  }

  // Keeps packs round the ship's path, more as danger grows, and void whales where they swim.
  private populate(context: VoyageContext): void {
    const { state, world, config, random } = context;
    const cosmos = state.cosmos;
    const parts = shipOf(context);

    if (!cosmos || !parts) {
      return;
    }

    world.stores.alien.entities.forEach((entity, index) => {
      const alien = world.stores.alien.values[index];
      const at = world.stores.body.get(entity);

      if (at && alien.role !== "boss" && alien.threat <= 0 && Math.hypot(at.x - parts.body.x, at.y - parts.body.y) > LET_GO) {
        world.despawn(entity);
      }
    });

    const wanted = Math.round((config.life.packs + cosmos.danger * config.life.packsPerDanger) * 2.5);
    const living = world.stores.alien.values.filter((alien) => alien.role !== "whale" && alien.role !== "boss").length;

    if (cosmos.factions.length > 0 && living < wanted) {
      const faction = cosmos.factions[Math.floor(random() * cosmos.factions.length)];
      const home = this.spot(context, randomBetween(random, config.life.spawnDistance[0], config.life.spawnDistance[1]));

      for (let member = 0; member < (faction.disposition === "peaceful" ? 1 : faction.pack); member += 1) {
        const role = faction.disposition === "peaceful" ? "trader" : "fighter";

        this.spawn(context, faction, role, home.x + randomBetween(random, -1, 1), home.y + randomBetween(random, -1, 1));
      }
    }

    const whales = cosmos.phenomena.find((phenomenon) => phenomenon.kind === "whales");

    if (whales && !world.stores.alien.values.some((alien) => alien.role === "whale") && Math.hypot(whales.x - parts.body.x, whales.y - parts.body.y) < LET_GO) {
      for (let member = 0; member < 3; member += 1) {
        this.spawn(context, null, "whale", whales.x + randomBetween(random, -2, 2), whales.y + randomBetween(random, -2, 2));
      }
    }
  }

  private summonBoss(context: VoyageContext): void {
    const { state, config, random, events } = context;
    const cosmos = state.cosmos;
    const fighters = cosmos?.factions.filter((faction) => faction.disposition !== "peaceful") ?? [];

    if (!cosmos || state.boss !== null || state.bossFallen || fighters.length === 0 || state.phaseMs < config.life.bossAfter * 1000) {
      return;
    }

    const faction = fighters[Math.floor(random() * fighters.length)];
    const home = this.spot(context, 12);

    state.boss = this.spawn(context, faction, "boss", home.x, home.y);
    events.emit("boss", { name: faction.name, isFallen: false });
  }

  // A point at `distance` from the ship, mostly ahead of where it is heading.
  private spot(context: VoyageContext, distance: number): { x: number; y: number } {
    const { random } = context;
    const parts = shipOf(context);
    const body = parts?.body ?? { x: 0, y: 0, vx: 0, vy: 0 };
    const speed = Math.hypot(body.vx, body.vy);
    const angle = speed > 0.3 && random() < 0.7 ? Math.atan2(body.vy, body.vx) + (random() - 0.5) * 1.6 : random() * Math.PI * 2;

    return { x: body.x + Math.cos(angle) * distance, y: body.y + Math.sin(angle) * distance };
  }

  private spawn(context: VoyageContext, faction: FactionSpec | null, role: AlienRole, x: number, y: number): Entity {
    const { world, random } = context;
    const entity = world.spawn();
    const boss = role === "boss";
    const radius = role === "whale" ? WHALE_RADIUS : role === "trader" ? TRADER_RADIUS : (faction ? SIZES[faction.shape] : 0.1) * (boss ? BOSS_SCALE : 1);
    const hull = role === "whale" ? 2400 : (faction?.hull ?? 100) * (boss ? 12 : role === "trader" ? 2 : 1);
    const shields = (faction?.shields ?? 0) * (boss ? 4 : 1);

    world.stores.body.set(entity, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius, mass: radius * radius * 80 });
    world.stores.health.set(entity, { hull, maxHull: hull, shields, maxShields: shields, rechargeIn: 0, decals: [] });
    world.stores.alien.set(entity, {
      faction: faction?.id ?? -1,
      role,
      mode: "idle",
      homeX: x,
      homeY: y,
      threat: 0,
      angle: random() * Math.PI * 2,
      level: (faction?.level ?? 1) + (boss ? 5 : 0),
      phase: 0,
    });

    if (faction && role !== "trader" && faction.disposition !== "peaceful") {
      const [damage, rate, range, speed] = GUNS[faction.weapon];
      const level = 1 + (faction.level - 1) * 0.12;

      world.stores.weapon.set(entity, {
        kind: faction.weapon,
        damage: damage * level * (boss ? 1.5 : 1),
        rate: rate * (boss ? 1.4 : 1),
        range,
        speed,
        heat: 0,
        cooldown: random() / rate,
      });
    }

    return entity;
  }

  private think(context: VoyageContext, entity: Entity, alien: Alien, dt: number): void {
    const { world, state } = context;
    const parts = shipOf(context);
    const body = world.stores.body.get(entity);
    const health = world.stores.health.get(entity);
    const faction = alien.faction >= 0 ? state.cosmos?.factions[alien.faction] : undefined;

    if (!parts || !body || !health) {
      return;
    }

    const ship = parts.body;
    const dx = ship.x - body.x;
    const dy = ship.y - body.y;
    const distance = Math.hypot(dx, dy) || 1e-6;
    const fromHome = Math.hypot(body.x - alien.homeX, body.y - alien.homeY);
    const isBoss = alien.role === "boss";
    const isPeaceful = !faction || faction.disposition === "peaceful";
    const speed = (faction?.speed ?? 0.5) * (alien.role === "whale" ? 0.3 : isBoss ? 0.75 : 1);
    const aggro = faction?.aggroRadius ?? 0;

    health.rechargeIn = Math.max(0, health.rechargeIn - dt * 1000);

    if (health.rechargeIn === 0) {
      health.shields = Math.min(health.maxShields, health.shields + health.maxShields * 0.15 * dt);
    }

    if (alien.mode !== "evade" && !isPeaceful) {
      const sees = isBoss ? distance < 14 : faction.disposition === "hostile" ? distance < aggro : faction.disposition === "territorial"
        ? Math.hypot(ship.x - alien.homeX, ship.y - alien.homeY) < aggro * 1.5 : false;

      if (sees) {
        alien.threat = Math.max(alien.threat, 1);
      }

      if (alien.threat > 0 && fromHome > (faction?.leashRadius ?? 15) * (isBoss ? 2 : 1)) {
        alien.mode = "evade";
        alien.threat = 0;
      } else if (alien.threat > 0) {
        alien.mode = !isBoss && health.hull < health.maxHull * 0.25 ? "flee" : "chase";
      }
    }

    // The peaceful run from whoever hurts them.
    if (isPeaceful && health.hull < health.maxHull) {
      alien.mode = "flee";
    }

    let wantX = 0;
    let wantY = 0;

    if (alien.mode === "chase") {
      const weapon = world.stores.weapon.get(entity);
      const range = (weapon?.range ?? 3) * 0.7;
      const closing = distance > range + 0.8 ? 1 : distance < range - 0.8 ? -1 : 0;
      const circle = entity % 2 === 0 ? 1 : -1;

      wantX = (dx / distance) * closing * speed - (dy / distance) * circle * speed * 0.6;
      wantY = (dy / distance) * closing * speed + (dx / distance) * circle * speed * 0.6;
      alien.angle = Math.atan2(dy, dx);

      if (weapon && weapon.cooldown <= 0 && distance < weapon.range) {
        const aim = leadDirection(body, ship, weapon.speed);

        if (aim) {
          fire(context, entity, weapon, aim.x, aim.y, "aliens", state.ship);
        }
      }

      if (isBoss) {
        this.bossPhase(context, entity, alien, health.hull / health.maxHull);
      }
    } else if (alien.mode === "flee") {
      wantX = (-dx / distance) * speed * 1.2;
      wantY = (-dy / distance) * speed * 1.2;

      if (distance > ESCAPED) {
        world.despawn(entity);

        return;
      }
    } else if (alien.mode === "evade") {
      const home = fromHome || 1e-6;

      wantX = ((alien.homeX - body.x) / home) * speed * 1.6;
      wantY = ((alien.homeY - body.y) / home) * speed * 1.6;

      if (fromHome < 1) {
        // Home: whole again, and ready to be noticed afresh.
        health.hull = health.maxHull;
        health.shields = health.maxShields;
        alien.mode = "idle";
      }
    } else {
      // Idling round home, or a trader or whale going about its way.
      const turn = (state.elapsedMs / 1000) * (alien.role === "whale" ? 0.05 : 0.25) + entity;
      const wander = alien.role === "trader" || alien.role === "whale" ? 6 : 2;
      const targetX = alien.homeX + Math.cos(turn) * wander;
      const targetY = alien.homeY + Math.sin(turn) * wander;
      const away = Math.hypot(targetX - body.x, targetY - body.y) || 1e-6;

      wantX = ((targetX - body.x) / away) * speed * 0.5;
      wantY = ((targetY - body.y) / away) * speed * 0.5;
    }

    // Steer towards the velocity wanted, no faster than the hull can turn.
    const accel = speed * 1.5 * dt;
    const ax = wantX - body.vx;
    const ay = wantY - body.vy;
    const change = Math.hypot(ax, ay);

    body.vx += change > accel ? (ax / change) * accel : ax;
    body.vy += change > accel ? (ay / change) * accel : ay;

    if (alien.mode !== "chase" && Math.hypot(body.vx, body.vy) > 0.05) {
      alien.angle = Math.atan2(body.vy, body.vx);
    }

    // A collision with the ship hurts both, and pushes them apart.
    if (distance < body.radius + ship.radius && state.status === "flying") {
      applyDamage(context, RAM, Math.atan2(-dy, -dx), "impact");
      damageAlien(context, entity, RAM);

      if (world.isAlive(entity)) {
        placeBody(body, ship.x - (dx / distance) * (body.radius + ship.radius) * 1.05, ship.y - (dy / distance) * (body.radius + ship.radius) * 1.05, -body.vx, -body.vy);
      }

      alien.threat = Math.max(alien.threat, faction?.disposition === "peaceful" ? 0 : 1);
    }

  }

  // A boss weakening calls its pack round it, and at the end fires faster.
  private bossPhase(context: VoyageContext, entity: Entity, alien: Alien, share: number): void {
    const { world, state, random } = context;
    const body = world.stores.body.get(entity);
    const faction = state.cosmos?.factions[alien.faction];

    if (!body || !faction) {
      return;
    }

    if (alien.phase === 0 && share < 0.66) {
      alien.phase = 1;

      for (let add = 0; add < 3; add += 1) {
        const help = this.spawn(context, faction, "fighter", body.x + randomBetween(random, -1.5, 1.5), body.y + randomBetween(random, -1.5, 1.5));
        const helper = world.stores.alien.get(help);

        if (helper) {
          helper.threat = 1;
        }
      }
    }

    if (alien.phase === 1 && share < 0.33) {
      alien.phase = 2;

      const weapon = world.stores.weapon.get(entity);

      if (weapon) {
        weapon.rate *= 1.6;
      }
    }
  }
}
