import { Mapper } from "@/packages/core/domain";
import type { Entity } from "@/packages/games/engine";
import { roundTo } from "@/packages/math/round";
import type { Vec3 } from "@/packages/physics/kepler";

import { VoyageConfig } from "../config";
import { VoyageWorld } from "../core/world";
import { MODULE_IDS, Modules } from "../domain/components";
import { DescentView, Frame, IncomingRock, VoyageSnapshot } from "../domain/snapshot";
import { VoyageState } from "../domain/state";
import { safeSpeedOf } from "../landing";
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
      universeName: state.phase === "universe" && state.cosmos ? state.cosmos.name : null,
      passing: state.passing ? state.cosmos?.names[state.passing] ?? state.passing : null,
      landedOn: ship?.landedOn ? state.cosmos?.names[ship.landedOn] ?? ship.landedOn : null,
      // The view from the surface is the renderer's; the game adds it.
      surface: null,
      descent: this.descent(state),
      modules: MODULE_IDS.reduce<Modules>((all, id) => ({ ...all, [id]: roundTo(modules[id], 2) }), { ...SOUND }),
      waypoint: state.waypoint && body
        ? { id: state.waypoint.id, name: state.cosmos?.names[state.waypoint.id] ?? null, distanceKm: this.distanceKm(state, body.x, body.y) }
        : null,
      target: state.lockedTarget !== null ? this.frame(state, world, state.lockedTarget) : null,
      boss: state.boss !== null ? this.frame(state, world, state.boss) : null,
      autoFire: state.autoFire,
      incoming: body ? this.incoming(state, world, body.x, body.y) : null,
      level: state.level,
      faults: state.faults.map(({ id, kind }) => ({ id, kind })),
      salvage: this.salvage(state, world),
      telemetry: body && ship ? this.telemetry.map({ state, body, ship }) : {
        gravity: 0,
        dominant: null,
        altitudeKm: null,
        speedKmS: 0,
        au: null,
        toHoleAu: null,
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

  // The wreck being salvaged, in tenths so the UI hears of it a few times, not every step.
  private salvage(state: VoyageState, world: VoyageWorld): VoyageSnapshot["salvage"] {
    const wreck = state.salvage ? world.stores.wreck.get(state.salvage.wreck) : undefined;

    return state.salvage && wreck && state.salvage.progress > 0 ? { kind: wreck.kind, progress: Math.floor(state.salvage.progress * 10) / 10 } : null;
  }

  // Someone the guns are on, or the boss, for an MMO frame.
  // The way down while it is coming down, in real units rounded for reading.
  private descent({ descent }: VoyageState): DescentView | null {
    if (!descent || descent.downAt !== null) {
      return null;
    }

    const { craft, plan, world } = descent;

    return {
      method: plan.method,
      phase: craft.phase,
      altitude: Math.round(craft.altitude),
      speed: roundTo(Math.hypot(craft.across, craft.up), 1),
      fall: roundTo(Math.max(0, -craft.up), 1),
      load: roundTo(craft.load, 1),
      heating: roundTo(craft.heating, 2),
      throttle: roundTo(craft.throttle, 2),
      canFly: plan.handover !== null,
      isPilot: craft.isPilot,
      reserve: Math.ceil(craft.reserve),
      safeSpeed: safeSpeedOf(plan, world),
      pace: Math.round(descent.pace),
    };
  }

  private frame(state: VoyageState, world: VoyageWorld, entity: Entity): Frame | null {
    const alien = world.stores.alien.get(entity);
    const health = world.stores.health.get(entity);
    const impactor = world.stores.impactor.get(entity);

    if (alien && health) {
      const faction = alien.faction >= 0 ? state.cosmos?.factions[alien.faction] : undefined;

      return {
        name: faction?.name ?? "",
        level: alien.level,
        disposition: faction?.disposition ?? "peaceful",
        role: alien.role,
        hull: Math.ceil(Math.max(0, health.hull)),
        maxHull: health.maxHull,
        shields: Math.floor(health.shields),
        maxShields: health.maxShields,
      };
    }

    if (impactor) {
      return { name: "", level: 0, disposition: null, role: null, hull: Math.ceil(impactor.hp), maxHull: Math.ceil(impactor.maxHp), shields: 0, maxShields: 0 };
    }

    return null;
  }

  // The nearest rock headed for a world: what it will hit, how big it is, and how long it has to go.
  private incoming(state: VoyageState, world: VoyageWorld, x: number, y: number): IncomingRock | null {
    let nearest: IncomingRock | null = null;
    let best = Infinity;

    world.stores.impactor.entities.forEach((entity, index) => {
      const impactor = world.stores.impactor.values[index];
      const rock = world.stores.body.get(entity);
      const target = state.system.bodies.find((body) => body.id === impactor.target);

      if (!rock || !target) {
        return;
      }

      const distance = Math.hypot(rock.x - x, rock.y - y);
      const closing = Math.hypot(rock.vx - target.vx, rock.vy - target.vy) || 1;

      if (distance < best) {
        best = distance;
        nearest = {
          target: state.cosmos?.names[target.id] ?? target.id,
          diameterKm: roundTo(impactor.diameterKm, 1),
          seconds: Math.max(0, Math.round((Math.hypot(rock.x - target.x, rock.y - target.y) - target.radius) / closing)),
          hp: Math.ceil(Math.max(0, impactor.hp)),
          maxHp: Math.ceil(impactor.maxHp),
          isOnCourse: impactor.isOnCourse,
        };
      }
    });

    return nearest;
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
    // Close to it, its own kilometres; the scales differ, so whichever reads further is the truer.
    const local = target && across < target.radius * LOCAL_RADII ? Math.max(0, (across - target.radius) * target.kmPerUnit) : 0;

    const toReal = (px: number, py: number): Vec3 => {
      const out = Math.hypot(px - system.star.x, py - system.star.y);
      const au = auForRadius(system.scale, out);
      const angle = Math.atan2(-(py - system.star.y), px - system.star.x);

      return { x: Math.cos(angle) * au, y: Math.sin(angle) * au, z: 0 };
    };
    const from = toReal(x, y);
    const to = target && "real" in target ? target.real : target ? { x: 0, y: 0, z: 0 } : toReal(waypoint.x, waypoint.y);

    return Math.round(Math.max(local, Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) * kmPerAu));
  }
}
