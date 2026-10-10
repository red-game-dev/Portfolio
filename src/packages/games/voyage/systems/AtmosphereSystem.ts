import type { System } from "@/packages/games/engine";
import { lerp } from "@/packages/math/easing";
import { densityAt, dragDeceleration, entryHeating } from "@/packages/physics/newtonian";

import { AirModel } from "../domain/content";
import { Descent } from "../domain/state";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { bodyById, isInSystem, placeBody, shipOf } from "./queries";

// How much hotter a giant's air gets for each scale height below its one bar level, and how much shorter its
// scale height is down there, where the gas is squeezed by everything above it.
const DEPTH_WARMING = 60;
const DEPTH_SQUEEZE = 0.4;
// In the warm up, this far past the pressure the hull is built for, an emergency burn throws the ship out.
const EJECT_AT = 1.6;

// Pressure (bar) at an altitude: the ground's (or the one bar level's) pressure falling off exponentially above
// it, and rising the same way below a giant's.
export const pressureAt = (air: AirModel, altitude: number): number => {
  if (altitude > air.top) {
    return 0;
  }

  return air.pressureBar * Math.exp(-altitude / (altitude < 0 ? air.scaleHeight * DEPTH_SQUEEZE : air.scaleHeight));
};

// Temperature (Celsius) at an altitude: from the ground's to the top's on the way up, and warmer with depth
// inside a giant.
export const airTemperatureAt = (air: AirModel, altitude: number): number => (altitude < 0
  ? air.temperatureC + (-altitude / (air.scaleHeight * DEPTH_SQUEEZE)) * DEPTH_WARMING
  : lerp(air.temperatureC, air.topTemperatureC, Math.min(1, altitude / air.top)));

// Air: drag slows the ship and entry heats its hull, in proportion to density and the square and the cube of its
// speed. Skimming a giant's upper air scoops fuel. Past the pressure the hull is built for, it is crushed, harder
// the further past: deep in a giant, or near the ground on Venus. In the warm up an emergency burn throws a ship
// that sinks too deep into a giant clear instead of letting it die there. On a landing's way down the air is the
// air at the craft's real height, so the ground's heat and weight are felt only as it nears the ground.
export class AtmosphereSystem implements System<VoyageContext> {
  public readonly name = "atmosphere";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const parts = shipOf(context);

    state.readings.density = 0;
    state.readings.pressureBar = 0;
    state.readings.airOf = null;
    state.readings.airC = null;

    if (!parts || state.status !== "flying" || state.capture || !isInSystem(context)) {
      return;
    }

    const { body, ship } = parts;
    const { descent } = state;

    if (descent && descent.downAt === null && ship.landedOn === descent.body) {
      this.comingDown(context, descent, dt);

      return;
    }

    for (const place of state.system.bodies) {
      const dx = body.x - place.x;
      const dy = body.y - place.y;
      const distance = Math.hypot(dx, dy);
      // Measured from the ship's underside, so resting on the ground it feels the ground's air.
      const altitude = distance - place.radius - body.radius;
      const { air } = place;

      if (!air || altitude > air.top) {
        continue;
      }

      const density = densityAt(air, altitude);
      const pressure = pressureAt(air, altitude);
      // Speed against the air, which moves with its planet.
      const vx = body.vx - place.vx;
      const vy = body.vy - place.vy;
      const speed = Math.hypot(vx, vy);

      state.readings.density = density;
      state.readings.pressureBar = pressure;
      state.readings.airOf = place.id;
      state.readings.airC = airTemperatureAt(air, altitude);

      if (speed > 0 && !ship.landedOn) {
        const slow = Math.min(speed, dragDeceleration(density, speed, config.flight.drag) * dt);

        body.vx -= (vx / speed) * slow;
        body.vy -= (vy / speed) * slow;
        ship.temperatureC += entryHeating(density, speed, config.thermal.entry) * dt;
      }

      if (place.isGiant && altitude >= 0) {
        ship.fuel = Math.min(ship.maxFuel, ship.fuel + config.flight.skim * Math.min(1, density) * dt);

        if (!state.skimmed.has(place.id)) {
          state.skimmed.add(place.id);
          events.emit("skimmed", { body: place.id });
        }
      }

      const rating = config.thermal.pressureBar;

      if (pressure > rating) {
        if (place.isGiant && pressure > rating * EJECT_AT && config.isSolarSafe) {
          // Thrown clear to the top of the air, moving outward.
          const outX = dx / distance;
          const outY = dy / distance;
          const top = place.radius + air.top;

          placeBody(body, place.x + outX * top, place.y + outY * top, place.vx + outX * 1.4, place.vy + outY * 1.4);
          events.emit("emergency", { body: place.id });
        } else {
          applyDamage(context, config.flight.crush * ((pressure - rating) / rating) * dt, Math.atan2(-dy, -dx), "crush");
        }
      }

      break;
    }
  }

  // The air round a craft on its way down: the real air's pressure at its height, and a temperature from the
  // ground's to the top's on the way up.
  private comingDown(context: VoyageContext, descent: Descent, dt: number): void {
    const { state, config } = context;
    const place = bodyById(context, descent.body);
    const real = descent.world.air;

    if (!place?.air || !real) {
      return;
    }

    const { altitude } = descent.craft;
    const pressure = place.air.pressureBar * Math.exp(-altitude / real.scaleHeight);
    const rating = config.thermal.pressureBar;

    state.readings.pressureBar = pressure;
    state.readings.airOf = place.id;
    state.readings.airC = lerp(place.air.temperatureC, place.air.topTemperatureC, Math.min(1, altitude / descent.plan.startAltitude));

    if (pressure > rating) {
      const parts = shipOf(context);
      const offset = parts?.ship.landedOffset;

      applyDamage(context, config.flight.crush * ((pressure - rating) / rating) * dt, offset ? Math.atan2(-offset.y, -offset.x) : 0, "crush");
    }
  }
}
