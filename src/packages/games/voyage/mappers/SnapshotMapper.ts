import { Mapper } from "@/packages/core/domain";

import { VoyageConfig } from "../config";
import { VoyageWorld } from "../core/world";
import { VoyageSnapshot } from "../domain/snapshot";
import { VoyageState } from "../domain/state";
import { TelemetryMapper } from "./TelemetryMapper";

export interface SnapshotSource {
  state: VoyageState;
  world: VoyageWorld;
}

// What the UI needs from the run, in real units and whole numbers: never the world itself.
export class SnapshotMapper extends Mapper<SnapshotSource, VoyageSnapshot> {
  private readonly telemetry: TelemetryMapper;

  constructor(private readonly config: VoyageConfig) {
    super();
    this.telemetry = new TelemetryMapper(config);
  }

  public map({ state, world }: SnapshotSource): VoyageSnapshot {
    const body = world.stores.body.get(state.ship);
    const ship = world.stores.ship.get(state.ship);
    const health = world.stores.health.get(state.ship);

    return {
      status: state.status,
      phase: state.phase,
      universe: state.universe,
      universes: state.universes,
      hull: Math.ceil(health?.hull ?? 0),
      maxHull: health?.maxHull ?? 0,
      shields: Math.floor(health?.shields ?? 0),
      maxShields: health?.maxShields ?? 0,
      fuel: Math.ceil(ship?.fuel ?? 0),
      maxFuel: ship?.maxFuel ?? 0,
      score: Math.floor(state.score),
      passing: state.passing,
      landedOn: ship?.landedOn ?? null,
      waypoint: state.waypoint && body ? { id: state.waypoint.id, distanceKm: this.distanceKm(state, body.x, body.y) } : null,
      telemetry: body && ship ? this.telemetry.map({ state, body, ship }) : {
        gravity: 0, dominant: null, altitudeKm: null, speedKmS: 0, au: null, pressureBar: null, hullTemperatureC: 20, timeDilation: 1,
      },
    };
  }

  // On the way out, real distances come from the difference in distance from the Sun; in the universes there is
  // no Sun to measure from, so the world distance is scaled to the same feel.
  private distanceKm(state: VoyageState, x: number, y: number): number {
    const { waypoint, route } = state;

    if (!waypoint) {
      return 0;
    }

    const auAt = (px: number, py: number) => 1 + (route.lastAu - 1) * (Math.hypot(px - route.origin.x, py - route.origin.y) / route.length) ** 2;

    if (state.phase === "universe") {
      return Math.round(Math.hypot(waypoint.x - x, waypoint.y - y) * this.config.units.kmPerAu * 0.02);
    }

    return Math.round(Math.abs(auAt(waypoint.x, waypoint.y) - auAt(x, y)) * this.config.units.kmPerAu);
  }
}
