import type { System } from "@/packages/games/engine";

import { MODULE_IDS } from "../domain/components";
import { HOME_WORLD, SystemBody } from "../domain/content";
import { Descent } from "../domain/state";
import { advanceDescent, isSoftTouchdown, LandingPlan, LandingWorld, planLanding, rehearse, safeSpeedOf, startDescent } from "../landing";
import { landingWorldOf } from "../utils/landing";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { bodyById, isSolar, shipOf, ShipParts } from "./queries";

// Down too hard: the hull loses this share of itself for each multiple of the speed the craft takes that it came
// down over it, and never more than this.
const HARD_SHARE = 1 / 3;
const HARDEST = 1.5;

// The way down. Once the ship touches a world gently enough to land, it comes down the way that world calls for
// (see the landing package), stepped through the real physics and played as many times faster than life as the
// config and the pilot's choice allow, or at life's pace once a pilot flies the burn. Until it is down the ship
// cannot lift off. Down in one piece, the landing counts and is scored (and home is a recovery); down too hard, the
// legs give way and the hull pays for it.
export class DescentSystem implements System<VoyageContext> {
  public readonly name = "descent";
  // How long each world's way down takes, flown ahead once per world each run (and once more for a pilot, whose
  // part plays at life's pace), so a landing knows how far to speed it up.
  private readonly rehearsals = new WeakMap<SystemBody, { auto?: number; manual?: number }>();

  public update(context: VoyageContext, dt: number): void {
    const { state, input, landing, events, config } = context;
    const parts = shipOf(context);
    const landedOn = parts?.ship.landedOn ?? null;

    if (!parts || !landedOn || state.status !== "flying") {
      state.descent = null;

      return;
    }

    const place = state.descent?.body === landedOn ? null : bodyById(context, landedOn);

    if (place) {
      this.begin(context, place);
    }

    const descent = state.descent;

    if (!descent || descent.downAt !== null) {
      return;
    }

    const isManual = landing.control === "manual";
    const { craft, plan, world } = descent;
    const phase = craft.phase;
    const ahead = this.rehearsed(bodyById(context, descent.body), world, plan, isManual);

    descent.speedUp = Math.max(config.descent.speedUp, ahead / config.descent.longest);
    descent.pace = craft.isPilot || landing.time === "real" ? 1 : descent.speedUp;
    advanceDescent(craft, world, plan, dt * descent.pace, { isManual, throttle: input.thrust });

    if (craft.isDown) {
      this.touchdown(context, descent, parts);
    } else if (craft.phase !== phase) {
      events.emit("descending", { body: descent.body, phase: craft.phase });
    }
  }

  private begin(context: VoyageContext, place: SystemBody): void {
    const world = landingWorldOf(place, isSolar(context));
    const plan = planLanding(world);
    const craft = startDescent(plan);

    context.state.descent = { body: place.id, world, plan, craft, speedUp: 1, pace: 1, downAt: null, isSoft: false };
    context.events.emit("descending", { body: place.id, phase: craft.phase });
  }

  // How long the guidance takes to fly the way down on this world (seconds), to the ground or to the pilot's gate.
  private rehearsed(place: SystemBody | undefined, world: LandingWorld, plan: LandingPlan, isManual: boolean): number {
    if (!place) {
      return rehearse(world, plan, isManual);
    }

    const known = this.rehearsals.get(place) ?? {};
    const key = isManual ? "manual" : "auto";
    const time = known[key] ?? rehearse(world, plan, isManual);

    known[key] = time;
    this.rehearsals.set(place, known);

    return time;
  }

  private touchdown(context: VoyageContext, descent: Descent, parts: ShipParts): void {
    const { state, config, events } = context;
    const { craft, plan, world, body } = descent;
    const speed = craft.impactSpeed;

    descent.downAt = state.elapsedMs;
    descent.isSoft = isSoftTouchdown(craft, plan, world);

    if (descent.isSoft) {
      if (!state.landings.has(body)) {
        state.landings.add(body);
        state.score += config.scoring.landing;
      }

      events.emit("landed", { body, speed });

      if (world.isHome) {
        this.recover(context, parts);
      }

      return;
    }

    const safe = safeSpeedOf(plan, world);
    const share = Math.min(HARDEST, ((speed - safe) / safe) * HARD_SHARE);
    const offset = parts.ship.landedOffset;
    // The ground comes up under the tail: the shields give what they can and the hull takes the rest.
    const ground = offset ? Math.atan2(-offset.y, -offset.x) : parts.ship.angle + Math.PI;

    applyDamage(context, parts.health.shields + share * parts.health.maxHull, ground, "crash");
    events.emit("hardLanding", { body, speed, safe });
  }

  // Home: the crew is recovered and a new rocket rolled out, full of fuel, its hull, shields and every system
  // sound, no fault left and no scar on it.
  private recover(context: VoyageContext, { ship, health, modules }: ShipParts): void {
    ship.fuel = ship.maxFuel;
    health.hull = health.maxHull;
    health.shields = health.maxShields;
    health.decals = [];
    MODULE_IDS.forEach((id) => {
      modules[id] = 1;
    });
    context.state.faults = [];
    context.events.emit("recovered", { body: HOME_WORLD });
  }
}
