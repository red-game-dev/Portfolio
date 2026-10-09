import { Mapper } from "@/packages/core/domain";
import { timeDilation } from "@/packages/physics/newtonian";

import { VoyageConfig } from "../config";
import { Body, Ship } from "../domain/components";
import { Telemetry } from "../domain/snapshot";
import { VoyageState } from "../domain/state";

export interface TelemetrySource {
  state: VoyageState;
  body: Body;
  ship: Ship;
}

// The Sun's real pull at 1 AU, in m/s^2; it falls with the square of the distance. The game does not move the
// ship by it, but outside a planet's sphere of influence it is what pulls hardest, so the telemetry says so.
const SUN_GRAVITY_AT_1_AU = 0.00593;
// A body's sphere of influence, in its own radii, for reading which pull dominates.
const INFLUENCE_RADII = 18;

// The hull temperature, in Celsius, at heat 0 and at heat 1 where it starts to fail.
const COLD_C = 20;
const FAILING_C = 1600;

const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

// Turns the ship's readings into real units: gravity in m/s^2 (each body set up so its surface reads true),
// altitude in km over the body pulling hardest, speed in km/s, distance from the Sun in AU, air in bar, hull heat
// in Celsius, and time dilation from Schwarzschild's formula against the nearest black hole's horizon.
export class TelemetryMapper extends Mapper<TelemetrySource, Telemetry> {
  constructor(private readonly config: VoyageConfig) {
    super();
  }

  public map({ state, body, ship }: TelemetrySource): Telemetry {
    const { readings, route } = state;
    const { layout, units } = this.config;
    const dominant = route.bodies.find((candidate) => candidate.id === readings.dominant);
    const isOutward = state.phase === "solar" || state.phase === "singularity";
    const out = Math.hypot(body.x - route.origin.x, body.y - route.origin.y);
    const au = 1 + (route.lastAu - 1) * (out / route.length) ** 2;
    const isNearBody = dominant !== undefined && readings.dominantDistance < dominant.radius * INFLUENCE_RADII;
    const isSunlit = isOutward && !isNearBody && readings.dominant !== "singularity";

    return {
      gravity: isSunlit ? round(SUN_GRAVITY_AT_1_AU / (au * au), 5) : round(readings.gravity / layout.gravityScale, 2),
      dominant: isSunlit ? "sun" : readings.dominant,
      altitudeKm: dominant && isNearBody ? Math.max(0, Math.round((readings.dominantDistance - dominant.radius) * dominant.kmPerUnit)) : null,
      speedKmS: round(Math.hypot(body.vx, body.vy) * units.kmPerSecond, 1),
      au: isOutward ? round(au, 2) : null,
      pressureBar: readings.airOf ? readings.density : null,
      hullTemperatureC: Math.round(COLD_C + ship.heat * (FAILING_C - COLD_C)),
      timeDilation: Number.isFinite(readings.holeRatio) ? round(timeDilation(readings.holeRatio, 1), 2) : 1,
    };
  }
}
