import { EventBus, SpatialHash, SystemPipeline, World } from "@/packages/games/engine";
import { RandomSource } from "@/packages/math/random";
import { createFieldSample, GravityField } from "@/packages/physics/newtonian";

import { VoyageConfig } from "../config";
import { StarSystem } from "../domain/content";
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
import { missionTime, placeBodies } from "../systems/orbits";
import { OrbitSystem } from "../systems/OrbitSystem";
import { PhaseSystem } from "../systems/PhaseSystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import { SurfaceSystem } from "../systems/SurfaceSystem";
import { ThermalSystem } from "../systems/ThermalSystem";
import { AURORA_BASE, WeatherSystem } from "../systems/WeatherSystem";
import { cloneSystem } from "../utils/system";
import { createVoyageStores, VoyageWorld } from "./world";

interface VoyageSimulationOptions {
  config: VoyageConfig;
  random: RandomSource;
  // The real moment the mission clock starts from (ms since 1970): now, for a visitor, so the planets are where
  // they really are today.
  epochMs: number;
}

// Where the ship waits before a run: just above Earth's air, nose up.
const START_RADII = 1.55;
const START_SPEED = 0.75;
const START_C = 20;

// The voyage as a world of entities and a fixed order of systems, stepped at a fixed rate so every run with the
// same seed, clock and input plays out the same: the orbits first, then intent and navigation, then forces,
// heat, motion, contact, and what follows from it. Hosts drive it with `advance` (real time) and tests with
// `step` (exact time).
export class VoyageSimulation {
  public readonly world: VoyageWorld;
  public readonly events = new EventBus<VoyageEvents>();
  private readonly pipeline: SystemPipeline<VoyageContext>;
  private readonly context: VoyageContext;
  private readonly snapshots: SnapshotMapper;
  // The system as it was given, never flown in: each run flies a copy of it.
  private readonly home: StarSystem;

  constructor(system: StarSystem, { config, random, epochMs }: VoyageSimulationOptions) {
    this.world = new World(createVoyageStores());
    this.snapshots = new SnapshotMapper(config);
    this.home = system;
    this.context = {
      world: this.world,
      state: this.fresh(cloneSystem(system), "ready", epochMs, config),
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
      new OrbitSystem(),
      new NavigationSystem(),
      new PhaseSystem(),
      new ControlSystem(),
      new GravitySystem(),
      new AtmosphereSystem(),
      new ThermalSystem(),
      new MotionSystem(),
      new SurfaceSystem(),
      new CollisionSystem(),
      new CaptureSystem(),
      new HealthSystem(),
      new WeatherSystem(),
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

  // A new run from Earth, whatever the last one ended in, with the clock starting again from `epochMs` (or from
  // where the last run's started).
  public start(epochMs = this.context.state.clock.epochMs): void {
    this.world.clear();
    this.context.state = this.fresh(cloneSystem(this.home), "flying", epochMs, this.context.config);
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
    const earth = state.system.bodies.find((body) => body.id === "earth") ?? state.system.bodies[0];
    const x = earth ? earth.x : state.system.star.x + state.system.star.radius * 4;
    const y = earth ? earth.y - earth.radius * START_RADII : state.system.star.y;
    const isFlying = state.status === "flying";

    this.world.stores.body.set(ship, {
      x,
      y,
      vx: earth?.vx ?? 0,
      vy: (earth?.vy ?? 0) + (isFlying ? -START_SPEED : 0),
      prevX: x,
      prevY: y,
      radius: config.ship.radius,
      mass: config.ship.mass,
    });
    this.world.stores.ship.set(ship, {
      angle: -Math.PI / 2,
      prevAngle: -Math.PI / 2,
      thrust: 0,
      isBraking: false,
      fuel: config.ship.fuel,
      maxFuel: config.ship.fuel,
      temperatureC: START_C,
      landedOn: null,
      landedOffset: null,
    });
    this.world.stores.health.set(ship, {
      hull: config.ship.hull,
      maxHull: config.ship.hull,
      shields: config.ship.shields,
      maxShields: config.ship.shields,
      rechargeIn: 0,
      decals: [],
    });
    this.world.stores.modules.set(ship, { hull: 1, engines: 1, shields: 1, sensors: 1, fuel: 1, radiators: 1 });
    state.ship = ship;
  }

  private fresh(system: StarSystem, status: VoyageStatus, epochMs: number, config: VoyageConfig): VoyageState {
    const clock = { epochMs, hoursPerSecond: config.clock.hoursPerSecond };

    placeBodies(system, missionTime(clock, 0));

    return {
      status,
      phase: "solar",
      elapsedMs: 0,
      phaseMs: 0,
      deepMs: 0,
      clock,
      ship: 0,
      system,
      universe: -1,
      universes: 0,
      visited: [],
      score: 0,
      flown: 0,
      // Earth is where the run starts, so it is visited already.
      passed: new Set(["earth"]),
      landings: new Set(),
      passing: null,
      singularitySince: null,
      capture: null,
      waypoint: null,
      readings: {
        gravity: 0,
        dominant: null,
        dominantDistance: Infinity,
        density: 0,
        pressureBar: 0,
        airOf: null,
        airC: null,
        holeRatio: Infinity,
        environmentC: START_C,
        sunlight: 0,
        radiation: 0,
      },
      storms: [],
      aurora: AURORA_BASE,
      stormDose: 0,
      flare: null,
      nextFlareAt: null,
      nextCometAt: null,
      view: this.context?.state.view ?? { halfWidth: 2, halfHeight: 2 },
    };
  }
}
