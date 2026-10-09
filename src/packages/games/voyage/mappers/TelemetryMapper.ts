import { Mapper } from "@/packages/core/domain";
import { roundTo } from "@/packages/math/round";
import { timeDilation } from "@/packages/physics/newtonian";

import { VoyageConfig } from "../config";
import { Body, Ship } from "../domain/components";
import { Telemetry } from "../domain/snapshot";
import { VoyageState } from "../domain/state";
import { missionTime } from "../systems/orbits";
import { auForRadius } from "../utils/scale";

export interface TelemetrySource {
  state: VoyageState;
  body: Body;
  ship: Ship;
}

// Altitude is read while within this many radii of the body pulling hardest.
const ALTITUDE_RADII = 40;

// Turns the ship's readings into real units: gravity in m/s^2 and what pulls hardest, altitude in km over it,
// speed in km/s, distance from the Sun in AU, air in bar, the hull's temperature and the temperature outside in
// Celsius, sunlight in W/m^2, radiation in microsieverts an hour, time dilation from Schwarzschild's formula
// against the nearest black hole's horizon, and the mission clock as a real moment.
export class TelemetryMapper extends Mapper<TelemetrySource, Telemetry> {
  constructor(private readonly config: VoyageConfig) {
    super();
  }

  public map({ state, body, ship }: TelemetrySource): Telemetry {
    const { readings, system } = state;
    const inSystem = state.phase === "solar" || state.phase === "singularity";
    const pulling = readings.dominant === system.star.id ? system.star : system.bodies.find((candidate) => candidate.id === readings.dominant);
    const isNear = inSystem && pulling !== undefined && readings.dominantDistance < pulling.radius * ALTITUDE_RADII;
    const au = auForRadius(system.scale, Math.hypot(body.x - system.star.x, body.y - system.star.y));

    return {
      gravity: roundTo(readings.gravity, readings.gravity < 0.1 ? 5 : 2),
      dominant: readings.dominant,
      altitudeKm: isNear && pulling ? Math.max(0, Math.round((readings.dominantDistance - pulling.radius) * pulling.kmPerUnit)) : null,
      speedKmS: roundTo(Math.hypot(body.vx, body.vy) * this.config.units.kmPerSecond, 1),
      au: inSystem ? roundTo(au, 2) : null,
      // How much further out the black hole waits, until it has woken.
      toHoleAu: state.phase === "solar" ? roundTo(Math.max(0, auForRadius(system.scale, system.edge) - au), 1) : null,
      pressureBar: readings.airOf ? roundTo(readings.pressureBar, readings.pressureBar < 0.01 ? 6 : 2) : null,
      hullTemperatureC: Math.round(ship.temperatureC),
      outsideC: Math.round(readings.environmentC),
      sunlight: inSystem ? Math.round(readings.sunlight) : null,
      radiation: Math.round(readings.radiation),
      timeDilation: Number.isFinite(readings.holeRatio) ? roundTo(timeDilation(readings.holeRatio, 1), 2) : 1,
      missionTime: missionTime(state.clock, state.elapsedMs),
    };
  }
}
