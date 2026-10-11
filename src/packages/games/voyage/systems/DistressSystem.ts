import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { pick, pickWeighted, randomBetween, randomInt } from "@/packages/math/random";

import { DistressKind } from "../domain/state";
import { spawnAlien } from "./AlienSystem";
import { VoyageContext } from "./context";
import { shipOf } from "./queries";

// What a call for help turns out to be, by weight: mostly survivors, sometimes a spilled cargo, and where anyone lives
// who would lay one, now and then an ambush.
const KINDS: ReadonlyArray<[DistressKind, number]> = [["survivors", 55], ["cargo", 25], ["ambush", 20]];

// Calls for help. Now and then a beacon calls from somewhere ahead and out of sight, drifting where it was sent, and
// waits a while. Reached, it is what it is: survivors, taken aboard by holding still beside them; a cargo spilled,
// its caches there for the taking; or, where anyone lives who would lay one, an ambush, a pack roused all round the
// ship. Left too long, it goes quiet. Nothing calls while the ship is coming down, on a world or in a black hole.
export class DistressSystem implements System<VoyageContext> {
  public readonly name = "distress";

  public update(context: VoyageContext, dt: number): void {
    const { state, config } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.phase === "lost" || state.capture) {
      return;
    }

    const call = state.distress;

    if (!call) {
      state.nextDistressAt = state.nextDistressAt ?? state.elapsedMs + config.distress.first * 1000;

      if (state.elapsedMs >= state.nextDistressAt && !state.descent && !state.homecoming && !parts.ship.landedOn) {
        this.send(context);
      }

      return;
    }

    call.x += call.vx * dt;
    call.y += call.vy * dt;

    if (state.elapsedMs > call.until) {
      context.events.emit("distress", { stage: "lost", kind: call.kind, x: call.x, y: call.y });
      this.close(context);

      return;
    }

    const { body } = parts;
    const { reach, hold, holdSpeed } = config.distress;

    if (Math.hypot(body.x - call.x, body.y - call.y) > reach) {
      call.held = Math.max(0, call.held - dt);

      return;
    }

    if (call.kind === "survivors") {
      const isStill = Math.hypot(body.vx - call.vx, body.vy - call.vy) < holdSpeed;

      call.held = isStill ? call.held + dt : Math.max(0, call.held - dt);

      if (call.held >= hold) {
        context.events.emit("distress", { stage: "rescued", kind: call.kind, x: call.x, y: call.y });
        this.close(context);
      }

      return;
    }

    if (call.kind === "ambush") {
      this.ambush(context, call.x, call.y);
    } else {
      this.spill(context, call.x, call.y, call.vx, call.vy);
    }

    context.events.emit("distress", { stage: call.kind, kind: call.kind, x: call.x, y: call.y });
    this.close(context);
  }

  // A beacon calls from ahead of the ship, out of sight, drifting much as the ship does.
  private send(context: VoyageContext): void {
    const { state, config, random, events } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    const { body } = parts;
    const hasFoes = state.phase === "universe" && (state.cosmos?.factions.some((faction) => faction.disposition === "hostile") ?? false);
    const kind = pickWeighted(random, KINDS, ([option, weight]) => (option === "ambush" && !hasFoes ? 0 : weight))?.[0] ?? "survivors";
    const speed = Math.hypot(body.vx, body.vy);
    const heading = speed > 0.3 ? Math.atan2(body.vy, body.vx) + randomBetween(random, -0.9, 0.9) : random() * TAU;
    const distance = randomBetween(random, config.distress.distance[0], config.distress.distance[1]);
    const x = body.x + Math.cos(heading) * distance;
    const y = body.y + Math.sin(heading) * distance;

    state.distress = { x, y, vx: body.vx * 0.5, vy: body.vy * 0.5, kind, until: state.elapsedMs + config.distress.seconds * 1000, held: 0 };
    events.emit("distress", { stage: "call", kind, x, y });
  }

  // A pack of the universe's hostiles closes in all round the ship, already set on it.
  private ambush(context: VoyageContext, x: number, y: number): void {
    const { state, config, random, world } = context;
    const foes = state.cosmos?.factions.filter((faction) => faction.disposition === "hostile") ?? [];

    if (foes.length === 0) {
      return;
    }

    const faction = pick(random, foes);
    const count = faction.pack + config.distress.ambush;

    for (let member = 0; member < count; member += 1) {
      const angle = (member / count) * TAU;
      const foe = spawnAlien(context, faction, "fighter", x + Math.cos(angle) * 2.2, y + Math.sin(angle) * 2.2);
      const alien = world.stores.alien.get(foe);

      if (alien) {
        alien.threat = 1;
        alien.mode = "chase";
      }
    }
  }

  // A freighter's cargo spilled: caches drifting where it was lost, there to be flown through.
  private spill(context: VoyageContext, x: number, y: number, vx: number, vy: number): void {
    const { config, random, world } = context;
    const count = randomInt(random, config.distress.caches[0], config.distress.caches[1]);

    for (let index = 0; index < count; index += 1) {
      const angle = random() * TAU;
      const cache = world.spawn();
      const cx = x + Math.cos(angle) * 0.4;
      const cy = y + Math.sin(angle) * 0.4;

      world.stores.body.set(cache, {
        x: cx, y: cy, vx: vx + Math.cos(angle) * 0.05, vy: vy + Math.sin(angle) * 0.05, prevX: cx, prevY: cy, radius: config.boosts.radius, mass: 0.03,
      });
      world.stores.pickup.set(cache, { kind: "cache" });
    }
  }

  private close(context: VoyageContext): void {
    const { state, config, random } = context;

    state.distress = null;
    state.nextDistressAt = state.elapsedMs + randomBetween(random, config.distress.every[0], config.distress.every[1]) * 1000;
  }
}
