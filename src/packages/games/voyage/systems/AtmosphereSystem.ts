import type { System } from "@/packages/games/engine";
import { densityAt, dragDeceleration, entryHeating } from "@/packages/physics/newtonian";

import { AirModel } from "../domain/content";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { isInSystem, placeBody, shipOf } from "./queries";

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
  : air.temperatureC + (air.topTemperatureC - air.temperatureC) * Math.min(1, altitude / air.top));

// Air: drag slows the ship and entry heats its hull, in proportion to density and the square and the cube of its
// speed. Skimming a giant's upper air scoops fuel. Past the pressure the hull is built for, it is crushed, harder
// the further past: deep in a giant, or near the ground on Venus. In the warm up an emergency burn throws a ship
// that sinks too deep into a giant clear instead of letting it die there.
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
}
