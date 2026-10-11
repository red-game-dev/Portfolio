import { FrameLoop, FrameScheduler, QualityGovernor } from "@/packages/animation/frame-loop";
import { Camera } from "@/packages/games/engine";
import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { CanvasGlobeRenderer, GlobeRenderer, WebGLGlobeRenderer } from "@/packages/graphics/globe";
import { LensingPresenter } from "@/packages/graphics/webgl";
import { RandomSource } from "@/packages/math/random";

import { CareerView } from "../career/domain/career";
import { Career } from "../career/services/Career";
import { DEFAULT_VOYAGE_THEME, resolveVoyageConfig, VoyageConfigOverrides, VoyageTheme } from "../config";
import { StarSystem } from "../domain/content";
import { VoyageEvents } from "../domain/events";
import { ShipEffect } from "../domain/faults";
import { GhostRun } from "../domain/ghost";
import { LandingOptions, SpaceDrag, VoyageInput } from "../domain/input";
import { VoyageAction, VoyageNotice } from "../domain/notices";
import { VoyageSnapshot } from "../domain/snapshot";
import { AimMode, Difficulty } from "../domain/state";
import { HomePad } from "../domain/surface";
import { UniverseNames } from "../domain/universe";
import { markOf, TIERS, tierOf } from "../economy/config/tiers";
import { CatalogLootTable } from "../economy/core/CatalogLootTable";
import { EconomyView, ShipStatus, Suggestion } from "../economy/domain/economy";
import { Hangar } from "../economy/services/Hangar";
import { dismantleValue, forgeCost, weaponPlan } from "../gear/config/forge";
import { GRADE_LEVEL } from "../gear/config/slots";
import { ArmoryView, ProgressView } from "../gear/domain/view";
import { Armory } from "../gear/services/Armory";
import { baseOf, ENHANCE_LADDER, weaponBaseId } from "../gear/utils/gear";
import { configForShip } from "../gear/utils/ship";
import { armoryView, progressView } from "../gear/utils/view";
import { DEFAULT_PAINT, DEFAULT_TRAIL, PAINTS, TRAILS } from "../progress/config/cosmetics";
import { Progress } from "../progress/services/Progress";
import { CanvasVoyageRenderer, VoyageRenderer } from "../renderers/CanvasVoyageRenderer";
import { lerpX, lerpY, universeOf } from "../renderers/frame";
import { ShipLook } from "../renderers/look";
import { PadControl, PadIntent, PadPort } from "./PadControl";
import { SoundPort, Vibrate, VoyageFeedback } from "./VoyageFeedback";
import { paintHull } from "../renderers/paint/ships";
import { SHIP_HEIGHT, SHIP_WIDTH } from "../renderers/paint/space";
import { PilotLink } from "../services/PilotLink";
import { ProgressLink, RunSummary } from "../services/ProgressLink";
import { SystemService } from "../services/SystemService";
import { SolarSystemSource } from "../sources/SolarSystemSource";
import { dailyEpoch, dailySeed, dayKey } from "../utils/daily";
import { missionMarks } from "../utils/missions";
import { GhostRecorder, placeCode } from "./GhostRecorder";
import { VoyageSimulation } from "./VoyageSimulation";

export type { VoyageAction, VoyageNotice } from "../domain/notices";

// How long a kill holds the world still (ms): a moment for anyone, longer for a boss.
const HIT_STOP = { kill: 45, boss: 180 };

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
  // The pad at home where a new rocket waits once a crew is back.
  home?: HomePad | null;
  universeNames?: string[];
  syllables?: UniverseNames;
  onChange?: (snapshot: VoyageSnapshot) => void;
  onNotice?: (notice: VoyageNotice) => void;
  // The pilot's hangar, kept between runs: their ship's level, hold and money. Left out, there is no economy and
  // wrecks hold nothing.
  hangar?: Hangar;
  onEconomy?: (view: EconomyView) => void;
  // The pilot's armoury and progress: their gear, its levels and enhancement, the ammunition, the pilot's level,
  // stars, achievements and cosmetics; and where their views go as they change.
  armory?: Armory;
  progress?: Progress;
  onGear?: (view: ArmoryView) => void;
  onProgress?: (view: ProgressView) => void;
  // Sound and music, a buzz on a phone, and a controller (with where the buttons that work the page go).
  sound?: SoundPort | null;
  vibrate?: Vibrate | null;
  gamepad?: PadPort | null;
  onPadIntent?: (intent: PadIntent) => void;
  // The pilot's career: missions, rank, the codex and the daily voyage.
  career?: Career;
  onCareer?: (view: CareerView) => void;
  // The best run of today's daily voyage, flown beside the ship as a ghost; and where a better one is handed
  // to be kept.
  ghost?: GhostRun | null;
  onGhost?: (run: GhostRun) => void;
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
// Tilting aims the ship at a point this far ahead of it the way the device leans (world units).
const TILT_REACH = 3;

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

// Something a 2D canvas can draw: the canvases and images, not raw pixel data.
const isDrawable = (source: TexImageSource | CanvasImageSource | OffscreenCanvas): source is CanvasImageSource => !(source instanceof ImageData) &&
  !(typeof VideoFrame !== "undefined" && source instanceof VideoFrame);

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
  isOnSurface: boolean;
  // The phase of a way down, and whether a pilot flies it.
  descent: string | null;
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
  private isPressing = false;
  private zoomBias = 1;
  private keys = { turn: 0, thrust: 0, brake: false };
  // A phone or tablet tilted to steer: the way to fly on screen (x right, y down) and how hard, 0 to 1; null when
  // tilting does not steer.
  private tilt: { x: number; y: number } | null = null;
  // With the guns aimed by hand: a thumb stick's lean (a phone's left thumb), and the point on the screen the guns
  // aim at (the mouse, or a phone's right thumb).
  private stick: { x: number; y: number } | null = null;
  private aimPoint: { x: number; y: number } | null = null;
  // How long the world is held still after a kill (ms), and whether the reader asked for less motion.
  private hitStopMs = 0;
  private isReducedMotion = false;
  private readonly feedback: VoyageFeedback;
  private readonly pad: PadControl | null;
  private readonly onPadIntent: (intent: PadIntent) => void;
  // A controller's left stick, whether its trigger fires and its left trigger brakes, this frame.
  private padLean: { x: number; y: number } | null = null;
  private isPadFiring = false;
  private isPadBraking = false;
  private lastSnapshot: VoyageSnapshot;
  private lastTickAt = 0;
  private lastFrameAt = 0;
  private overSince: number | null = null;
  private size = { width: 0, height: 0 };
  private readonly hangar: Hangar | null;
  private readonly career: Career | null;
  private readonly link: PilotLink | null;
  private readonly onEconomy: (view: EconomyView) => void;
  private readonly armory: Armory | null;
  private readonly progress: Progress | null;
  private readonly progressLink: ProgressLink | null;
  private readonly onGear: (view: ArmoryView) => void;
  private readonly onProgress: (view: ProgressView) => void;
  private readonly onCareer: (view: CareerView) => void;
  private readonly onGhost: (run: GhostRun) => void;
  private readonly recorder = new GhostRecorder();
  private readonly frontCanvas: CanvasImageSource | null;
  private readonly lensCanvas: HTMLCanvasElement | OffscreenCanvas | null;
  private ghost: GhostRun | null;
  private isGhostKept = false;
  private isPhoto = false;
  private wasRunningBeforePhoto = false;
  private lastSuggestion: Suggestion | null | undefined = undefined;
  private devicePixelRatio = 1;
  private readonly governor: QualityGovernor;
  private moment: Moment | null = null;

  constructor(simulation: VoyageSimulation, renderer: VoyageRenderer, presenter: LensingPresenter | null, backCanvas: TexImageSource | null, theme: VoyageTheme,
    options: VoyageOptions = {}, canvases: { front: CanvasImageSource | null; lens: HTMLCanvasElement | OffscreenCanvas | null } = { front: null, lens: null }) {
    super({ framesPerSecond: simulation.config.framesPerSecond, maxStepMs: 100, scheduler: options.scheduler });
    this.simulation = simulation;
    this.renderer = renderer;
    renderer.setHome(options.home ?? null);
    this.presenter = presenter;
    this.backCanvas = backCanvas;
    this.theme = theme;
    this.onChange = options.onChange ?? (() => undefined);
    const onNotice = options.onNotice ?? (() => undefined);

    // Every notice is heard too: a level, an achievement, stars, an enhancement each have their sound.
    this.onNotice = (notice) => {
      this.feedback.notice(notice);
      onNotice(notice);
    };
    this.now = options.now ?? (() => Date.now());
    this.hangar = options.hangar ?? null;
    this.career = options.career ?? null;
    this.onEconomy = options.onEconomy ?? (() => undefined);
    this.armory = options.armory ?? null;
    this.progress = options.progress ?? null;
    this.onGear = options.onGear ?? (() => undefined);
    this.onProgress = options.onProgress ?? (() => undefined);
    this.feedback = new VoyageFeedback(simulation, options.sound ?? null, options.vibrate ?? null);
    this.pad = options.gamepad ? new PadControl(options.gamepad) : null;
    this.onPadIntent = options.onPadIntent ?? (() => undefined);
    this.onCareer = options.onCareer ?? (() => undefined);
    this.onGhost = options.onGhost ?? (() => undefined);
    this.ghost = options.ghost ?? null;
    this.frontCanvas = canvases.front;
    this.lensCanvas = canvases.lens;
    const { armory, progress } = this;
    const hangar = this.hangar;
    const progressLink = hangar && armory && progress ? new ProgressLink({
      simulation,
      hangar,
      armory,
      progress,
      notify: (notice) => this.onNotice(notice),
      refresh: () => this.publishEconomy(true),
      refit: () => this.link?.refitShip(),
    }) : null;

    this.progressLink = progressLink;
    this.link = hangar ? new PilotLink({
      simulation,
      hangar,
      career: this.career,
      nameOf: (id) => this.nameOf(id),
      notify: (notice) => this.onNotice(notice),
      refresh: () => this.publishEconomy(true),
      // With an armoury and a pilot's level, the ship flies with its fittings and grows with its pilot.
      shipConfig: armory && progress ? (base, level) => configForShip(base, level, armory.stats(), progress.level) : undefined,
      onDeed: (deed) => progressLink?.deed(deed),
      onMission: (xp) => progressLink?.mission(xp),
    }) : null;
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

  public get careerView(): CareerView | null {
    return this.career?.view() ?? null;
  }

  public get gearView(): ArmoryView | null {
    return this.hangar && this.armory && this.progress ? armoryView(this.armory, this.hangar, this.progress) : null;
  }

  public get progressView(): ProgressView | null {
    return this.progress ? progressView(this.progress) : null;
  }

  // What the last run came to, once it is over.
  public get runSummary(): RunSummary | null {
    return this.progressLink?.summary ?? null;
  }

  // The guided first flight sets a coin or a boost's core just ahead of the ship to show the pilot.
  public guideSpawn(kind: "coin" | "boost"): void {
    if (this.simulation.state.status === "flying") {
      this.simulation.spawnAhead(kind);
    }
  }

  // The ship as it looks now (its hull and mark, paint and fitted pieces), drawn nose up to fill a canvas, for the
  // ship's sheet.
  public drawShipPreview(context: Canvas2DContext, width: number, height: number): void {
    const level = this.hangar?.level ?? 0;
    const { paint, extras } = this.look();
    const accent = this.theme.danger;
    const colours = paint ? { hull: paint.hull, hullShade: paint.hullShade, window: paint.window, fin: paint.fin, accent: paint.accent ?? accent }
      : { ...this.theme, accent };
    const size = Math.min(width / SHIP_WIDTH, height / SHIP_HEIGHT);

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate((width - size * SHIP_WIDTH) / 2, (height - size * SHIP_HEIGHT) / 2);
    paintHull(tierOf(level), markOf(level), colours, extras)(context, size * SHIP_WIDTH, size * SHIP_HEIGHT);
    context.restore();
  }

  // Whether the view is held still to be looked round and saved as a picture.
  public get isPhotoMode(): boolean {
    return this.isPhoto;
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

    return new VoyageGame(simulation, new CanvasVoyageRenderer(back, front, theme, globes, options.labels ?? {}), presenter, back.canvas, theme, options, {
      front: front.canvas,
      lens: lens ?? null,
    });
  }

  // A real map for a body's surface (an id from `TEXTURE_IDS`), as it arrives.
  public setTexture(id: string, image: TexImageSource): void {
    this.renderer.setTexture(id, image);
  }

  // Zooms the view by a factor, within the player's range; held still in photo mode, at once.
  public zoomBy(factor: number): void {
    this.zoomBias = Math.max(ZOOM_RANGE[0], Math.min(ZOOM_RANGE[1], this.zoomBias * factor));

    if (this.isPhoto) {
      this.camera.zoom = Math.max(ZOOM_RANGE[0] * 0.5, Math.min(ZOOM_RANGE[1] * 1.5, this.camera.zoom * factor));
      this.updateView();
      this.drawFrame(performance.now(), 0);
    }
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

  // A new run from Earth: a free one at the real now, or today's daily voyage, the same for everyone today, with
  // the best run of it so far flying beside the ship.
  public play(mode: "free" | "daily" = "free"): void {
    const day = dayKey(this.now());

    this.setPhotoMode(false);
    const isDaily = mode === "daily";

    this.simulation.start(isDaily ? dailyEpoch(day) : this.now(), isDaily ? { day, seed: dailySeed(day) } : null);
    this.link?.startRun();
    this.progressLink?.startRun();
    this.recorder.reset();
    this.isGhostKept = false;
    this.renderer.setGhost(isDaily && this.ghost?.day === day ? this.ghost : null);
    this.zoomBias = 1;
    this.renderer.reset();
    this.followShip(1, true);
    this.publish(true);
    this.start();
  }

  public pause(): void {
    this.stop();
    this.feedback.pause();
  }

  public resume(): void {
    // Held still for a photo, it goes on only when photo mode ends.
    if (this.isPhoto) {
      this.wasRunningBeforePhoto = this.simulation.state.status === "flying";

      return;
    }

    if (this.simulation.state.status === "flying") {
      this.lastFrameAt = 0;
      this.start();
      this.feedback.resume();
    }
  }

  // Pointer at x, y on the canvas (CSS pixels), or null when it leaves or the finger lifts.
  // The pointer on the screen (CSS pixels), or null when it leaves or the finger lifts: where to fly, or with the
  // guns aimed by hand, where they aim.
  public point(position: { x: number; y: number } | null): void {
    if (this.simulation.state.aimMode === "manual") {
      this.aimPoint = position;
    } else {
      this.pointer = position;
    }
  }

  // A mouse button or a finger held down: while coming down, the burn (the pilot's on the landing engine, or one
  // that aborts the landing under fire); with the guns aimed by hand, the trigger too.
  public press(isDown: boolean): void {
    this.isPressing = isDown;
  }

  // A thumb stick's lean, each axis -1 to 1 (down is positive y), or null when no thumb is on it.
  public setStick(stick: { x: number; y: number } | null): void {
    this.stick = stick;
  }

  // How the guns aim: by themselves, or by hand (the pointer aims, a press fires, and keys, a thumb stick or a tilt
  // fly the ship).
  public setAimMode(mode: AimMode): void {
    this.simulation.setAimMode(mode);
    this.pointer = null;
    this.aimPoint = null;
    this.stick = null;
  }

  public setDifficulty(difficulty: Difficulty): void {
    this.simulation.setDifficulty(difficulty);
  }

  // Sound and a buzz, given once the reader has touched the page (a browser plays nothing before) or changed in
  // their settings.
  public setSound(sound: SoundPort | null): void {
    this.feedback.setSound(sound);
  }

  public setVibrate(vibrate: Vibrate | null): void {
    this.feedback.setVibrate(vibrate);
  }

  // For a reader who asked for less motion: small shakes and no hit-stop.
  public setReducedMotion(isReduced: boolean): void {
    this.isReducedMotion = isReduced;
    this.renderer.setReducedMotion(isReduced);
  }

  // How the device is tilted, as the hook reads it, or null when tilting does not steer.
  public setTilt(tilt: { x: number; y: number } | null): void {
    this.tilt = tilt;
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
    this.feedback.dispose();
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
        this.link?.upgraded(level);
        this.progressLink?.upgraded(level);
        this.redraw();

        return true;
      }
      case "craft": {
        const isMade = hangar.craft(action.recipe);

        if (isMade) {
          this.link?.crafted();
          this.progressLink?.crafted();
        }

        return isMade;
      }
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
      // The bar works only while the run moves: not held still under the pause card, the map or the hangar.
      case "equip":
      case "unequip":
      case "enhance":
      case "dismantle":
      case "forge":
      case "wear":
      case "guide":
      case "skipGuide":
        return this.actOnPilot(action);
      case "slot":
        return isFlying && this.isRunning && this.useSlot(action.index);
      case "setSlot":
        return hangar.setSlot(action.index, action.slot);
      case "reset":
        if (isFlying) {
          return false;
        }

        hangar.reset();
        this.career?.replace({ xp: 0, active: [], done: [], contracts: 0, codex: [], daily: null });
        // A pilot starting over has no best run of the day to fly beside.
        this.ghost = null;
        this.renderer.setGhost(null);
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

  // Holds the view still to be looked round and saved as a picture, without the radar, the map or the arrows to
  // attackers; leaving it carries on from where it was.
  public setPhotoMode(isOn: boolean): void {
    if (isOn === this.isPhoto) {
      return;
    }

    this.isPhoto = isOn;

    if (isOn) {
      this.wasRunningBeforePhoto = this.isRunning;
      // Nothing steers while the view is held, nor towards where the pointer was after.
      this.pointer = null;
      this.stop();
    }

    this.renderer.setPhoto(isOn);

    if (!isOn && this.wasRunningBeforePhoto) {
      this.resume();
    } else {
      this.drawFrame(performance.now(), 0);
    }
  }

  // Moves the view by a drag (CSS pixels), in photo mode.
  public panBy(dx: number, dy: number): void {
    if (!this.isPhoto) {
      return;
    }

    this.camera.jumpTo(this.camera.x - dx / this.camera.scale, this.camera.y - dy / this.camera.scale);
    this.updateView();
    this.drawFrame(performance.now(), 0);
  }

  // Draws the view as it is now into `target`, every canvas in order (the back, the GPU lens, the front), at the
  // size of the target: the picture photo mode saves.
  public photo(target: Canvas2DContext, width: number, height: number): void {
    this.drawFrame(performance.now(), 0);

    [this.backCanvas, this.lensCanvas && "style" in this.lensCanvas && this.lensCanvas.style.visibility === "hidden" ? null : this.lensCanvas, this.frontCanvas]
      .forEach((layer) => {
        if (layer && isDrawable(layer)) {
          target.drawImage(layer, 0, 0, width, height);
        }
      });
  }

  // Whether the guns fire by themselves at what threatens the ship.
  public setAutoFire(isOn: boolean): void {
    this.simulation.setAutoFire(isOn);
    this.publish(true);
  }

  // How the pilot likes their landings, and how much space slows the ship, from their preferences.
  public setLanding(options: LandingOptions): void {
    this.simulation.setLanding(options);
  }

  public setSpaceDrag(drag: SpaceDrag): void {
    this.simulation.setSpaceDrag(drag);
  }


  protected update(deltaMs: number): void {
    // A kill holds the world still for a few frames, so the hit is felt; the view keeps drawing.
    if (this.hitStopMs > 0) {
      this.hitStopMs = Math.max(0, this.hitStopMs - deltaMs);
      this.followShip(deltaMs / 1000, false);

      return;
    }

    this.readPad();
    this.simulation.advance(deltaMs, this.input());
    this.feedback.frame();
    this.readGround();
    this.recordGhost();
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

  // What a slot of the bar holds, used: a thing from the hold as if used from it, or a boost set off at its level,
  // which spends a charge only once the simulation has taken it (not while it cools down or cannot work here).
  private useSlot(index: number): boolean {
    const { hangar, simulation } = this;
    const slot = hangar?.slot(index) ?? null;

    if (!hangar || !slot) {
      return false;
    }

    if (slot.kind === "weapon") {
      return this.fireSlot(slot);
    }

    if (slot.kind === "item") {
      const isUsed = this.act({ kind: "use", item: slot.id });

      if (!isUsed) {
        this.onNotice({ kind: "slotRefused", slot, reason: hangar.count(slot.id) > 0 ? "unneeded" : "empty", seconds: 0 });
      }

      return isUsed;
    }

    const { state } = simulation;
    const seconds = Math.max(0, ((state.boostReady[slot.id] ?? 0) - state.elapsedMs) / 1000);

    if (hangar.boostCharges(slot.id) <= 0 || !simulation.boost(slot.id, hangar.boostLevel(slot.id))) {
      const reason = hangar.boostCharges(slot.id) <= 0 ? "empty" : seconds > 0 ? "cooling" : "unable";

      this.onNotice({ kind: "slotRefused", slot, reason, seconds });

      return false;
    }

    hangar.spendBoost(slot.id);
    this.publish(true);

    return true;
  }

  // A controller, read once a frame: its left stick flies (as a thumb stick does), its right stick aims by hand,
  // its trigger fires, its left trigger brakes; the face buttons and shoulders use the bar, and the rest go to the
  // page (pause, the map, the hangar, a photo, holding fire).
  private readPad(): void {
    const reading = this.pad?.read(this.shipScreen()) ?? null;

    this.padLean = reading?.lean ? { ...reading.lean } : null;
    this.isPadFiring = reading?.isFiring ?? false;
    this.isPadBraking = reading?.isBraking ?? false;

    if (!reading) {
      return;
    }

    if (reading.aim && this.simulation.state.aimMode === "manual") {
      this.aimPoint = { ...reading.aim };
    }

    reading.pressed.forEach((intent) => {
      const slot = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"].indexOf(intent);

      if (slot >= 0) {
        this.act({ kind: "slot", index: slot });
      } else {
        this.onPadIntent(intent);
      }
    });
  }

  // How the pilot's ship looks: the paint and trail they wear (the first of each keeps the theme's look) and the
  // pieces fitted that show on the hull.
  private look(): ShipLook {
    const { armory, progress } = this;
    const paint = progress && progress.paint !== DEFAULT_PAINT ? PAINTS.find((spec) => spec.id === progress.paint) ?? null : null;
    const trail = progress && progress.trail !== DEFAULT_TRAIL ? TRAILS.find((spec) => spec.id === progress.trail) ?? null : null;

    return {
      paint,
      trail,
      extras: {
        pods: Boolean(armory?.fitted("pods")),
        reactor: Boolean(armory?.fitted("reactor")),
        drive: Boolean(armory?.fitted("drive")),
        halo: Boolean(armory?.fitted("halo")),
      },
    };
  }

  // What the pilot asks of the armoury and their progress: fitting, enhancing, breaking down, forging, wearing a
  // cosmetic, and the guided first flight.
  private actOnPilot(action: VoyageAction): boolean {
    const { hangar, armory, progress } = this;

    if (!hangar || !armory || !progress) {
      return false;
    }

    switch (action.kind) {
      case "equip":
        return armory.equip(action.uid, hangar.level, progress.level, (grade) => GRADE_LEVEL[grade] ?? 1);
      case "unequip":
        return armory.unequip(action.slot);
      case "enhance": {
        const piece = armory.piece(action.uid);
        const result = piece ? armory.enhance(action.uid, (cost) => hangar.pay(cost, "enhance", piece.base), Math.random, action.isProtected) : null;

        if (!piece || !result || result.outcome === "top") {
          return false;
        }

        this.onNotice({ kind: "enhanced", uid: piece.uid, base: piece.base, outcome: result.outcome, step: result.to, form: ENHANCE_LADDER.formOf(result.to) });
        this.progressLink?.enhanced(result.to);

        return true;
      }
      case "dismantle": {
        const index = hangar.view().bar.findIndex((row) => row.slot?.kind === "weapon" && row.slot.id === action.uid);
        const piece = armory.dismantle(action.uid);
        const base = piece ? baseOf(piece.base) : null;

        if (!piece || !base) {
          return false;
        }

        if (index >= 0) {
          hangar.setSlot(index, null);
        }

        hangar.credit(dismantleValue(base.grade, piece.rarity, piece.enhance), piece.base);

        return true;
      }
      case "forge": {
        const cost = forgeCost(action.grade);
        const isAllowed = hangar.knows(weaponPlan(action.weapon)) && progress.level >= cost.pilotLevel && action.grade <= TIERS.indexOf(tierOf(hangar.level));
        const base = weaponBaseId(action.weapon, action.grade);

        if (!isAllowed || !hangar.pay(cost, "forge", base)) {
          return false;
        }

        const piece = armory.add({ base, rarity: "common" });

        this.onNotice({ kind: "loot", gear: piece ? [{ base, rarity: "common" }] : [], ammo: {} });

        return piece !== null;
      }
      case "wear":
        return progress.choose(action.cosmetic, action.id);
      case "guide":
        progress.guideTo(action.step);

        return true;
      case "skipGuide":
        progress.finishGuide();

        return true;
      default:
        return false;
    }
  }

  // A weapon on the bar fired: where the pointer aims, by hand, or at what the guns choose; when it does not fire,
  // the pilot is told why.
  private fireSlot(slot: { kind: "weapon"; id: string }): boolean {
    const { simulation } = this;
    const point = simulation.state.aimMode === "manual" && this.aimPoint
      ? { x: this.camera.toWorldX(this.aimPoint.x), y: this.camera.toWorldY(this.aimPoint.y) }
      : null;
    const outcome = simulation.fireWeapon(slot.id, point);

    if (outcome === "fired") {
      return true;
    }

    const seconds = Math.max(0, ((simulation.state.weaponReady[slot.id] ?? 0) - simulation.state.elapsedMs) / 1000);

    this.onNotice({ kind: "slotRefused", slot, reason: outcome, seconds, base: this.armory?.piece(slot.id)?.base ?? null });

    return false;
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
    const descent = this.simulation.state.descent;
    const isManual = this.simulation.state.aimMode === "manual";
    // By hand, the guns aim where the pointer is and fire while it is pressed.
    const target = isManual && this.aimPoint ? { x: this.camera.toWorldX(this.aimPoint.x), y: this.camera.toWorldY(this.aimPoint.y) } : null;
    const fire = isManual && (this.isPressing || this.isPadFiring) && target !== null;

    // Coming down, a burn (the pilot's on the landing engine, or one that aborts the landing under fire) is the burn
    // key or a held press, never where a mouse happens to rest or a phone happens to lean; so is the burn that
    // launches the new rocket from the pad after a homecoming, which also stays pointed straight up.
    if (descent?.downAt === null || this.simulation.state.homecoming) {
      return { aim: null, thrust: Math.max(this.keys.thrust, this.isPressing ? 1 : 0), turn: 0, brake: false, target: null, fire: false };
    }

    const parts = this.shipScreen();
    const isKeyed = this.keys.turn !== 0 || this.keys.thrust !== 0 || this.keys.brake;
    const lean = !isKeyed ? this.stick ?? this.padLean ?? this.tilt : null;

    // A thumb stick or a tilt steers: towards the way it leans, as hard as it leans, unless keys are flying it. A
    // finger on the screen still locks the guns (or aims them, by hand) but no longer steers.
    if (lean) {
      const strength = Math.min(1, Math.hypot(lean.x, lean.y));
      const body = this.simulation.world.stores.body.get(this.simulation.state.ship);

      return {
        aim: body && strength > 0 ? { x: body.x + (lean.x / strength) * TILT_REACH, y: body.y + (lean.y / strength) * TILT_REACH } : null,
        thrust: strength,
        turn: 0,
        brake: this.isPadBraking,
        target,
        fire,
      };
    }

    if (!isManual && this.pointer && parts) {
      const distance = Math.hypot(this.pointer.x - parts.x, this.pointer.y - parts.y);
      const full = Math.min(this.size.width, this.size.height) * FULL_THRUST_SHARE;

      return {
        aim: { x: this.camera.toWorldX(this.pointer.x), y: this.camera.toWorldY(this.pointer.y) },
        thrust: Math.max(0, Math.min(1, (distance - DEADZONE) / full)),
        turn: 0,
        brake: false,
        target: null,
        fire: false,
      };
    }

    return { aim: null, thrust: this.keys.thrust, turn: this.keys.turn, brake: this.keys.brake, target, fire };
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

    const x = lerpX(body, alpha);
    const y = lerpY(body, alpha);
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
      tell("landed", ({ body, speed }) => ({ kind: "landed", body: this.nameOf(body), speed })),
      tell("descending", ({ body, phase }) => ({ kind: "descent", body: this.nameOf(body), phase })),
      tell("hardLanding", ({ body, speed, safe }) => ({ kind: "hardLanding", body: this.nameOf(body), speed, safe })),
      tell("tookOff", ({ body }) => ({ kind: "tookOff", body: this.nameOf(body) })),
      tell("recovered", ({ body, days }) => ({ kind: "recovered", body, days })),
      tell("stranded", ({ body, seconds, isRescue, isOver }) => ({ kind: "stranded", body: body ? this.nameOf(body) : null, seconds, isRescue, isOver })),
      tell("rescued", ({ from, days }) => ({ kind: "rescued", from: from ? this.nameOf(from) : null, days })),
      tell("emergency", ({ body }) => ({ kind: "emergency", body })),
      tell("captured", ({ isSingularity }) => ({ kind: "captured", isSingularity })),
      tell("destroyed", () => ({ kind: "destroyed" })),
      tell("flare", ({ class: flareClass, isHeading }) => ({ kind: "flare", flareClass, isHeading })),
      tell("storm", ({ isTurned }) => ({ kind: "storm", isTurned })),
      tell("failing", ({ module, isGone }) => ({ kind: "failing", module, isGone })),
      tell("melting", ({ temperatureC }) => ({ kind: "melting", temperatureC })),
      tell("impactAlert", ({ target, diameterKm, seconds }) => ({ kind: "impactAlert", target: this.nameOf(target), diameterKm, seconds })),
      tell("impact", ({ target, outcome, craterKm }) => ({ kind: "impact", target: this.nameOf(target), outcome, craterKm })),
      tell("impactorBroken", ({ target }) => ({ kind: "impactorBroken", target: this.nameOf(target) })),
      tell("deflected", ({ target }) => ({ kind: "deflected", target: this.nameOf(target) })),
      tell("boss", ({ name, isFallen }) => ({ kind: "boss", name, isFallen })),
      tell("heard", () => ({ kind: "heard" })),
      tell("wormhole", () => ({ kind: "wormhole" })),
      tell("gate", ({ name, isNew, isExit, isDeadEnd }) => ({ kind: "gate", system: name, isNew, isExit, isDeadEnd })),
      tell("hosted", ({ body, faction }) => ({ kind: "hosted", body: this.nameOf(body), faction })),
      tell("groundFire", ({ body, faction }) => ({ kind: "groundFire", body: this.nameOf(body), faction })),
      tell("supernova", ({ seconds, isBlown }) => ({ kind: "supernova", seconds, isBlown })),
      tell("burst", ({ seconds, isFired }) => ({ kind: "burst", seconds, isFired })),
      tell("fault", ({ kind }) => ({ kind: "fault", fault: kind })),
      tell("fixed", ({ kind }) => ({ kind: "fixed", fault: kind })),
    ];

    if (this.link) {
      offs.push(this.link.attach());
    }

    if (this.progressLink) {
      offs.push(this.progressLink.attach());
    }

    // A kill is felt: the world holds still for a few frames, longer for a boss, and a controller rumbles.
    offs.push(events.on("downed", ({ role }) => {
      if (!this.isReducedMotion) {
        this.hitStopMs = Math.max(this.hitStopMs, role === "boss" ? HIT_STOP.boss : HIT_STOP.kill);
      }

      this.pad?.rumble(role === "boss" ? 0.9 : 0.35, role === "boss" ? 420 : 120);
    }));
    offs.push(events.on("hit", ({ amount }) => this.pad?.rumble(Math.min(1, 0.25 + amount / 400), 140)));
    offs.push(this.feedback.attach());

    // The ship wears the pilot's paint, trail and fitted pieces, and changes with them.
    this.renderer.setLook(this.look());

    if (this.armory) {
      offs.push(this.armory.subscribe(() => this.renderer.setLook(this.look())));
    }

    if (this.progress) {
      offs.push(this.progress.subscribe(() => this.renderer.setLook(this.look())));
    }

    const { career } = this;

    if (career) {
      this.renderer.setMissions(missionMarks(career.view().missions));
      offs.push(career.subscribe(() => {
        const view = career.view();

        this.renderer.setMissions(missionMarks(view.missions));
        this.onCareer(view);
      }));
    }

    return () => {
      detachRenderer();
      offs.forEach((off) => off());
    };
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

    // The armoury and the pilot's progress go with the economy whenever anything changed.
    if (force) {
      const gear = this.gearView;
      const progress = this.progressView;

      if (gear) {
        this.onGear(gear);
      }

      if (progress) {
        this.onProgress(progress);
      }
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
      this.lastSnapshot = { ...this.simulation.snapshot, surface: this.renderer.surface };
      this.lastTickAt = now;
      this.onChange(this.lastSnapshot);
      this.link?.tick(this.lastSnapshot);
      this.progressLink?.tick(this.lastSnapshot);
      this.keepGhost(this.lastSnapshot);
      this.publishEconomy(force);
    }
  }

  // The surface the renderer reads at the spot tells the way down what it is coming down on: a capsule over the sea
  // at home splashes down.
  private readGround(): void {
    const { surface } = this.renderer;

    if (surface && this.simulation.state.descent?.downAt === null) {
      this.simulation.setGround(surface.body, surface.isHome && surface.biome === "ocean");
    }
  }

  // Where the ship is, a few times a second, on a daily voyage, to fly beside the next time.
  private recordGhost(): void {
    const { state, world } = this.simulation;
    const body = world.stores.body.get(state.ship);
    const ship = world.stores.ship.get(state.ship);

    if (state.daily && state.status === "flying" && body && ship) {
      this.recorder.sample(state.elapsedMs, body.x, body.y, ship.angle, placeCode(state.phase, state.universe));
    }
  }

  // A daily voyage that ended better than today's ghost becomes the ghost, once.
  private keepGhost(snapshot: VoyageSnapshot): void {
    const day = this.simulation.state.daily;

    if (snapshot.status !== "over" || !day || this.isGhostKept) {
      return;
    }

    this.isGhostKept = true;

    if (!this.ghost || this.ghost.day !== day || snapshot.score > this.ghost.score) {
      this.ghost = this.recorder.finish(day, snapshot.score);
      this.onGhost(this.ghost);
    }
  }

  // Whether something the UI says at once has changed since the last look, read straight from the state.
  private hasMomentChanged(): boolean {
    const { state, world } = this.simulation;
    const last = this.moment;
    const landedOn = world.stores.ship.get(state.ship)?.landedOn ?? null;
    const waypoint = state.waypoint?.id ?? null;

    const isSalvaging = state.salvage !== null;
    const isOnSurface = this.renderer.surface !== null;
    const craft = state.descent && state.descent.downAt === null ? state.descent.craft : null;
    const descent = craft ? `${craft.phase}:${craft.isPilot}` : null;

    if (last && last.descent === descent && last.isOnSurface === isOnSurface && last.status === state.status && last.phase === state.phase &&
      last.universe === state.universe &&
      last.universes === state.universes &&
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
      isOnSurface,
      descent,
    };

    return true;
  }
}
