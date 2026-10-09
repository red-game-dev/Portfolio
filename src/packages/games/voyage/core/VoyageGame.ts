import { FrameLoop, FrameScheduler, QualityGovernor } from "@/packages/animation/frame-loop";
import { Camera } from "@/packages/games/engine";
import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { CanvasGlobeRenderer, GlobeRenderer, WebGLGlobeRenderer } from "@/packages/graphics/globe";
import { LensingPresenter } from "@/packages/graphics/webgl";
import { RandomSource } from "@/packages/math/random";

import { DEFAULT_VOYAGE_THEME, resolveVoyageConfig, VoyageConfig, VoyageConfigOverrides, VoyageTheme } from "../config";
import { ModuleId, WreckKind } from "../domain/components";
import { StarSystem } from "../domain/content";
import { FlareClass, ImpactOutcome, VoyageEvents } from "../domain/events";
import { FaultKind, ShipEffect } from "../domain/faults";
import { VoyageInput } from "../domain/input";
import { ItemStack } from "../domain/loot";
import { VoyageSnapshot } from "../domain/snapshot";
import { UniverseNames } from "../domain/universe";
import { configForLevel, markOf, tierOf } from "../economy/config/tiers";
import { CatalogLootTable } from "../economy/core/CatalogLootTable";
import { Deed, EconomyView, HullTier, Purse, ShipStatus, Suggestion } from "../economy/domain/economy";
import { Hangar } from "../economy/services/Hangar";
import { CanvasVoyageRenderer, VoyageRenderer } from "../renderers/CanvasVoyageRenderer";
import { universeOf } from "../renderers/frame";
import { SystemService } from "../services/SystemService";
import { SolarSystemSource } from "../sources/SolarSystemSource";
import { VoyageSimulation } from "./VoyageSimulation";

// Something the UI may want to say, as it happens, beyond what the snapshot shows.
export type VoyageNotice =
  | { kind: "landed" | "tookOff" | "emergency"; body: string }
  | { kind: "captured"; isSingularity: boolean }
  | { kind: "destroyed" }
  | { kind: "flare"; flareClass: FlareClass; isHeading: boolean }
  | { kind: "storm" }
  | { kind: "failing"; module: ModuleId; isGone: boolean }
  | { kind: "melting"; temperatureC: number }
  | { kind: "impactAlert"; target: string; diameterKm: number; seconds: number }
  | { kind: "impact"; target: string; outcome: ImpactOutcome; craterKm: number }
  | { kind: "impactorBroken" | "deflected"; target: string }
  | { kind: "boss"; name: string; isFallen: boolean }
  | { kind: "heard" | "wormhole" }
  | { kind: "supernova"; seconds: number; isBlown: boolean }
  | { kind: "burst"; seconds: number; isFired: boolean }
  | { kind: "salvaged"; wreck: WreckKind; kept: ItemStack[]; lost: ItemStack[]; blueprints: string[] }
  | { kind: "fault" | "fixed"; fault: FaultKind }
  | { kind: "upgraded"; level: number; tier: HullTier; mark: number }
  | { kind: "earned"; deed: Deed["kind"]; amounts: Purse }
  | { kind: "paid"; coin: number };

// What the pilot can ask of the hangar from the UI, each in one click.
export type VoyageAction =
  | { kind: "upgrade" }
  | { kind: "craft"; recipe: string }
  | { kind: "recycle"; item: string; count: number }
  | { kind: "use"; item: string }
  | { kind: "repair"; fault: number }
  | { kind: "trade"; direction: "sell" | "buy" }
  | { kind: "reset" };

export interface VoyageOptions {
  config?: VoyageConfigOverrides;
  random?: RandomSource;
  scheduler?: FrameScheduler;
  system?: StarSystem;
  // When the mission clock starts, for each run (ms since 1970); the real now unless a host says otherwise.
  now?: () => number;
  // What to call each place on the system map, by id; what the first universes are called (the site's zones,
  // in the order of the theme's), and the syllables the rest are named from.
  labels?: Record<string, string>;
  universeNames?: string[];
  syllables?: UniverseNames;
  onChange?: (snapshot: VoyageSnapshot) => void;
  onNotice?: (notice: VoyageNotice) => void;
  // The pilot's hangar, kept between runs: their ship's level, hold and money. Left out, there is no economy and
  // wrecks hold nothing.
  hangar?: Hangar;
  onEconomy?: (view: EconomyView) => void;
  // The quality level to start at (0 the finest); it steps down by itself if frames run slow.
  quality?: number;
}

export interface VoyageCanvases {
  back: Canvas2DContext;
  front: Canvas2DContext;
  // The WebGL canvas between them for the black hole lens; left out, or unable, the 2D lens is drawn instead.
  lens?: HTMLCanvasElement | OffscreenCanvas | null;
  // A canvas off screen for the GPU to draw planets and the Sun in; left out, or unable, they are drawn in 2D.
  globe?: HTMLCanvasElement | OffscreenCanvas | null;
}

export interface VoyageCanvasOptions extends VoyageOptions {
  theme?: Partial<VoyageTheme>;
}

// The snapshot's continuous numbers (score, telemetry, bars) reach the UI this often; changes of state at once.
const TICK_MS = 250;
// After the ship is lost the loop runs this long more for the wreck to finish, then stops on its last frame.
const WRECK_MS = 3200;
// A pointer this close to the ship (in CSS pixels) asks for no thrust; this far or more, full thrust.
const DEADZONE = 26;
const FULL_THRUST_SHARE = 0.32;
// World units across the shorter side of the screen at zoom 1.
const UNITS_ACROSS = 2.2;
// How near a click must land to lock onto something (CSS pixels); how far off an attacker draws the camera
// back to show it, and the room left round it (world units).
const LOCK_SLACK = 30;
const ATTACK_REACH = 7;
const ATTACK_MARGIN = 0.9;
// How far the player can zoom out and in, against the camera's own choice.
const ZOOM_RANGE: [number, number] = [0.3, 3];
// Deeds big enough to announce what they paid.
const ANNOUNCED: ReadonlyArray<Deed["kind"]> = ["boss", "universe", "rescue"];

// The most pixels per CSS pixel the canvases draw at, by quality level: a phone that cannot keep up at its full
// sharpness steps down until it can, which cuts the GPU's fill work by up to three quarters.
const QUALITY_RATIOS: readonly number[] = [2, 1.5, 1.25, 1];

// What changes the snapshot at once rather than on the next tick.
interface Moment {
  status: string;
  phase: string;
  universe: number;
  universes: number;
  passing: string | null;
  landedOn: string | null;
  waypoint: string | null;
  level: number;
  faults: number;
  isSalvaging: boolean;
}

// Hosts a voyage on the shared frame loop: steps the simulation in fixed steps, flies the camera after the ship,
// turns pointer and keys into intent, draws through the renderer and the GPU lens, and tells the UI only what
// changed.
export class VoyageGame extends FrameLoop {
  public readonly simulation: VoyageSimulation;
  private readonly renderer: VoyageRenderer;
  private readonly presenter: LensingPresenter | null;
  private readonly backCanvas: TexImageSource | null;
  private readonly theme: VoyageTheme;
  private readonly camera = new Camera({ pixelsPerUnit: 400, stiffness: 5.5 });
  private readonly onChange: (snapshot: VoyageSnapshot) => void;
  private readonly onNotice: (notice: VoyageNotice) => void;
  private readonly detach: () => void;
  private readonly now: () => number;
  private pointer: { x: number; y: number } | null = null;
  private zoomBias = 1;
  private keys = { turn: 0, thrust: 0, brake: false };
  private lastSnapshot: VoyageSnapshot;
  private lastTickAt = 0;
  private lastFrameAt = 0;
  private overSince: number | null = null;
  private size = { width: 0, height: 0 };
  private readonly hangar: Hangar | null;
  private readonly baseConfig: VoyageConfig;
  private readonly onEconomy: (view: EconomyView) => void;
  private landed = new Set<string>();
  private savedRocks = new Set<number>();
  private isRunPaid = false;
  private lastSuggestion: Suggestion | null | undefined = undefined;
  private devicePixelRatio = 1;
  private readonly governor: QualityGovernor;
  private moment: Moment | null = null;

  constructor(simulation: VoyageSimulation, renderer: VoyageRenderer, presenter: LensingPresenter | null, backCanvas: TexImageSource | null, theme: VoyageTheme,
    options: VoyageOptions = {}) {
    super({ framesPerSecond: simulation.config.framesPerSecond, maxStepMs: 100, scheduler: options.scheduler });
    this.simulation = simulation;
    this.renderer = renderer;
    this.presenter = presenter;
    this.backCanvas = backCanvas;
    this.theme = theme;
    this.onChange = options.onChange ?? (() => undefined);
    this.onNotice = options.onNotice ?? (() => undefined);
    this.now = options.now ?? (() => Date.now());
    this.hangar = options.hangar ?? null;
    this.baseConfig = simulation.config;
    this.onEconomy = options.onEconomy ?? (() => undefined);

    if (this.hangar) {
      simulation.refit(configForLevel(this.baseConfig, this.hangar.level), this.hangar.level);
    }

    this.lastSnapshot = simulation.snapshot;
    this.detach = this.listen(simulation.events);
    this.governor = new QualityGovernor({ levels: QUALITY_RATIOS.length, start: options.quality ?? 0 });
    this.renderer.setQuality(this.governor.level);
  }

  // How finely it is drawing now, 0 the finest.
  public get quality(): number {
    return this.governor.level;
  }

  public get snapshot(): VoyageSnapshot {
    return this.lastSnapshot;
  }

  // The economy as the UI shows it, with the one thing most worth doing now; null with no hangar.
  public get economy(): EconomyView | null {
    return this.hangar?.view(this.shipStatus()) ?? null;
  }

  public static forCanvas({ back, front, lens, globe }: VoyageCanvases, options: VoyageCanvasOptions = {}): VoyageGame {
    const config = resolveVoyageConfig(options.config);
    const theme = { ...DEFAULT_VOYAGE_THEME, ...options.theme };
    const system = options.system ?? new SystemService(new SolarSystemSource(), config.layout).getView();
    const simulation = new VoyageSimulation(system, {
      config: { ...config, universes: theme.universes.length },
      random: options.random ?? Math.random,
      epochMs: (options.now ?? Date.now)(),
      names: options.syllables,
      themes: theme.universes.map((universe, index) => ({ ...universe, name: options.universeNames?.[index] ?? universe.style })),
      loot: options.hangar ? new CatalogLootTable() : undefined,
    });
    const presenter = lens ? LensingPresenter.create(lens) : null;
    const globes: GlobeRenderer = (globe ? WebGLGlobeRenderer.create(globe) : null) ?? new CanvasGlobeRenderer();

    return new VoyageGame(simulation, new CanvasVoyageRenderer(back, front, theme, globes, options.labels ?? {}), presenter, back.canvas, theme, options);
  }

  // A real map for a body's surface (an id from `TEXTURE_IDS`), as it arrives.
  public setTexture(id: string, image: TexImageSource): void {
    this.renderer.setTexture(id, image);
  }

  // Zooms the view by a factor, within the player's range.
  public zoomBy(factor: number): void {
    this.zoomBias = Math.max(ZOOM_RANGE[0], Math.min(ZOOM_RANGE[1], this.zoomBias * factor));
  }

  // Opens or closes the map of the system over the view.
  public setMap(isOpen: boolean): void {
    this.renderer.setMap(isOpen);

    if (!this.isRunning) {
      this.drawFrame(performance.now(), 0);
    }
  }

  public resize(size: { width: number; height: number }, pixelRatio = 1): void {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    this.size = size;
    this.devicePixelRatio = pixelRatio;
    this.camera.resize(size, Math.min(size.width, size.height) / UNITS_ACROSS);
    this.applySharpness();
    this.updateView();
    this.followShip(1, true);
    this.drawFrame(performance.now(), 0);
  }

  public play(): void {
    this.landed = new Set();
    this.savedRocks = new Set();
    this.isRunPaid = false;
    this.simulation.start(this.now());
    this.zoomBias = 1;
    this.renderer.reset();
    this.followShip(1, true);
    this.publish(true);
    this.start();
  }

  public pause(): void {
    this.stop();
  }

  public resume(): void {
    if (this.simulation.state.status === "flying") {
      this.lastFrameAt = 0;
      this.start();
    }
  }

  // Pointer at x, y on the canvas (CSS pixels), or null when it leaves or the finger lifts.
  public point(position: { x: number; y: number } | null): void {
    this.pointer = position;
  }

  public setKeys(keys: { turn: number; thrust: number; brake: boolean }): void {
    this.keys = keys;

    // Keys take over from the pointer until it moves again.
    if (keys.turn !== 0 || keys.thrust !== 0 || keys.brake) {
      this.pointer = null;
    }
  }

  // Stops for good and gives back everything it holds on the GPU.
  public dispose(): void {
    this.stop();
    this.detach();
    this.renderer.dispose();
    this.presenter?.dispose();
  }

  // Does what the pilot asked of the hangar; whatever it does to the ship is applied to the run. Returns whether
  // it was done.
  public act(action: VoyageAction): boolean {
    const { hangar, simulation } = this;
    const isFlying = simulation.state.status === "flying";

    if (!hangar) {
      return false;
    }

    switch (action.kind) {
      case "upgrade": {
        const level = hangar.upgrade();

        if (level === null) {
          return false;
        }

        // The hangar's change has already refitted the ship.
        this.onNotice({ kind: "upgraded", level, tier: tierOf(level), mark: markOf(level) });
        this.redraw();

        return true;
      }
      case "craft":
        return hangar.craft(action.recipe);
      case "recycle":
        return hangar.recycle(action.item, action.count) > 0;
      case "trade":
        return hangar.trade(action.direction);
      case "use":
        // Nothing is used up for nothing: a repair kit on a sound ship stays in the hold.
        return isFlying && simulation.wouldHelp(hangar.effectsFor(action.item)) && this.applyEffects(hangar.use(action.item));
      case "repair": {
        const fault = simulation.state.faults.find((entry) => entry.id === action.fault);

        return isFlying && fault !== undefined && this.applyEffects(hangar.repair(fault));
      }
      case "reset":
        if (isFlying) {
          return false;
        }

        hangar.reset();
        this.redraw();

        return true;
      default:
        return false;
    }
  }

  // Does the one thing the hangar suggests.
  public follow(suggestion: Suggestion): boolean {
    switch (suggestion.kind) {
      case "upgrade":
        return this.act({ kind: "upgrade" });
      case "repair":
        return this.act({ kind: "repair", fault: suggestion.fault });
      case "craft":
        return this.act({ kind: "craft", recipe: suggestion.recipe });
      case "use":
        return this.act({ kind: "use", item: suggestion.item });
      default:
        return false;
    }
  }

  // Locks the guns on whoever, or whatever rock, is under a point on the screen (CSS pixels); a point on
  // nothing lets go. Returns whether something was locked.
  public lockAt(position: { x: number; y: number }): boolean {
    const { world, state } = this.simulation;
    const x = this.camera.toWorldX(position.x);
    const y = this.camera.toWorldY(position.y);
    let best: number | null = null;
    let nearest = LOCK_SLACK / this.camera.scale;

    [world.stores.alien, world.stores.impactor].forEach((store) => store.entities.forEach((entity) => {
      const at = world.stores.body.get(entity);
      const distance = at ? Math.hypot(at.x - x, at.y - y) - at.radius : Infinity;

      if (distance < nearest) {
        best = entity;
        nearest = distance;
      }
    }));

    this.simulation.lock(best);

    return state.lockedTarget !== null;
  }

  // Whether the guns fire by themselves at what threatens the ship.
  public setAutoFire(isOn: boolean): void {
    this.simulation.setAutoFire(isOn);
    this.publish(true);
  }


  protected update(deltaMs: number): void {
    this.simulation.advance(deltaMs, this.input());
    this.followShip(deltaMs / 1000, false);
    this.publish(false, performance.now());
  }

  protected render(now: number): void {
    const dt = this.lastFrameAt > 0 ? Math.min(0.1, (now - this.lastFrameAt) / 1000) : 0;
    const level = this.lastFrameAt > 0 ? this.governor.sample(now - this.lastFrameAt, now) : null;

    if (level !== null) {
      this.renderer.setQuality(level);
      this.applySharpness();
    }

    this.lastFrameAt = now;
    this.camera.tick(dt);
    this.drawFrame(now, dt);

    const { state } = this.simulation;

    if (this.overFor(now) > WRECK_MS && state.status === "over") {
      this.stop();
    }
  }

  private applyEffects(effects: ShipEffect[] | null): boolean {
    if (!effects) {
      return false;
    }

    this.simulation.apply(effects);
    this.publish(true);

    return true;
  }

  private redraw(): void {
    this.publish(true);

    if (!this.isRunning) {
      this.drawFrame(performance.now(), 0);
    }
  }

  // What the hangar needs of the ship to suggest the next thing to do.
  private shipStatus(): ShipStatus | null {
    const { state, world, config } = this.simulation;
    const ship = world.stores.ship.get(state.ship);
    const health = world.stores.health.get(state.ship);

    if (!ship || !health) {
      return null;
    }

    return {
      isFlying: state.status === "flying",
      faults: state.faults.map(({ id, kind }) => ({ id, kind })),
      hull: health.maxHull > 0 ? health.hull / health.maxHull : 1,
      fuel: ship.maxFuel > 0 ? ship.fuel / ship.maxFuel : 1,
      shields: health.maxShields > 0 ? health.shields / health.maxShields : 1,
      heat: ship.temperatureC / config.thermal.ratings.hull,
    };
  }

  // How far the nearest one coming for the ship is, within reach of a fight; null when none is.
  private nearestAttacker(x: number, y: number): number | null {
    const { world } = this.simulation;
    let nearest: number | null = null;

    world.stores.alien.entities.forEach((entity, index) => {
      const alien = world.stores.alien.values[index];
      const at = world.stores.body.get(entity);
      const distance = at ? Math.hypot(at.x - x, at.y - y) : Infinity;

      if (alien.threat > 0 && alien.mode !== "evade" && distance < ATTACK_REACH && (nearest === null || distance < nearest)) {
        nearest = distance;
      }
    });

    return nearest;
  }

  // A place's made up name where it has one, else its id for the host to name.
  private nameOf(id: string): string {
    return this.simulation.state.cosmos?.names[id] ?? id;
  }

  private overFor(now: number): number {
    if (this.simulation.state.status !== "over") {
      this.overSince = null;

      return 0;
    }

    this.overSince = this.overSince ?? now;

    return now - this.overSince;
  }

  private input(): VoyageInput {
    const parts = this.shipScreen();

    if (this.pointer && parts) {
      const distance = Math.hypot(this.pointer.x - parts.x, this.pointer.y - parts.y);
      const full = Math.min(this.size.width, this.size.height) * FULL_THRUST_SHARE;

      return {
        aim: { x: this.camera.toWorldX(this.pointer.x), y: this.camera.toWorldY(this.pointer.y) },
        thrust: Math.max(0, Math.min(1, (distance - DEADZONE) / full)),
        turn: 0,
        brake: false,
      };
    }

    return { aim: null, thrust: this.keys.thrust, turn: this.keys.turn, brake: this.keys.brake };
  }

  private shipScreen(): { x: number; y: number } | null {
    const body = this.simulation.world.stores.body.get(this.simulation.state.ship);

    return body ? { x: this.camera.toScreenX(body.x), y: this.camera.toScreenY(body.y) } : null;
  }

  // The camera looks ahead along the ship's path, pulls out at speed, in when landed, dives in during a fall, and
  // holds still in the tunnel.
  private followShip(dt: number, isJump: boolean): void {
    const { state, world, config, alpha } = this.simulation;
    const body = world.stores.body.get(state.ship);
    const ship = world.stores.ship.get(state.ship);

    if (!body) {
      return;
    }

    const x = body.prevX + (body.x - body.prevX) * alpha;
    const y = body.prevY + (body.y - body.prevY) * alpha;
    const speed = Math.hypot(body.vx, body.vy);
    const lookAhead = state.capture ? 0 : 0.4;
    const fall = state.capture?.progress ?? 0;
    let zoom = 1 - Math.min(0.3, (speed / config.ship.maxSpeed) * 0.3);

    // In a fight, pull back far enough to see who is shooting.
    const attacker = this.nearestAttacker(x, y);

    if (attacker !== null) {
      const fit = Math.min(this.size.width, this.size.height) / 2 / this.camera.scale * this.camera.zoom;

      zoom = Math.min(zoom, Math.max(0.45, fit / (attacker + ATTACK_MARGIN)));
    }

    if (ship?.landedOn) {
      zoom = 1.2;
    } else if (state.capture) {
      zoom = 1 + fall * 1.4;
    } else if (state.phase === "singularity") {
      zoom = Math.min(zoom, 0.8);
    }

    if (isJump) {
      this.camera.jumpTo(x + body.vx * lookAhead, y + body.vy * lookAhead);
    } else {
      this.camera.follow(x + body.vx * lookAhead, y + body.vy * lookAhead, dt);
      this.camera.easeZoom(zoom * (state.capture ? 1 : this.zoomBias), dt);
    }

    this.updateView();
  }

  private updateView(): void {
    const scale = this.camera.scale;

    if (scale > 0 && this.size.width > 0) {
      this.simulation.setView(this.size.width / 2 / scale, this.size.height / 2 / scale);
    }
  }

  private drawFrame(now: number, dt: number): void {
    const { state, world, config, alpha } = this.simulation;
    const frame = {
      state,
      world,
      camera: this.camera,
      config,
      theme: this.theme,
      now,
      dt,
      alpha,
      universe: universeOf(state, this.theme),
      isLensed: false,
    };
    const lenses = this.presenter?.available ? this.renderer.lenses(frame) : [];

    frame.isLensed = lenses.length > 0;
    this.renderer.draw(frame);

    if (this.presenter && this.backCanvas) {
      this.presenter.present(this.backCanvas, lenses);
    }
  }

  private listen(events: VoyageSimulation["events"]): () => void {
    const detachRenderer = this.renderer.attach(events, this.camera);
    const tell = <K extends keyof VoyageEvents>(type: K, notice: (payload: VoyageEvents[K]) => VoyageNotice) => events.on(type, (payload) => {
      this.onNotice(notice(payload));
    });
    const offs = [
      tell("landed", ({ body }) => ({ kind: "landed", body })),
      tell("tookOff", ({ body }) => ({ kind: "tookOff", body })),
      tell("emergency", ({ body }) => ({ kind: "emergency", body })),
      tell("captured", ({ isSingularity }) => ({ kind: "captured", isSingularity })),
      tell("destroyed", () => ({ kind: "destroyed" })),
      tell("flare", ({ class: flareClass, isHeading }) => ({ kind: "flare", flareClass, isHeading })),
      tell("storm", () => ({ kind: "storm" })),
      tell("failing", ({ module, isGone }) => ({ kind: "failing", module, isGone })),
      tell("melting", ({ temperatureC }) => ({ kind: "melting", temperatureC })),
      tell("impactAlert", ({ target, diameterKm, seconds }) => ({ kind: "impactAlert", target: this.nameOf(target), diameterKm, seconds })),
      tell("impact", ({ target, outcome, craterKm }) => ({ kind: "impact", target: this.nameOf(target), outcome, craterKm })),
      tell("impactorBroken", ({ target }) => ({ kind: "impactorBroken", target: this.nameOf(target) })),
      tell("deflected", ({ target }) => ({ kind: "deflected", target: this.nameOf(target) })),
      tell("boss", ({ name, isFallen }) => ({ kind: "boss", name, isFallen })),
      tell("heard", () => ({ kind: "heard" })),
      tell("wormhole", () => ({ kind: "wormhole" })),
      tell("supernova", ({ seconds, isBlown }) => ({ kind: "supernova", seconds, isBlown })),
      tell("burst", ({ seconds, isFired }) => ({ kind: "burst", seconds, isFired })),
      tell("fault", ({ kind }) => ({ kind: "fault", fault: kind })),
      tell("fixed", ({ kind }) => ({ kind: "fixed", fault: kind })),
      ...this.listenForEconomy(events),
    ];

    return () => {
      detachRenderer();
      offs.forEach((off) => off());
    };
  }

  // Pays the hangar for deeds and stows what is salvaged, announcing the larger sums and every find.
  private listenForEconomy(events: VoyageSimulation["events"]): Array<() => void> {
    const { hangar } = this;

    if (!hangar) {
      return [];
    }

    const pay = (deed: Deed) => {
      const amounts = hangar.reward(deed);

      if (ANNOUNCED.includes(deed.kind)) {
        this.onNotice({ kind: "earned", deed: deed.kind, amounts });
      }
    };

    return [
      events.on("passing", ({ stop }) => pay({ kind: "discovery", place: this.nameOf(stop) })),
      events.on("landed", ({ body }) => {
        if (!this.landed.has(body)) {
          this.landed.add(body);
          pay({ kind: "landing", place: this.nameOf(body) });
        }
      }),
      events.on("downed", ({ role, level }) => {
        if (role === "fighter") {
          pay({ kind: "bounty", level });
        }
      }),
      events.on("boss", ({ name, isFallen }) => {
        if (isFallen) {
          pay({ kind: "boss", name });
        }
      }),
      // A world is saved once per rock: turning it and then breaking it, or breaking the pieces of one already
      // broken, pays nothing more.
      events.on("impactorBroken", ({ rock, target, isFragment }) => {
        if (!isFragment && this.firstSave(rock)) {
          pay({ kind: "rescue", target: this.nameOf(target), isDeflected: false });
        }
      }),
      events.on("deflected", ({ rock, target, isFragment }) => {
        if (!isFragment && this.firstSave(rock)) {
          pay({ kind: "rescue", target: this.nameOf(target), isDeflected: true });
        }
      }),
      events.on("phase", ({ phase, universe }) => {
        if (phase === "universe") {
          pay({ kind: "universe", index: universe });
        }
      }),
      events.on("salvaged", ({ wreck, kind, loot }) => {
        const { kept, lost, blueprints } = hangar.stow(loot);

        // What does not fit stays on the wreck for when there is room.
        this.simulation.returnLoot(wreck, { items: lost, blueprints: [] });
        this.onNotice({ kind: "salvaged", wreck: kind, kept, lost, blueprints });
      }),
      // A fault, or its fix, changes what can be mended from the hold.
      events.on("fault", () => this.publishEconomy(true)),
      events.on("fixed", () => this.publishEconomy(true)),
      hangar.subscribe(() => {
        // A level that changed from outside a run (a reset, another tab's save) refits the ship too.
        if (hangar.level !== this.simulation.state.level) {
          this.simulation.refit(configForLevel(this.baseConfig, hangar.level), hangar.level);
        }

        this.publishEconomy(true);
      }),
    ];
  }

  // Whether this is the first time a rock has been stopped this run.
  private firstSave(rock: number): boolean {
    const isFirst = !this.savedRocks.has(rock);

    this.savedRocks.add(rock);

    return isFirst;
  }

  // The economy reaches the UI when it changes, and when the thing most worth doing does.
  private publishEconomy(force: boolean): void {
    if (!this.hangar) {
      return;
    }

    const status = this.shipStatus();
    const suggestion = this.hangar.suggest(status);

    if (force || suggestion !== this.lastSuggestion) {
      this.lastSuggestion = suggestion;
      this.onEconomy(this.hangar.view(status));
    }
  }

  // Sizes the canvases at the device's pixel ratio, as far as the quality level allows.
  private applySharpness(): void {
    const ratio = Math.min(this.devicePixelRatio, QUALITY_RATIOS[this.governor.level]);

    this.renderer.resize(this.size.width, this.size.height, ratio);
    this.presenter?.resize(this.size.width, this.size.height, ratio);
  }

  // The snapshot is built only when it will be sent: a change of state at once, the rest on the tick.
  private publish(force: boolean, now = 0): void {
    const isMoment = this.hasMomentChanged();

    if (force || isMoment || now - this.lastTickAt >= TICK_MS) {
      this.lastSnapshot = this.simulation.snapshot;
      this.lastTickAt = now;
      this.onChange(this.lastSnapshot);
      this.settleRun(this.lastSnapshot);
      this.publishEconomy(force);
    }
  }

  // A run that has ended is paid for its points, once.
  private settleRun(snapshot: VoyageSnapshot): void {
    if (snapshot.status === "over" && !this.isRunPaid && this.hangar) {
      this.isRunPaid = true;
      this.onNotice({ kind: "paid", coin: this.hangar.endRun(snapshot.score) });
    }
  }

  // Whether something the UI says at once has changed since the last look, read straight from the state.
  private hasMomentChanged(): boolean {
    const { state, world } = this.simulation;
    const last = this.moment;
    const landedOn = world.stores.ship.get(state.ship)?.landedOn ?? null;
    const waypoint = state.waypoint?.id ?? null;

    const isSalvaging = state.salvage !== null;

    if (last && last.status === state.status && last.phase === state.phase && last.universe === state.universe && last.universes === state.universes &&
      last.passing === state.passing && last.landedOn === landedOn && last.waypoint === waypoint && last.level === state.level &&
      last.faults === state.faults.length && last.isSalvaging === isSalvaging) {
      return false;
    }

    this.moment = {
      status: state.status,
      phase: state.phase,
      universe: state.universe,
      universes: state.universes,
      passing: state.passing,
      landedOn,
      waypoint,
      level: state.level,
      faults: state.faults.length,
      isSalvaging,
    };

    return true;
  }
}
