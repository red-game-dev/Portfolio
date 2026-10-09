import { FrameLoop, FrameScheduler, QualityGovernor } from "@/packages/animation/frame-loop";
import { Camera } from "@/packages/games/engine";
import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { CanvasGlobeRenderer, GlobeRenderer, WebGLGlobeRenderer } from "@/packages/graphics/globe";
import { LensingPresenter } from "@/packages/graphics/webgl";
import { RandomSource } from "@/packages/math/random";

import { DEFAULT_VOYAGE_THEME, resolveVoyageConfig, VoyageConfigOverrides, VoyageTheme } from "../config";
import { ModuleId } from "../domain/components";
import { StarSystem } from "../domain/content";
import { FlareClass, VoyageEvents } from "../domain/events";
import { VoyageInput } from "../domain/input";
import { VoyageSnapshot } from "../domain/snapshot";
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
  | { kind: "melting"; temperatureC: number };

export interface VoyageOptions {
  config?: VoyageConfigOverrides;
  random?: RandomSource;
  scheduler?: FrameScheduler;
  system?: StarSystem;
  // When the mission clock starts, for each run (ms since 1970); the real now unless a host says otherwise.
  now?: () => number;
  // What to call each place on the system map, by id.
  labels?: Record<string, string>;
  onChange?: (snapshot: VoyageSnapshot) => void;
  onNotice?: (notice: VoyageNotice) => void;
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
// How far the player can zoom out and in, against the camera's own choice.
const ZOOM_RANGE: [number, number] = [0.3, 3];

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

  public static forCanvas({ back, front, lens, globe }: VoyageCanvases, options: VoyageCanvasOptions = {}): VoyageGame {
    const config = resolveVoyageConfig(options.config);
    const theme = { ...DEFAULT_VOYAGE_THEME, ...options.theme };
    const system = options.system ?? new SystemService(new SolarSystemSource(), config.layout).getView();
    const simulation = new VoyageSimulation(system, {
      config: { ...config, universes: theme.universes.length },
      random: options.random ?? Math.random,
      epochMs: (options.now ?? Date.now)(),
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
    ];

    return () => {
      detachRenderer();
      offs.forEach((off) => off());
    };
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
    }
  }

  // Whether something the UI says at once has changed since the last look, read straight from the state.
  private hasMomentChanged(): boolean {
    const { state, world } = this.simulation;
    const last = this.moment;
    const landedOn = world.stores.ship.get(state.ship)?.landedOn ?? null;
    const waypoint = state.waypoint?.id ?? null;

    if (last && last.status === state.status && last.phase === state.phase && last.universe === state.universe && last.universes === state.universes &&
      last.passing === state.passing && last.landedOn === landedOn && last.waypoint === waypoint) {
      return false;
    }

    this.moment = { status: state.status, phase: state.phase, universe: state.universe, universes: state.universes, passing: state.passing, landedOn, waypoint };

    return true;
  }
}
