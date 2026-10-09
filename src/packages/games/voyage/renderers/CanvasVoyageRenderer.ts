import { Camera, EventBus, RenderPipeline } from "@/packages/games/engine";
import type { Canvas2DContext } from "@/packages/graphics/canvas";
import type { LensSource } from "@/packages/graphics/webgl";

import { VoyageTheme } from "../config";
import { VoyageWorld } from "../core/world";
import { VoyageEvents } from "../domain/events";
import { VoyageState } from "../domain/state";
import { lerpX, lerpY, VoyageFrame } from "./frame";
import { BackdropLayer } from "./layers/BackdropLayer";
import { BodiesLayer } from "./layers/BodiesLayer";
import { EffectsLayer } from "./layers/EffectsLayer";
import { HolesLayer } from "./layers/HolesLayer";
import { RenderKit } from "./layers/kit";
import { OverlayLayer } from "./layers/OverlayLayer";
import { ShipLayer } from "./layers/ShipLayer";
import { ThingsLayer } from "./layers/ThingsLayer";
import { cutShards } from "./paint/damage";
import { paintGlow, paintShip, SHIP_HEIGHT, SHIP_WIDTH } from "./paint/space";
import { ParticleSystem } from "./ParticleSystem";
import { Surface } from "./Surface";
import { SurfaceCache } from "./SurfaceCache";

export interface VoyageRenderer {
  resize(width: number, height: number, pixelRatio: number): void;
  draw(frame: VoyageFrame): void;
  // The black holes on screen, for the GPU lens.
  lenses(frame: VoyageFrame): LensSource[];
  attach(events: EventBus<VoyageEvents>, camera: Camera): () => void;
  reset(): void;
}

// The pixel ratio the 2D surfaces draw at, at most: past two the eye gains nothing and the GPU pays four times.
const MAX_PIXEL_RATIO = 2;

// Draws the voyage on two 2D surfaces, a lens between them on the GPU: the back holds what light bends round a
// black hole (the sky, the planets, the far side of a disk), the front what is close enough not to (the near side
// of a disk, rocks, pickups, the ship, effects, the overlay). Each part of the picture is its own layer. It hears
// the game's events to set off sparks, the breakup of the ship, shield flashes and the camera's shake.
export class CanvasVoyageRenderer implements VoyageRenderer {
  private readonly kit: RenderKit;
  private readonly backLayers: RenderPipeline<VoyageFrame>;
  private readonly frontLayers: RenderPipeline<VoyageFrame>;
  private readonly ship: ShipLayer;
  private readonly effects: EffectsLayer;
  private readonly overlay: OverlayLayer;
  private lastState: Readonly<VoyageState> | null = null;
  private lastWorld: VoyageWorld | null = null;

  constructor(back: Canvas2DContext, front: Canvas2DContext, theme: VoyageTheme) {
    this.kit = new RenderKit(new Surface(back), new Surface(front), new SurfaceCache(), new ParticleSystem(), theme);
    this.ship = new ShipLayer(this.kit);
    this.effects = new EffectsLayer(this.kit);
    this.overlay = new OverlayLayer(this.kit);
    this.backLayers = new RenderPipeline([new BackdropLayer(this.kit), new BodiesLayer(this.kit), new HolesLayer(this.kit, "back")]);
    this.frontLayers = new RenderPipeline([new HolesLayer(this.kit, "front"), new ThingsLayer(this.kit), this.ship, this.effects, this.overlay]);
  }

  public resize(width: number, height: number, pixelRatio: number): void {
    const ratio = Math.min(MAX_PIXEL_RATIO, pixelRatio);

    this.kit.back.resize(width, height, ratio);
    this.kit.front.resize(width, height, ratio);
    this.kit.cache.clear();
  }

  public draw(frame: VoyageFrame): void {
    this.lastState = frame.state;
    this.lastWorld = frame.world;
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

      lenses.push({ x: camera.toScreenX(lerpX(body, alpha)), y: camera.toScreenY(lerpY(body, alpha)), shadow, einstein: shadow * (1.55 + falling * 1.8) });
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
          const spread = (index / 14) * Math.PI * 2;

          particles.emit("glow", x, y, Math.cos(spread) * 0.9, Math.sin(spread) * 0.9, 0.45, 0.05, glow, { drag: 3 });
        }
      }),
      events.on("landed", () => camera.addTrauma(0.15)),
      events.on("emergency", () => {
        this.overlay.flashScreen("#ffffff", 0.8);
        camera.addTrauma(0.7);
      }),
      events.on("captured", () => camera.addTrauma(0.3)),
    ];

    return () => offs.forEach((off) => off());
  }

  public reset(): void {
    this.effects.clear();
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
    this.effects.shockwave(x, y, radius * 40, 1.2);
    particles.emit("glow", x, y, vx, vy, 0.9, radius * 14, white, { grow: -radius * 10, drag: 1 });

    for (let index = 0; index < 40; index += 1) {
      const spread = Math.random() * Math.PI * 2;
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
