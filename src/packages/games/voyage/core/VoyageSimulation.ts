import { EventBus, SpatialHash, SystemPipeline, World } from "@/packages/games/engine";
import { RandomSource } from "@/packages/math/random";
import { createFieldSample, GravityField } from "@/packages/physics/newtonian";

import { VoyageConfig } from "../config";
import { DEFAULT_UNIVERSE_NAMES } from "../config/names";
import { MODULE_IDS } from "../domain/components";
import { StarSystem } from "../domain/content";
import { VoyageEvents } from "../domain/events";
import { ShipEffect } from "../domain/faults";
import { NO_INPUT, VoyageInput } from "../domain/input";
import { Loot, LootTable, NO_LOOT_TABLE } from "../domain/loot";
import { VoyageSnapshot } from "../domain/snapshot";
import { VoyageState, VoyageStatus } from "../domain/state";
import { UniverseNames } from "../domain/universe";
import { UniverseGenerator, UniverseTheme } from "../generators/UniverseGenerator";
import { SnapshotMapper } from "../mappers/SnapshotMapper";
import { AlienSystem } from "../systems/AlienSystem";
import { AtmosphereSystem } from "../systems/AtmosphereSystem";
import { CaptureSystem } from "../systems/CaptureSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { VoyageContext } from "../systems/context";
import { ControlSystem } from "../systems/ControlSystem";
import { GravitySystem } from "../systems/GravitySystem";
import { HealthSystem } from "../systems/HealthSystem";
import { ImpactSystem } from "../systems/ImpactSystem";
import { MalfunctionSystem } from "../systems/MalfunctionSystem";
import { MotionSystem } from "../systems/MotionSystem";
import { NavigationSystem } from "../systems/NavigationSystem";
import { missionTime, placeBodies } from "../systems/orbits";
import { OrbitSystem } from "../systems/OrbitSystem";
import { PhaseSystem } from "../systems/PhaseSystem";
import { PhenomenaSystem } from "../systems/PhenomenaSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { shipOf } from "../systems/queries";
import { SalvageSystem } from "../systems/SalvageSystem";
import { SpawnSystem } from "../systems/SpawnSystem";
import { SurfaceSystem } from "../systems/SurfaceSystem";
import { ThermalSystem } from "../systems/ThermalSystem";
import { TrafficSystem } from "../systems/TrafficSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { AURORA_BASE, WeatherSystem } from "../systems/WeatherSystem";
import { WreckSystem } from "../systems/WreckSystem";
import { StepRandom } from "../utils/stepRandom";
import { cloneSystem } from "../utils/system";
import { createVoyageStores, VoyageWorld } from "./world";

interface VoyageSimulationOptions {
  config: VoyageConfig;
  random: RandomSource;
  // What universes are called and how the first ones look; made up from defaults where left out.
  names?: UniverseNames;
  themes?: UniverseTheme[];
  // The real moment the mission clock starts from (ms since 1970): now, for a visitor, so the planets are where
  // they really are today.
  epochMs: number;
  // What wrecks, rocks and the fallen hold; nothing, unless an economy says.
  loot?: LootTable;
  // The ship's level, drawn as its hull and mark; its strength is already in `config`.
  level?: number;
}

// Below this share of what it can be, a part of the ship is worth spending something on.
const NEED = 0.95;

// Where the ship waits before a run: just above Earth's air, nose up.
const START_RADII = 1.55;
const START_SPEED = 0.75;
const START_C = 20;

// The voyage as a world of entities and a fixed order of systems, stepped at a fixed rate so every run with the
// same seed, clock and input plays out the same: the orbits first, then intent and navigation, then forces and
// heat, the living deciding what to do and the guns firing, motion, contact, shots and impacts landing, the
// strange things acting, and what follows from it all. Hosts drive it with `advance` (real time) and tests with
// `step` (exact time).
export class VoyageSimulation {
  public readonly world: VoyageWorld;
  public readonly events = new EventBus<VoyageEvents>();
  private readonly pipeline: SystemPipeline<VoyageContext>;
  private readonly context: VoyageContext;
  private readonly snapshots: SnapshotMapper;
  // The real solar system every run starts in, whichever universe the last one ended in, as it was given:
  // each run flies a copy of it.
  private readonly home: StarSystem;
  // Where a free run's randomness comes from; a daily run swaps in one seeded from its day, started over at every
  // step (`StepRandom`), and counts its steps.
  private readonly freeRandom: RandomSource;
  private daily: StepRandom | null = null;
  private stepIndex = 0;

  constructor(system: StarSystem, { config, random, epochMs, names = DEFAULT_UNIVERSE_NAMES, themes = [], loot = NO_LOOT_TABLE, level = 0 }: VoyageSimulationOptions) {
    this.world = new World(createVoyageStores());
    this.snapshots = new SnapshotMapper(config);
    this.home = system;
    this.freeRandom = random;
    this.context = {
      world: this.world,
      state: this.fresh(cloneSystem(system), "ready", epochMs, config, random, level),
      config,
      input: NO_INPUT,
      events: this.events,
      random,
      field: new GravityField(),
      sample: createFieldSample(),
      sources: [],
      sourceIds: [],
      grid: new SpatialHash(0.5),
      universes: new UniverseGenerator(config.layout, names),
      themes,
      loot,
    };
    this.pipeline = new SystemPipeline<VoyageContext>([
      new OrbitSystem(),
      new NavigationSystem(),
      new PhaseSystem(),
      new ControlSystem(),
      new GravitySystem(),
      new AtmosphereSystem(),
      new ThermalSystem(),
      new MalfunctionSystem(),
      new AlienSystem(),
      new WeaponSystem(),
      new MotionSystem(),
      new SurfaceSystem(),
      new CollisionSystem(),
      new SalvageSystem(),
      new ProjectileSystem(),
      new ImpactSystem(),
      new CaptureSystem(),
      new PhenomenaSystem(),
      new HealthSystem(),
      new WeatherSystem(),
      new TrafficSystem(),
      new WreckSystem(),
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

  // Locks the guns on someone or something, or lets go.
  public lock(entity: number | null): void {
    this.context.state.lockedTarget = entity !== null && this.world.isAlive(entity) ? entity : null;
  }

  public setAutoFire(isOn: boolean): void {
    this.context.state.autoFire = isOn;
  }

  // Refits the ship to a new level mid flight or between runs: the new config's strength, size and guns, with
  // hull, shields and fuel kept at the same share of their new maximum.
  public refit(config: VoyageConfig, level: number): void {
    const parts = shipOf(this.context);
    const weapon = this.world.stores.weapon.get(this.context.state.ship);

    this.context.config = config;
    this.context.state.level = level;

    if (!parts) {
      return;
    }

    const { body, ship, health } = parts;
    const share = (value: number, max: number) => (max > 0 ? value / max : 1);

    health.hull = share(health.hull, health.maxHull) * config.ship.hull;
    health.maxHull = config.ship.hull;
    health.shields = share(health.shields, health.maxShields) * config.ship.shields;
    health.maxShields = config.ship.shields;
    ship.fuel = share(ship.fuel, ship.maxFuel) * config.ship.fuel;
    ship.maxFuel = config.ship.fuel;
    body.radius = config.ship.radius;

    if (weapon) {
      Object.assign(weapon, this.weaponFor(config), { cooldown: weapon.cooldown });
    }
  }

  // Whether any of these would do the ship real good now: something below `NEED` of what it can be, a fault on
  // board, or a hull running hot. A scratch on the sensors is not worth a repair kit.
  public wouldHelp(effects: readonly ShipEffect[]): boolean {
    const parts = shipOf(this.context);

    if (!parts) {
      return false;
    }

    const { ship, health, modules } = parts;

    return effects.some((effect) => {
      switch (effect.kind) {
        case "hull":
          return health.hull < health.maxHull * NEED;
        case "module":
          return effect.module === "worst" ? MODULE_IDS.some((id) => modules[id] < NEED) : modules[effect.module] < NEED;
        case "fuel":
          return ship.fuel < ship.maxFuel * NEED;
        case "shields":
          return health.shields < health.maxShields * modules.shields * NEED;
        case "cool":
          return ship.temperatureC > this.context.state.readings.environmentC + 5;
        case "fix":
          return this.context.state.faults.some((fault) => fault.id === effect.fault);
        default:
          return false;
      }
    });
  }

  // Puts back on a wreck what the hold had no room for, to be salvaged again once there is.
  public returnLoot(entity: number, loot: Loot): void {
    const wreck = this.world.stores.wreck.get(entity);

    if (wreck && (loot.items.length > 0 || loot.blueprints.length > 0)) {
      wreck.loot = loot;
      wreck.isEmpty = false;
      wreck.progress = 0;
    }
  }

  // Applies what was done to the ship from outside the run: a consumable, a part fitted, a fault fixed.
  public apply(effects: readonly ShipEffect[]): void {
    const parts = shipOf(this.context);
    const { state, events } = this.context;

    if (!parts || state.status !== "flying") {
      return;
    }

    const { ship, health, modules } = parts;

    effects.forEach((effect) => {
      switch (effect.kind) {
        case "hull":
          health.hull = Math.min(health.maxHull, health.hull + health.maxHull * effect.share);
          // A patched hull loses its worst scar.
          health.decals.sort((first, second) => second.severity - first.severity).shift();
          break;
        case "module": {
          const id = effect.module === "worst" ? MODULE_IDS.reduce((low, next) => (modules[next] < modules[low] ? next : low), MODULE_IDS[0]) : effect.module;

          modules[id] = Math.min(1, modules[id] + effect.amount);
          break;
        }
        case "fuel":
          ship.fuel = Math.min(ship.maxFuel, ship.fuel + ship.maxFuel * effect.share);
          break;
        case "shields":
          health.shields = Math.min(health.maxShields * modules.shields, health.shields + health.maxShields * effect.share);
          break;
        case "cool":
          ship.temperatureC = Math.max(state.readings.environmentC, ship.temperatureC - effect.degrees);
          break;
        case "fix": {
          const fault = state.faults.find((entry) => entry.id === effect.fault);

          if (fault) {
            state.faults = state.faults.filter((entry) => entry !== fault);
            events.emit("fixed", { kind: fault.kind });
          }

          break;
        }
        default:
          break;
      }
    });
  }

  // A new run from Earth, whatever the last one ended in, with the clock starting again from `epochMs` (or from
  // where the last run's started).
  // A daily voyage passes its day and seed: everything random in the run then comes from that seed, so everyone
  // flying it that day meets the same universes, rocks and wrecks for the same flying.
  public start(epochMs = this.context.state.clock.epochMs, daily: { day: string; seed: number } | null = null): void {
    this.world.clear();
    this.daily = daily ? new StepRandom(daily.seed) : null;
    this.stepIndex = 0;
    this.context.random = this.daily?.next ?? this.freeRandom;
    this.context.state = this.fresh(cloneSystem(this.home), "flying", epochMs, this.context.config, this.context.random, this.context.state.level);
    this.context.state.daily = daily?.day ?? null;
    this.daily?.reseed(0);
    this.context.state.view = { ...this.context.state.view };
    this.placeShip();
    this.pipeline.reset();
  }

  // Spends real time in fixed steps; returns how many ran.
  public advance(frameMs: number, input: VoyageInput = NO_INPUT): number {
    this.context.input = input;

    return this.pipeline.advance(this.context, frameMs, () => this.afterStep());
  }

  // Exactly `ms` of game time, for tests.
  public step(ms: number, input: VoyageInput = NO_INPUT): void {
    this.context.input = input;

    for (let elapsed = 0; elapsed < ms; elapsed += this.context.config.stepMs) {
      this.pipeline.runOnce(this.context);
      this.afterStep();
    }
  }

  // Despawns what a step let go of, and on a daily voyage starts the next step's draws over from its number.
  private afterStep(): void {
    this.world.flush();
    this.stepIndex += 1;
    this.daily?.reseed(this.stepIndex);
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
    this.world.stores.weapon.set(ship, { ...this.weaponFor(config), cooldown: 0 });
    state.ship = ship;
  }

  private weaponFor({ arms }: VoyageConfig) {
    return { kind: arms.kind, damage: arms.damage, rate: arms.rate, range: arms.range, speed: arms.speed, heat: arms.heat };
  }

  private fresh(system: StarSystem, status: VoyageStatus, epochMs: number, config: VoyageConfig, random: RandomSource, level: number): VoyageState {
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
        tidal: 0,
        nebula: 0,
      },
      storms: [],
      aurora: AURORA_BASE,
      stormDose: 0,
      flare: null,
      nextFlareAt: null,
      nextCometAt: null,
      cosmos: null,
      runSeed: Math.floor(random() * 2 ** 31),
      lockedTarget: null,
      autoFire: true,
      signature: 0,
      craters: {},
      phenomena: { supernova: null, burst: null, nextBurstAt: null, pulsarAngle: 0, strikeAt: null, jumpedAt: -1e9 },
      boss: null,
      bossFallen: false,
      nextImpactAt: null,
      nextTrafficAt: null,
      level,
      daily: null,
      skimmed: new Set(),
      closestAu: Infinity,
      faults: [],
      nextFaultId: 1,
      salvage: null,
      nextWreckAt: null,
      view: this.context?.state.view ?? { halfWidth: 2, halfHeight: 2 },
    };
  }
}
