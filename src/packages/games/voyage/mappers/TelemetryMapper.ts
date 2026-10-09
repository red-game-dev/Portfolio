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

    return {
      gravity: round(readings.gravity / layout.gravityScale, 2),
      dominant: readings.dominant,
      altitudeKm: dominant ? Math.max(0, Math.round((readings.dominantDistance - dominant.radius) * dominant.kmPerUnit)) : null,
      speedKmS: round(Math.hypot(body.vx, body.vy) * units.kmPerSecond, 1),
      au: isOutward ? round(1 + (route.lastAu - 1) * (out / route.length) ** 2, 2) : null,
      pressureBar: readings.airOf ? readings.density : null,
      hullTemperatureC: Math.round(COLD_C + ship.heat * (FAILING_C - COLD_C)),
      timeDilation: Number.isFinite(readings.holeRatio) ? round(timeDilation(readings.holeRatio, 1), 2) : 1,
    };
  }
}
