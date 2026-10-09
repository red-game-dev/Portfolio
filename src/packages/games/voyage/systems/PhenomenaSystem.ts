import type { System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";
import { angleBetween } from "@/packages/physics/newtonian";

import { Weapon } from "../domain/components";
import { SHOCK_FADES } from "../domain/state";
import { PhenomenonSpec } from "../domain/universe";
import { fire, leadDirection } from "./combat";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { placeBody, shipOf } from "./queries";

// A pulsar's beams: how fast they sweep (radians a second), how narrow, and how far they reach.
const PULSAR_SWEEP = 1.3;
const PULSAR_WIDTH = 0.07;
const PULSAR_REACH = 45;
// A supernova's warning (ms), how fast its shock spreads, and how much a world's shadow spares.
const SUPERNOVA_WARNING = 15000;
const SHOCK_SPEED = 3;
const SHADOW_SPARES = 0.85;
// A gamma ray burst's warning (ms), its width, and how often (seconds).
const BURST_WARNING = 3500;
const BURST_WIDTH = 0.7;
const BURST_EVERY: [number, number] = [35, 70];
// The dark forest: how fast a ship's noise fades, how loud an engine is, the warning before a strike (ms), and
// how far off the strike comes from.
const NOISE_FADE = 0.12;
const ENGINE_NOISE = 0.28;
const STRIKE_WARNING = 1500;
const STRIKE_DISTANCE = 22;
// Tides past this (world units per second squared across the ship) start to tear it.
const TIDAL_LIMIT = 0.5;
// A wormhole's mouth (world units), and how long before the same ship can go through again (ms).
const MOUTH = 0.45;
const JUMP_COOLDOWN = 2500;

const distanceToLine = (x: number, y: number, ox: number, oy: number, angle: number) => Math.abs((x - ox) * Math.sin(angle) - (y - oy) * Math.cos(angle));

// The strange things in a universe, each doing what it does to a ship nearby: a nebula drains shields and
// fills the sensors with static; a pulsar's two beams sweep round and burn what they cross; a magnetar's field
// drains shields, jams electronics and drags the ship in; a dying star warns, blows, and its shock front hurts
// anything not hiding behind a world; a gamma ray burst lines up across the view, warns, and fires; a dark forest
// listens for engines and guns and strikes, from far off, at anything too loud; a wormhole throws the ship to its
// other mouth; a quasar's jet burns a line across the universe; and a dead star's tides stretch the ship.
export class PhenomenaSystem implements System<VoyageContext> {
  public readonly name = "phenomena";

  public update(context: VoyageContext, dt: number): void {
    const { state } = context;
    const parts = shipOf(context);

    state.readings.tidal = 0;
    state.readings.nebula = 0;
    state.signature = Math.max(0, state.signature - NOISE_FADE * dt);

    if (!parts || state.status !== "flying" || state.phase !== "universe" || !state.cosmos) {
      return;
    }

    state.phenomena.pulsarAngle += PULSAR_SWEEP * dt;
    state.signature += parts.ship.thrust * ENGINE_NOISE * dt;
    state.cosmos.phenomena.forEach((phenomenon) => this.act(context, phenomenon, dt));
    this.tides(context, dt);
  }

  private act(context: VoyageContext, phenomenon: PhenomenonSpec, dt: number): void {
    const { state, events, random } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    const { body, health, modules } = parts;
    const dx = body.x - phenomenon.x;
    const dy = body.y - phenomenon.y;
    const away = Math.hypot(dx, dy);

    switch (phenomenon.kind) {
      case "nebula": {
        const depth = Math.max(0, 1 - away / phenomenon.radius);

        state.readings.nebula = Math.max(state.readings.nebula, depth);
        health.shields = Math.max(0, health.shields - 30 * depth * phenomenon.strength * dt);
        modules.sensors = Math.max(0, modules.sensors - 0.004 * depth * dt);
        break;
      }
      case "pulsar": {
        const beam = state.phenomena.pulsarAngle;
        const facing = Math.atan2(dy, dx);
        const inBeam = Math.min(Math.abs(angleBetween(beam, facing)), Math.abs(angleBetween(beam + Math.PI, facing))) < PULSAR_WIDTH;

        if (inBeam && away < PULSAR_REACH) {
          health.shields = Math.max(0, health.shields - 450 * phenomenon.strength * dt);
          health.rechargeIn = context.config.ship.shieldDelayMs;
          modules.sensors = Math.max(0, modules.sensors - 0.12 * (health.shields > 0 ? 0.3 : 1) * dt);
          state.stormDose += 4000 * dt;
        }

        break;
      }
      case "magnetar": {
        if (away < phenomenon.radius) {
          const depth = 1 - away / phenomenon.radius;

          health.shields = Math.max(0, health.shields - 140 * depth * dt);
          modules.sensors = Math.max(0, modules.sensors - 0.04 * depth * dt);
          body.vx -= (dx / (away || 1)) * 0.5 * depth * dt;
          body.vy -= (dy / (away || 1)) * 0.5 * depth * dt;
        }

        break;
      }
      case "supernova": {
        const nova = state.phenomena.supernova;

        if (!nova) {
          break;
        }

        if (!nova.isWarned && state.elapsedMs >= nova.blowsAt - SUPERNOVA_WARNING) {
          nova.isWarned = true;
          events.emit("supernova", { seconds: (nova.blowsAt - state.elapsedMs) / 1000, isBlown: false });
        }

        if (state.elapsedMs >= nova.blowsAt) {
          if (nova.shock === 0) {
            events.emit("supernova", { seconds: 0, isBlown: true });
          }

          // The front spreads until it has thinned to nothing; the ship is struck the first time it is inside it,
          // however fast it was flying, so it cannot slip through between two steps.
          nova.shock = Math.min(SHOCK_FADES, nova.shock + SHOCK_SPEED * dt);

          if (!nova.hasHit && nova.shock < SHOCK_FADES && away <= nova.shock) {
            nova.hasHit = true;
            events.emit("weathered", { peril: "supernova" });

            const spared = this.isHidden(context, phenomenon.x, phenomenon.y) ? SHADOW_SPARES : 0;

            applyDamage(context, 480 * phenomenon.strength * (1 - spared), Math.atan2(-dy, -dx), "radiation");
            parts.ship.temperatureC += 380 * (1 - spared);
            state.stormDose += 90000 * (1 - spared);
          }
        }

        break;
      }
      case "gammaBurst": {
        const phenomena = state.phenomena;

        phenomena.nextBurstAt = phenomena.nextBurstAt ?? state.elapsedMs + randomBetween(random, BURST_EVERY[0], BURST_EVERY[1]) * 1000;

        if (!phenomena.burst && state.elapsedMs >= phenomena.nextBurstAt) {
          // A line that passes near the ship, wherever it is pointed.
          const x = body.x + randomBetween(random, -1.5, 1.5);
          const y = body.y + randomBetween(random, -1.5, 1.5);

          phenomena.burst = { angle: random() * Math.PI, x, y, firesAt: state.elapsedMs + BURST_WARNING };
          events.emit("burst", { seconds: BURST_WARNING / 1000, isFired: false });
        }

        if (phenomena.burst && state.elapsedMs >= phenomena.burst.firesAt) {
          const { burst } = phenomena;

          if (distanceToLine(body.x, body.y, burst.x, burst.y, burst.angle) < BURST_WIDTH) {
            applyDamage(context, 650 * phenomenon.strength, burst.angle + Math.PI / 2, "radiation");
            modules.sensors = Math.max(0, modules.sensors - 0.3);
            events.emit("weathered", { peril: "burst" });
          }

          events.emit("burst", { seconds: 0, isFired: true });
          phenomena.burst = null;
          phenomena.nextBurstAt = state.elapsedMs + randomBetween(random, BURST_EVERY[0], BURST_EVERY[1]) * 1000;
        }

        break;
      }
      case "darkForest":
        this.listen(context, phenomenon);
        break;
      case "wormholes": {
        const { x: nearX, y: nearY, toX: farX, toY: farY } = phenomenon;
        const mouths: Array<[number, number, number, number]> = [[nearX, nearY, farX, farY], [farX, farY, nearX, nearY]];

        mouths.forEach(([fromX, fromY, toX, toY]) => {
          if (state.elapsedMs - state.phenomena.jumpedAt > JUMP_COOLDOWN && Math.hypot(body.x - fromX, body.y - fromY) < MOUTH) {
            const speed = Math.hypot(body.vx, body.vy) || 0.5;

            state.phenomena.jumpedAt = state.elapsedMs;
            placeBody(body, toX + (body.vx / speed) * MOUTH * 2.5, toY + (body.vy / speed) * MOUTH * 2.5, body.vx, body.vy);
            events.emit("wormhole", { x: toX, y: toY });
          }
        });
        break;
      }
      case "quasar": {
        const angle = Math.atan2(phenomenon.toY - phenomenon.y, phenomenon.toX - phenomenon.x);

        if (distanceToLine(body.x, body.y, phenomenon.x, phenomenon.y, angle) < 1.1) {
          applyDamage(context, 220 * phenomenon.strength * dt, angle + Math.PI / 2, "radiation");
        }

        break;
      }
      default:
        break;
    }
  }

  // Too loud for too long and something far off hears: a warning, then a strike at relativistic speed from out
  // of the dark, aimed where the ship will be.
  private listen(context: VoyageContext, phenomenon: PhenomenonSpec): void {
    const { state, events, world, random } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    if (state.phenomena.strikeAt === null && state.signature > 1) {
      state.phenomena.strikeAt = state.elapsedMs + STRIKE_WARNING;
      state.signature = 0.3;
      events.emit("heard", { seconds: STRIKE_WARNING / 1000 });
    }

    if (state.phenomena.strikeAt !== null && state.elapsedMs >= state.phenomena.strikeAt) {
      state.phenomena.strikeAt = null;

      const from = random() * Math.PI * 2;
      const striker = world.spawn();
      const x = parts.body.x + Math.cos(from) * STRIKE_DISTANCE;
      const y = parts.body.y + Math.sin(from) * STRIKE_DISTANCE;
      const weapon: Weapon = { kind: "photoid", damage: 700 * phenomenon.strength, rate: 1, range: STRIKE_DISTANCE * 1.6, speed: 9, heat: 0, cooldown: 0 };

      world.stores.body.set(striker, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: 0.01, mass: 0 });

      const body = world.stores.body.get(striker);
      const aim = body ? leadDirection(body, parts.body, weapon.speed) : null;

      fire(context, striker, weapon, aim?.x ?? -Math.cos(from), aim?.y ?? -Math.sin(from), "aliens", state.ship);
      world.despawn(striker);
    }
  }

  // A dead star's tides: the difference in its pull across the ship's length, 2 mu L / r^3, past a limit tears
  // at the hull.
  private tides(context: VoyageContext, dt: number): void {
    const { state } = context;
    const parts = shipOf(context);
    const { star } = state.system;

    if (!parts || star.mu <= 0) {
      return;
    }

    const away = Math.max(star.radius, Math.hypot(parts.body.x - star.x, parts.body.y - star.y));
    const tidal = (2 * star.mu * parts.body.radius * 2) / away ** 3;

    state.readings.tidal = tidal;

    if (tidal > TIDAL_LIMIT) {
      applyDamage(context, 160 * (tidal / TIDAL_LIMIT - 1) * dt, Math.atan2(star.y - parts.body.y, star.x - parts.body.x), "tidal");
    }
  }

  // Whether a world stands between the ship and a point, casting its shadow over it.
  private isHidden(context: VoyageContext, fromX: number, fromY: number): boolean {
    const parts = shipOf(context);

    if (!parts) {
      return false;
    }

    const { x, y } = parts.body;
    const toX = fromX - x;
    const toY = fromY - y;
    const distance = Math.hypot(toX, toY) || 1;

    return context.state.system.bodies.some((world) => {
      if (world.isShattered) {
        return false;
      }

      const px = world.x - x;
      const py = world.y - y;
      const along = (px * toX + py * toY) / distance;

      return along > 0 && along < distance && Math.abs(px * toY - py * toX) / distance < world.radius;
    });
  }
}
