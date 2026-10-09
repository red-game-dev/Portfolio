import type { System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";
import { angleBetween } from "@/packages/physics/newtonian";

import { FlareClass } from "../domain/events";
import { VoyageContext } from "./context";
import { bodyById, distanceFromStar, isInSystem, shipOf } from "./queries";

// A storm's dose fades by this share every second once it has passed.
const DOSE_FADE = 0.35;
// Earth's aurora never quite goes out; storms only brighten it.

export const AURORA_BASE = 0.2;

const classFor = (strength: number): FlareClass => (strength > 0.7 ? "X" : strength > 0.35 ? "M" : "C");

// The star's weather. Every so often it flares, and the flare throws a storm (a shell of plasma) out across an
// arc of directions; some of the time that arc is aimed at the ship. When the shell sweeps over the ship it
// drains the shields, scorches the sensors where the shields cannot cover them, and the radiation count leaps;
// when it sweeps over Earth, the aurora flares up.
export class WeatherSystem implements System<VoyageContext> {
  public readonly name = "weather";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, random, events } = context;

    state.aurora = Math.max(AURORA_BASE, state.aurora - config.weather.auroraFade * dt);
    state.stormDose *= Math.exp(-DOSE_FADE * dt);

    if (state.status !== "flying" || !isInSystem(context) || state.system.star.luminosity <= 0) {
      return;
    }

    state.nextFlareAt = state.nextFlareAt ?? state.elapsedMs + randomBetween(random, config.weather.every[0], config.weather.every[1]) * 1000;

    const parts = shipOf(context);
    const { star } = state.system;

    if (state.elapsedMs >= state.nextFlareAt) {
      const strength = random() ** 1.6;
      const shipAngle = parts ? Math.atan2(parts.body.y - star.y, parts.body.x - star.x) : 0;
      const isHeading = random() < config.weather.heading;
      const angle = isHeading ? shipAngle + (random() - 0.5) * 0.4 : random() * Math.PI * 2;

      state.storms.push({
        angle,
        width: randomBetween(random, config.weather.width[0], config.weather.width[1]),
        radius: star.radius,
        speed: randomBetween(random, config.weather.speed[0], config.weather.speed[1]),
        strength,
        hasHitShip: false,
        hasHitEarth: false,
      });
      state.flare = { angle, strength, at: state.elapsedMs };
      events.emit("flare", { angle, strength, class: classFor(strength), isHeading });
      state.nextFlareAt = state.elapsedMs + randomBetween(random, config.weather.every[0], config.weather.every[1]) * 1000;
    }

    const earth = bodyById(context, "earth");

    state.storms = state.storms.filter((storm) => {
      const before = storm.radius;

      storm.radius += storm.speed * dt;

      const covers = (x: number, y: number) => {
        const out = Math.hypot(x - star.x, y - star.y);

        return out > before && out <= storm.radius && Math.abs(angleBetween(storm.angle, Math.atan2(y - star.y, x - star.x))) < storm.width / 2;
      };

      if (parts && !storm.hasHitShip && covers(parts.body.x, parts.body.y)) {
        storm.hasHitShip = true;
        this.strike(context, storm.strength);
      }

      if (earth && !storm.hasHitEarth && covers(earth.x, earth.y)) {
        storm.hasHitEarth = true;
        state.aurora = Math.min(1, state.aurora + 0.4 + storm.strength * 0.6);
      }

      return storm.radius < state.system.edge;
    });
  }

  // Radiation passes through the hull rather than breaking it: it drains what the shields can catch and the
  // rest falls on the sensors.
  private strike(context: VoyageContext, strength: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    const { health, modules } = parts;
    // Weaker the further out the storm has spread.
    const reach = Math.min(1, (state.system.scale.unitsPerRootAu * 1.5) / Math.max(1, distanceFromStar(context, parts.body)));
    const drain = config.weather.drain * (0.4 + strength) * reach;
    const unshielded = Math.max(0, drain - health.shields) / drain;

    state.stormDose += strength * config.weather.radiation * reach;
    health.shields = Math.max(0, health.shields - drain);
    health.rechargeIn = config.ship.shieldDelayMs;
    modules.sensors = Math.max(0, modules.sensors - config.weather.sensors * strength * reach * (0.3 + 0.7 * unshielded));
    events.emit("storm", { strength: strength * reach });
  }
}
