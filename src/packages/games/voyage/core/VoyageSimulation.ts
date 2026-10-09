import { EventBus, SpatialHash, SystemPipeline, World } from "@/packages/games/engine";
import { RandomSource } from "@/packages/math/random";
import { createFieldSample, GravityField } from "@/packages/physics/newtonian";

import { VoyageConfig } from "../config";
import { Route } from "../domain/content";
import { VoyageEvents } from "../domain/events";
import { NO_INPUT, VoyageInput } from "../domain/input";
import { VoyageSnapshot } from "../domain/snapshot";
import { VoyageState, VoyageStatus } from "../domain/state";
import { SnapshotMapper } from "../mappers/SnapshotMapper";
import { AtmosphereSystem } from "../systems/AtmosphereSystem";
import { CaptureSystem } from "../systems/CaptureSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { VoyageContext } from "../systems/context";
import { ControlSystem } from "../systems/ControlSystem";
import { GravitySystem } from "../systems/GravitySystem";
import { HealthSystem } from "../systems/HealthSystem";
import { MotionSystem } from "../systems/MotionSystem";
import { NavigationSystem } from "../systems/NavigationSystem";
import { PhaseSystem } from "../systems/PhaseSystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import { SurfaceSystem } from "../systems/SurfaceSystem";
import { createVoyageStores, VoyageWorld } from "./world";

interface VoyageSimulationOptions {
  config: VoyageConfig;
  random: RandomSource;
}

// Where the ship waits before a run: just above Earth's air, nose up.
const startHeight = (route: Route) => (route.bodies[0]?.radius ?? 0.35) * 1.55;

// The voyage as a world of entities and a fixed order of systems, stepped at a fixed rate so every run with the
// same seed and input plays out the same: intent and navigation first, then forces, then motion, then contact,
// then what follows from it. Hosts drive it with `advance` (real time) and tests with `step` (exact time).
export class VoyageSimulation {
  public readonly world: VoyageWorld;
  public readonly events = new EventBus<VoyageEvents>();
  private readonly pipeline: SystemPipeline<VoyageContext>;
  private readonly context: VoyageContext;
  private readonly snapshots: SnapshotMapper;

  constructor(route: Route, { config, random }: VoyageSimulationOptions) {
    this.world = new World(createVoyageStores());
    this.snapshots = new SnapshotMapper(config);
    this.context = {
      world: this.world,
      state: this.fresh(route, "ready"),
      config,
      input: NO_INPUT,
      events: this.events,
      random,
      field: new GravityField(),
      sample: createFieldSample(),
      sources: [],
      sourceIds: [],
      grid: new SpatialHash(0.5),
    };
    this.pipeline = new SystemPipeline<VoyageContext>([
      new NavigationSystem(),
      new PhaseSystem(),
      new ControlSystem(),
      new GravitySystem(),
      new AtmosphereSystem(),
      new MotionSystem(),
      new SurfaceSystem(),
      new CollisionSystem(),
      new CaptureSystem(),
      new HealthSystem(),
      new SpawnSystem(),
    ], { stepMs: config.stepMs, maxSteps: config.maxSteps });
    this.placeShip();
  }

  public get state(): Readonly<VoyageState> {
    return this.context.state;
  }

  public get config(): VoyageConfig {
    return this.context.config;
  }

  // How far between the last two steps the present is, for drawing.
  public get alpha(): number {
    return this.pipeline.alpha;
  }

  public get snapshot(): VoyageSnapshot {
    return this.snapshots.map({ state: this.context.state, world: this.world });
  }

  public setView(halfWidth: number, halfHeight: number): void {
    this.context.state.view = { halfWidth, halfHeight };
  }

  // A new run from Earth, whatever the last one ended in.
  public start(): void {
    this.world.clear();
    this.context.state = this.fresh(this.context.state.route, "flying");
    this.context.state.view = { ...this.context.state.view };
    this.placeShip();
    this.pipeline.reset();
  }

  // Spends real time in fixed steps; returns how many ran.
  public advance(frameMs: number, input: VoyageInput = NO_INPUT): number {
    this.context.input = input;

    return this.pipeline.advance(this.context, frameMs, () => this.world.flush());
  }

  // Exactly `ms` of game time, for tests.
  public step(ms: number, input: VoyageInput = NO_INPUT): void {
    this.context.input = input;

    for (let elapsed = 0; elapsed < ms; elapsed += this.context.config.stepMs) {
      this.pipeline.runOnce(this.context);
      this.world.flush();
    }
  }

  private placeShip(): void {
    const { config, state } = this.context;
    const ship = this.world.spawn();
    const y = state.route.origin.y - startHeight(state.route);
    const isFlying = state.status === "flying";

    this.world.stores.body.set(ship, { x: 0, y, vx: 0, vy: isFlying ? -0.75 : 0, prevX: 0, prevY: y, radius: config.ship.radius, mass: config.ship.mass });
    this.world.stores.ship.set(ship, {
      angle: -Math.PI / 2,
      prevAngle: -Math.PI / 2,
      thrust: 0,
      isBraking: false,
      fuel: config.ship.fuel,
      maxFuel: config.ship.fuel,
      heat: 0,
      landedOn: null,
    });
    this.world.stores.health.set(ship, {
      hull: config.ship.hull,
      maxHull: config.ship.hull,
      shields: config.ship.shields,
      maxShields: config.ship.shields,
      rechargeIn: 0,
      decals: [],
    });
    state.ship = ship;
  }

  private fresh(route: Route, status: VoyageStatus): VoyageState {
    return {
      status,
      phase: "solar",
      elapsedMs: 0,
      phaseMs: 0,
      deepMs: 0,
      ship: 0,
      route,
      universe: -1,
      universes: 0,
      visited: [],
      score: 0,
      flown: 0,
      // Earth is where the run starts, so it is passed already.
      passed: new Set(route.bodies.slice(0, 1).map((body) => body.id)),
      landings: new Set(),
      passing: null,
      singularitySince: null,
      capture: null,
      waypoint: null,
      readings: { gravity: 0, dominant: null, dominantDistance: Infinity, density: 0, airOf: null, holeRatio: Infinity },
      view: this.context?.state.view ?? { halfWidth: 2, halfHeight: 2 },
    };
  }
}
