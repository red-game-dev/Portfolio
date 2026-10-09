import { Mapper } from "@/packages/core/domain";
import type { Vec3 } from "@/packages/physics/kepler";

import { VoyageConfig } from "../config";
import { VoyageWorld } from "../core/world";
import { MODULE_IDS, Modules } from "../domain/components";
import { VoyageSnapshot } from "../domain/snapshot";
import { VoyageState } from "../domain/state";
import { auForRadius } from "../utils/scale";
import { TelemetryMapper } from "./TelemetryMapper";

export interface SnapshotSource {
  state: VoyageState;
  world: VoyageWorld;
}

// Within this many of a target's radii, its distance is read locally rather than across the solar system.
const LOCAL_RADII = 20;

const SOUND: Modules = { hull: 1, engines: 1, shields: 1, sensors: 1, fuel: 1, radiators: 1 };

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
    const modules = world.stores.modules.get(state.ship) ?? SOUND;

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
      modules: MODULE_IDS.reduce<Modules>((all, id) => ({ ...all, [id]: Math.round(modules[id] * 100) / 100 }), { ...SOUND }),
      waypoint: state.waypoint && body ? { id: state.waypoint.id, distanceKm: this.distanceKm(state, body.x, body.y) } : null,
      telemetry: body && ship ? this.telemetry.map({ state, body, ship }) : {
        gravity: 0,
        dominant: null,
        altitudeKm: null,
        speedKmS: 0,
        au: null,
        pressureBar: null,
        hullTemperatureC: 20,
        outsideC: 20,
        sunlight: null,
        radiation: 0,
        timeDilation: 1,
        missionTime: state.clock.epochMs,
      },
    };
  }

  // The real distance to the compass's target: near it, measured in its own kilometres; across the system,
  // between real positions round the Sun (the ship's from its distance and direction from the star); in the
  // universes there is no Sun to measure from, so the world distance is scaled to the same feel.
  private distanceKm(state: VoyageState, x: number, y: number): number {
    const { waypoint, system } = state;
    const { kmPerAu } = this.config.units;

    if (!waypoint) {
      return 0;
    }

    const across = Math.hypot(waypoint.x - x, waypoint.y - y);

    if (state.phase === "universe") {
      return Math.round(across * kmPerAu * 0.02);
    }

    const target = waypoint.id === system.star.id ? system.star : system.bodies.find((body) => body.id === waypoint.id);

    if (target && across < target.radius * LOCAL_RADII) {
      return Math.max(0, Math.round((across - target.radius) * target.kmPerUnit));
    }

    const toReal = (px: number, py: number): Vec3 => {
      const out = Math.hypot(px - system.star.x, py - system.star.y);
      const au = auForRadius(system.scale, out);
      const angle = Math.atan2(-(py - system.star.y), px - system.star.x);

      return { x: Math.cos(angle) * au, y: Math.sin(angle) * au, z: 0 };
    };
    const from = toReal(x, y);
    const to = target && "real" in target ? target.real : target ? { x: 0, y: 0, z: 0 } : toReal(waypoint.x, waypoint.y);

    return Math.round(Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) * kmPerAu);
  }
}
