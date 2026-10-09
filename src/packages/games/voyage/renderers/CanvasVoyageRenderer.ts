import { Camera, EventBus, RenderPipeline } from "@/packages/games/engine";
import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb } from "@/packages/graphics/colour";
import { CanvasGlobeRenderer, GlobeRenderer } from "@/packages/graphics/globe";
import type { LensSource } from "@/packages/graphics/webgl";
import { TAU } from "@/packages/math/angles";
import { clamp01, wrap } from "@/packages/math/clamp";

import { VoyageTheme } from "../config";
import { VoyageWorld } from "../core/world";
import { VoyageEvents } from "../domain/events";
import { GhostRun } from "../domain/ghost";
import { VoyageState } from "../domain/state";
import { SurfaceInfo } from "../domain/surface";
import { lerpX, lerpY, VoyageFrame } from "./frame";
import { AliensLayer } from "./layers/AliensLayer";
import { BackdropLayer } from "./layers/BackdropLayer";
import { EffectsLayer } from "./layers/EffectsLayer";
import { GhostLayer } from "./layers/GhostLayer";
import { GlobesLayer } from "./layers/GlobesLayer";
import { HolesLayer } from "./layers/HolesLayer";
import { RenderKit } from "./layers/kit";
import { MapLayer } from "./layers/MapLayer";
import { OverlayLayer } from "./layers/OverlayLayer";
import { PhenomenaLayer } from "./layers/PhenomenaLayer";
import { ProjectilesLayer } from "./layers/ProjectilesLayer";
import { ShipLayer } from "./layers/ShipLayer";
import { SurfaceLayer } from "./layers/SurfaceLayer";
import { ThingsLayer } from "./layers/ThingsLayer";
import { WeatherLayer } from "./layers/WeatherLayer";
import { WrecksLayer } from "./layers/WrecksLayer";
import { cutShards } from "./paint/damage";
import { paintGlow, paintShip, SHIP_HEIGHT, SHIP_WIDTH } from "./paint/space";
import { ParticleSystem } from "./ParticleSystem";
import { Surface } from "./Surface";
import { SurfaceCache } from "./SurfaceCache";

export interface VoyageRenderer {
  // Where the ship stands on a world, while it does.
  readonly surface: SurfaceInfo | null;
  resize(width: number, height: number, pixelRatio: number): void;
  draw(frame: VoyageFrame): void;
  // The black holes on screen, for the GPU lens.
  lenses(frame: VoyageFrame): LensSource[];
  attach(events: EventBus<VoyageEvents>, camera: Camera): () => void;
  reset(): void;
  setTexture(id: string, image: TexImageSource): void;
  setMap(isOpen: boolean): void;
  // How fine to draw, 0 the finest (see `QUALITY`).
  setQuality(level: number): void;
  // The ghost to fly beside the ship, or none.
  setGhost(run: GhostRun | null): void;
  // Photo mode: no radar, map, compass or arrows.
  setPhoto(isOn: boolean): void;
  dispose(): void;
}

// A map's own pixels, for reading the colour of the ground where the ship sets down.
type MapImage = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

const isMapImage = (image: TexImageSource): image is MapImage =>
  (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement) ||
  (typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement) ||
  (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) ||
  (typeof OffscreenCanvas !== "undefined" && image instanceof OffscreenCanvas);

const widthOf = (image: MapImage) => (image instanceof HTMLImageElement ? image.naturalWidth : image.width);

const heightOf = (image: MapImage) => (image instanceof HTMLImageElement ? image.naturalHeight : image.height);

// What each quality level keeps: the share of the particle budget, and the octaves of noise the GPU's globes sum.
const QUALITY = { particles: [1, 0.7, 0.45, 0.3], octaves: [5, 4, 3, 3] };

// The pixel ratio the 2D surfaces draw at, at most: past two the eye gains nothing and the GPU pays four times.
const MAX_PIXEL_RATIO = 2;

// Draws the voyage on two 2D surfaces, a lens between them on the GPU: the back holds what light bends round a
// black hole (the sky, the Sun and the planets the GPU draws as globes, the star's storms, the far side of a
// disk), the front what is close enough not to (the near side of a disk, rocks and comets, pickups, the ship,
// effects, the overlay, the radar and the map). Each part of the picture is its own layer. It hears the game's
// events to set off sparks, the breakup of the ship, shield flashes, a storm's static and the camera's shake.
export class CanvasVoyageRenderer implements VoyageRenderer {
  private readonly kit: RenderKit;
  private readonly backLayers: RenderPipeline<VoyageFrame>;
  private readonly frontLayers: RenderPipeline<VoyageFrame>;
  private readonly ship: ShipLayer;
  private readonly effects: EffectsLayer;
  private readonly light: EffectsLayer;
  private readonly overlay: OverlayLayer;
  private readonly map: MapLayer;
  private readonly ghost: GhostLayer;
  private readonly globesLayer: GlobesLayer;
  private readonly surfaceLayer: SurfaceLayer;
  private readonly maps = new Map<string, MapImage>();
  private sampler: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private isPhoto = false;
  private lastState: Readonly<VoyageState> | null = null;
  private lastWorld: VoyageWorld | null = null;
  private quality = 0;

  constructor(back: Canvas2DContext, front: Canvas2DContext, theme: VoyageTheme, globes: GlobeRenderer, labels: Record<string, string> = {}) {
    this.kit = new RenderKit(new Surface(back), new Surface(front), new SurfaceCache(), new ParticleSystem(), theme, globes, labels);
    this.ship = new ShipLayer(this.kit);
    this.effects = new EffectsLayer(this.kit, "behind");
    this.light = new EffectsLayer(this.kit, "front");
    this.overlay = new OverlayLayer(this.kit);
    this.map = new MapLayer(this.kit);
    this.ghost = new GhostLayer(this.kit);
    this.globesLayer = new GlobesLayer(this.kit);
    this.surfaceLayer = new SurfaceLayer(this.kit, this.globesLayer, (texture, longitude, latitude, centre) => this.sampleMap(texture, longitude, latitude, centre));
    this.backLayers = new RenderPipeline([
      new BackdropLayer(this.kit),
      new PhenomenaLayer(this.kit),
      this.globesLayer,
      new WeatherLayer(this.kit),
      new HolesLayer(this.kit, "back"),
    ]);
    this.frontLayers = new RenderPipeline([
      new HolesLayer(this.kit, "front"),
      new ThingsLayer(this.kit),
      new WrecksLayer(this.kit),
      new AliensLayer(this.kit),
      new ProjectilesLayer(this.kit),
      this.effects,
      this.ghost,
      this.ship,
      this.light,
      this.surfaceLayer,
      this.overlay,
      this.map,
    ]);
  }

  public get surface(): SurfaceInfo | null {
    return this.surfaceLayer.info ? { ...this.surfaceLayer.info } : null;
  }

  public resize(width: number, height: number, pixelRatio: number): void {
    const ratio = Math.min(MAX_PIXEL_RATIO, pixelRatio);

    this.kit.back.resize(width, height, ratio);
    this.kit.front.resize(width, height, ratio);
    this.kit.globes.resize(width, height, ratio);
    this.kit.cache.clear();
  }

  public setTexture(id: string, image: TexImageSource): void {
    this.kit.globes.setTexture(id, image);

    if (isMapImage(image)) {
      this.maps.set(id, image);
    }
  }

  public setMap(isOpen: boolean): void {
    this.map.isOpen = isOpen;
  }

  public setQuality(level: number): void {
    const index = Math.max(0, Math.min(QUALITY.particles.length - 1, level));

    this.quality = index;
    this.kit.particles.setBudget(QUALITY.particles[index]);
    this.kit.globes.setDetail(QUALITY.octaves[index]);
  }

  public setGhost(run: GhostRun | null): void {
    this.ghost.run = run;
  }

  public setPhoto(isOn: boolean): void {
    this.isPhoto = isOn;
    this.map.isHidden = isOn;
  }

  public dispose(): void {
    this.kit.globes.dispose();
    this.kit.cache.clear();
  }

  public draw(frame: VoyageFrame): void {
    // A lost GPU context (a phone under memory pressure, a backgrounded tab) leaves the planets to the 2D
    // fallback rather than undrawn.
    if (this.kit.globes.isGpu && !this.kit.globes.available) {
      this.kit.globes = new CanvasGlobeRenderer();
      this.setQuality(this.quality);
    }

    this.lastState = frame.state;
    this.lastWorld = frame.world;
    // On a world's surface its view covers space: the GPU's globes, the radar and the guides rest.
    this.globesLayer.isHidden = this.surfaceLayer.isCovering;
    this.map.hidesRadar = this.surfaceLayer.isShown;
    this.overlay.showsGuides = !this.isPhoto && !this.surfaceLayer.isShown;
    this.backLayers.draw(frame);
    this.kit.front.clear();
    this.frontLayers.draw(frame);
    this.kit.back.reset();
    this.kit.front.reset();
  }

  public lenses({ world, state, camera, alpha }: VoyageFrame): LensSource[] {
    if (state.phase === "lost") {
      return [];
    }

    const lenses: LensSource[] = [];

    world.stores.hole.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);
      const hole = world.stores.hole.values[index];

      if (!body || !camera.sees(body.x, body.y, hole.horizon * 4)) {
        return;
      }

      const shadow = hole.horizon * camera.scale;
      const falling = state.capture?.hole === entity ? state.capture.progress : 0;

      lenses.push({ x: camera.toScreenX(lerpX(body, alpha)), y: camera.toScreenY(lerpY(body, alpha)), shadow, einstein: shadow * (1.35 + falling * 1.6) });
    });

    return lenses;
  }

  public attach(events: EventBus<VoyageEvents>, camera: Camera): () => void {
    const { particles, theme } = this.kit;
    const offs = [
      events.on("hit", ({ x, y, angle, amount, toShields, toHull }) => {
        const colour = toHull > 0 ? theme.flameEdge : theme.shield;
        const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));
        const count = Math.min(26, 6 + Math.round(amount / 12));

        for (let index = 0; index < count; index += 1) {
          const spread = angle + Math.PI + (Math.random() - 0.5) * 2.2;
          const speed = 0.6 + Math.random() * 1.8;

          particles.emit("glow", x, y, Math.cos(spread) * speed, Math.sin(spread) * speed, 0.25 + Math.random() * 0.4, 0.03 + Math.random() * 0.04, glow, { drag: 3 });
        }

        if (toShields > 0) {
          this.ship.flashShield(angle);
        }

        camera.addTrauma(Math.min(0.6, amount / 500));
      }),
      events.on("destroyed", ({ x, y, vx, vy, angle }) => this.breakUp(x, y, vx, vy, angle, camera)),
      events.on("collected", ({ x, y, kind }) => {
        const colour = kind === "fuel" ? "#62ffc8" : kind === "shield" ? theme.shield : kind === "repair" ? "#ff8fa3" : "#ffd76a";
        const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

        for (let index = 0; index < 14; index += 1) {
          const spread = (index / 14) * TAU;

          particles.emit("glow", x, y, Math.cos(spread) * 0.9, Math.sin(spread) * 0.9, 0.45, 0.05, glow, { drag: 3 });
        }
      }),
      events.on("landed", () => camera.addTrauma(0.15)),
      events.on("emergency", () => {
        this.overlay.flashScreen("#ffffff", 0.8);
        camera.addTrauma(0.7);
      }),
      events.on("captured", () => camera.addTrauma(0.3)),
      events.on("storm", ({ strength }) => {
        this.ship.flashShield(Math.random() * TAU);
        this.overlay.flashScreen("#ffb070", 0.25 + strength * 0.5);
        camera.addTrauma(0.15 + strength * 0.3);
      }),
      events.on("fired", ({ x, y, angle, team }) => {
        const colour = team === "ship" ? "rgba(255, 220, 140, 1)" : "rgba(255, 120, 100, 1)";
        const flash = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

        particles.emit("glow", x, y, Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0.08, 0.05, flash, { drag: 4 });
      }),
      events.on("struck", ({ x, y, toShields }) => this.sparks(x, y, toShields > 0 ? 5 : 8, toShields > 0 ? theme.shield : theme.flameEdge)),
      events.on("downed", ({ x, y, role }) => {
        const big = role === "boss" ? 3 : role === "whale" ? 2.4 : 1;

        this.blast(x, y, 0.12 * big, camera, big > 1 ? 0.7 : 0.25);
      }),
      events.on("shattered", ({ x, y, radius }) => this.debris(x, y, radius, 10)),
      events.on("impactorBroken", ({ x, y }) => {
        this.blast(x, y, 0.15, camera, 0.3);
        this.debris(x, y, 0.12, 16);
      }),
      events.on("impact", ({ x, y, outcome }) => {
        const scale = outcome === "shattered" ? 6 : outcome === "catastrophe" ? 3 : outcome === "airburst" ? 0.8 : 1.4;

        this.blast(x, y, 0.15 * scale, camera, Math.min(1, 0.2 * scale));
        this.overlay.flashScreen("#fff1d6", Math.min(1, 0.15 * scale));

        if (outcome !== "airburst") {
          this.debris(x, y, 0.1 * scale, Math.round(12 * scale));
        }
      }),
      events.on("supernova", ({ isBlown }) => {
        if (isBlown) {
          this.overlay.flashScreen("#ffffff", 1);
          camera.addTrauma(0.8);
        }
      }),
      events.on("burst", ({ isFired }) => {
        if (isFired) {
          this.overlay.flashScreen("#e8d8ff", 0.9);
          camera.addTrauma(0.5);
        }
      }),
      events.on("heard", () => this.overlay.flashScreen("#ff2030", 0.35)),
      events.on("wormhole", () => {
        this.overlay.flashScreen("#9ad8ff", 0.8);
        camera.addTrauma(0.4);
      }),
      events.on("boss", ({ isFallen }) => camera.addTrauma(isFallen ? 0.9 : 0.4)),
      events.on("salvaged", ({ x, y, loot }) => {
        const colour = loot.items.length > 0 || loot.blueprints.length > 0 ? "#ffd76a" : "#8a92a8";
        const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

        for (let index = 0; index < 18; index += 1) {
          const spread = (index / 18) * TAU;

          particles.emit("glow", x, y, Math.cos(spread) * 0.7, Math.sin(spread) * 0.7, 0.6, 0.05, glow, { drag: 2.5 });
        }
      }),
      events.on("fault", () => {
        const state = this.lastState;
        const body = state && this.lastWorld ? this.lastWorld.stores.body.get(state.ship) : undefined;

        if (body) {
          this.sparks(body.x, body.y, 14);
        }

        camera.addTrauma(0.2);
      }),
      events.on("failing", ({ isGone }) => {
        const state = this.lastState;
        const body = state && this.lastWorld ? this.lastWorld.stores.body.get(state.ship) : undefined;

        if (body) {
          this.sparks(body.x, body.y, isGone ? 24 : 12);
        }

        camera.addTrauma(isGone ? 0.35 : 0.15);
      }),
    ];

    return () => offs.forEach((off) => off());
  }

  public reset(): void {
    this.effects.clear();
    this.light.clear();
  }

  // A fireball and a ring of shock, as something is destroyed or something strikes.
  // The colour of a map at a spot (degrees), averaged over a few of its pixels, or null with no map yet: drawn
  // into one pixel of a small canvas made once.
  private sampleMap(texture: string, longitude: number, latitude: number, centreLongitude: number): Rgb | null {
    const image = this.maps.get(texture);

    if (!image) {
      return null;
    }

    if (!this.sampler) {
      this.sampler = typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(1, 1).getContext("2d", { willReadFrequently: true })
        : document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    }

    const width = widthOf(image);
    const height = heightOf(image);

    if (!this.sampler || width <= 0 || height <= 0) {
      return null;
    }

    const across = wrap((longitude - (centreLongitude - 180)) / 360, 1);
    const down = clamp01(0.5 - latitude / 180);

    try {
      this.sampler.clearRect(0, 0, 1, 1);
      this.sampler.drawImage(image, Math.max(0, across * width - 2), Math.max(0, down * height - 2), 4, 4, 0, 0, 1, 1);

      const [red, green, blue] = this.sampler.getImageData(0, 0, 1, 1).data;

      return [red, green, blue];
    } catch {
      return null;
    }
  }

  private blast(x: number, y: number, radius: number, camera: Camera, trauma: number): void {
    const { particles } = this.kit;
    const fire = this.kit.cache.get("fire", 64, 64, paintGlow("rgba(255, 120, 40, 1)"));
    const white = this.kit.cache.get("glow:#ffffff", 64, 64, paintGlow("#ffffff"));
    const smoke = this.kit.cache.get("smoke", 64, 64, paintGlow("rgba(70, 70, 78, 0.9)"));

    this.light.shockwave(x, y, radius * 30, 0.9);
    particles.emit("glow", x, y, 0, 0, 0.5, radius * 5, white, { grow: -radius * 4, drag: 1 });

    for (let index = 0; index < 18; index += 1) {
      const angle = Math.random() * TAU;
      const speed = 0.3 + Math.random() * 1.6;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      particles.emit("glow", x, y, vx, vy, 0.4 + Math.random() * 0.5, radius * (1 + Math.random() * 1.5), fire, { drag: 1.8, grow: radius });
      particles.emit("smoke", x, y, vx * 0.3, vy * 0.3, 1 + Math.random(), radius * 1.2, smoke, { drag: 0.9, grow: radius * 2 });
    }

    camera.addTrauma(trauma);
  }

  // Rock flung out in pieces.
  private debris(x: number, y: number, radius: number, count: number): void {
    const { particles } = this.kit;
    const dust = this.kit.cache.get("glow:rgba(190, 170, 150, 1)", 64, 64, paintGlow("rgba(190, 170, 150, 1)"));

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * TAU;
      const speed = 0.2 + Math.random() * 1.1;

      const size = radius * (0.3 + Math.random() * 0.5);

      particles.emit("smoke", x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.8 + Math.random() * 0.8, size, dust, { drag: 0.6 });
    }
  }

  // A shower of sparks, as a system gives out or a shot strikes.
  private sparks(x: number, y: number, count: number, colour = this.kit.theme.flameCore): void {
    const { particles } = this.kit;
    const spark = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * TAU;
      const speed = 0.6 + Math.random() * 1.6;

      particles.emit("glow", x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.2 + Math.random() * 0.35, 0.012 + Math.random() * 0.02, spark, { drag: 2.5 });
    }
  }

  // The hull gives out: a white flash, a fireball, the ship's own picture broken into burning pieces that tumble
  // away with its momentum, smoke, a ring of shock, and the camera thrown.
  private breakUp(x: number, y: number, vx: number, vy: number, angle: number, camera: Camera): void {
    const { particles, theme } = this.kit;
    const state = this.lastState;
    const world = this.lastWorld;
    const radius = (state && world ? world.stores.body.get(state.ship)?.radius : undefined) ?? 0.06;
    const base = camera.scale / camera.zoom;
    const size = Math.max(8, Math.round(radius * base));
    const sprite = this.kit.sprite(`ship:wreck:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, paintShip({ ...theme, accent: theme.danger }));
    const fire = this.kit.cache.get("fire", 64, 64, paintGlow("rgba(255, 120, 40, 1)"));
    const white = this.kit.cache.get("glow:#ffffff", 64, 64, paintGlow("#ffffff"));
    const smoke = this.kit.cache.get("smoke", 64, 64, paintGlow("rgba(70, 70, 78, 0.9)"));

    this.overlay.flashScreen("#fff3dc", 1);
    camera.addTrauma(1);
    this.light.shockwave(x, y, radius * 40, 1.2);
    particles.emit("glow", x, y, vx, vy, 0.9, radius * 14, white, { grow: -radius * 10, drag: 1 });

    for (let index = 0; index < 40; index += 1) {
      const spread = Math.random() * TAU;
      const speed = 0.4 + Math.random() * 2.4;

      particles.emit("glow", x, y, vx + Math.cos(spread) * speed, vy + Math.sin(spread) * speed, 0.5 + Math.random() * 0.8, radius * (2 + Math.random() * 3), fire,
        { drag: 1.6, grow: radius });
      particles.emit("smoke", x, y, vx * 0.5 + Math.cos(spread) * speed * 0.3, vy * 0.5 + Math.sin(spread) * speed * 0.3, 1.5 + Math.random() * 1.5, radius * 2,
        smoke, { drag: 0.9, grow: radius * 3 });
    }

    if (sprite) {
      cutShards(sprite, 7, Math.round(x * 1000)).forEach(({ surface, angle: cut }) => {
        const heading = angle + Math.PI / 2 + cut;
        const speed = 0.5 + Math.random() * 1.1;

        particles.emit("shard", x, y, vx + Math.cos(heading) * speed, vy + Math.sin(heading) * speed, 2.6 + Math.random(), radius * SHIP_WIDTH, surface, {
          angle: angle + Math.PI / 2,
          spin: (Math.random() - 0.5) * 7,
          drag: 0.25,
          isBurning: true,
        });
      });
    }
  }
}
