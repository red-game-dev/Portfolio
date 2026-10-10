import type { System } from "@/packages/games/engine";
import { angleBetween } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { boostStrength } from "../utils/boosts";
import { levelOf } from "./boosts";
import { VoyageContext } from "./context";
import { isMisfiring } from "./faults";
import { bodyById, shipOf } from "./queries";

// An ion burn's share of the usual push; a solar sail's push at Earth's sunlight (W/m^2), and the most sunlight's
// pressure grows to close in, as a share of that.
const ION_PUSH = 0.85;
const EARTH_SUNLIGHT = 1361;
const SAIL_MOST = 4;

// How much thrust the ship still gives: less as the hull falls apart, far less as the engines melt.
const efficiency = (hull: number, maxHull: number, engines: number) => (0.55 + 0.45 * (hull / maxHull)) * (0.25 + 0.75 * engines);

// Turns the player's intent into the ship's motion: turn towards the aim (or with keys) at the ship's turn rate,
// burn along the nose (unless a misfire cuts the engines out), brake against the velocity, and pay for both in
// fuel. Landed, a burn lifts off with the ground's own motion, once the way down is over (until then a burn is the
// pilot's hand on the landing engine, if anyone's; with the ground firing on it, a burn aborts the landing, up to
// the low gate where a pilot takes over) and, home, once the new rocket is on the pad.
export class ControlSystem implements System<VoyageContext> {
  public readonly name = "control";

  public update(context: VoyageContext, dt: number): void {
    const { state, input, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.capture || state.phase === "lost") {
      return;
    }

    const { body, ship, health, modules } = parts;
    const { thrust, brake, turnRate, burn } = config.ship;
    const step = turnRate * dt;

    if (input.aim) {
      ship.angle += clamp(angleBetween(ship.angle, Math.atan2(input.aim.y - body.y, input.aim.x - body.x)), -step, step);
    } else if (input.turn !== 0) {
      ship.angle += clamp(input.turn, -1, 1) * step;
    }

    // A misfiring engine cuts out now and then, whatever is asked of it.
    const power = ship.fuel > 0 && !isMisfiring(state, config.faults.misfire) ? clamp(input.thrust, 0, 1) : 0;

    ship.thrust = power;
    ship.isBraking = input.brake && ship.fuel > 0;

    if (ship.landedOn) {
      const ground = bodyById(context, ship.landedOn);
      // Still coming down (unless fired on before the pilot has the burn, when a burn aborts the landing), just down
      // and settling, or a crew home still being picked up: there is nothing yet to lift off in.
      const descent = state.descent;
      const isComingDown = descent !== null && descent.downAt === null && (!descent.isFiredOn || descent.craft.isPilot);
      const homecoming = state.homecoming;
      const isSettling = descent !== null && descent.downAt !== null && homecoming?.stage !== "pad" &&
        state.elapsedMs - descent.downAt < config.descent.settleSeconds * 1000;

      // On the pad, a burn launches only once it has been let go of since the crew got there.
      if (homecoming?.stage === "pad" && power <= 0.15) {
        homecoming.isArmed = true;
      }

      const isHeld = isComingDown || isSettling || homecoming?.stage === "recovery" || (homecoming?.stage === "pad" && !homecoming.isArmed);

      if (power > 0.15 && !isHeld) {
        events.emit("tookOff", { body: ship.landedOn });
        ship.landedOn = null;
        ship.landedOffset = null;
        body.vx = ground?.vx ?? 0;
        body.vy = ground?.vy ?? 0;
      } else {
        body.vx = ground?.vx ?? 0;
        body.vy = ground?.vy ?? 0;

        return;
      }
    }

    // Boosts on the engines: an afterburner pushes harder, an ion burn gives a little push for far less fuel.
    const afterburner = levelOf(context, "afterburner");
    const ion = levelOf(context, "ionBurn");
    const boosted = (afterburner > 0 ? boostStrength("afterburner", afterburner) : 1) * (ion > 0 ? ION_PUSH : 1);
    const push = thrust * power * efficiency(health.hull, health.maxHull, modules.engines) * boosted;

    body.vx += Math.cos(ship.angle) * push * dt;
    body.vy += Math.sin(ship.angle) * push * dt;

    // A solar sail: sunlight's pressure, away from the Sun, as strong as the light is (at Earth's, the boost's own).
    const sail = levelOf(context, "solarSail");

    if (sail > 0) {
      const { star } = state.system;
      const out = Math.hypot(body.x - star.x, body.y - star.y) || 1;
      const sailPush = Math.min(SAIL_MOST, state.readings.sunlight / EARTH_SUNLIGHT) * boostStrength("solarSail", sail);

      body.vx += ((body.x - star.x) / out) * sailPush * dt;
      body.vy += ((body.y - star.y) / out) * sailPush * dt;
    }

    const speed = Math.hypot(body.vx, body.vy);

    if (ship.isBraking && speed > 0) {
      const slow = Math.min(speed, brake * dt);

      body.vx -= (body.vx / speed) * slow;
      body.vy -= (body.vy / speed) * slow;
    }

    ship.fuel = Math.max(0, ship.fuel - burn * (power + (ship.isBraking ? 0.6 : 0)) * (ion > 0 ? boostStrength("ionBurn", ion) : 1) * dt);
  }
}
