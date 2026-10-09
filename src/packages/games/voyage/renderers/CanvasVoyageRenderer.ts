import { Canvas2DContext, CanvasRenderer, CanvasSurface, DrawableSurface } from "@/packages/graphics/canvas";
import { clamp01 } from "@/packages/math/clamp";
import { createSeededRandom } from "@/packages/math/random";

import { VoyageTheme, VoyageUniverseTheme } from "../config";
import { VoyageHole, VoyagePhase, VoyageSize, VoyageState, VoyageStatus } from "../domain/types";
import { paintHazard, paintPickup, paintRock } from "./paint/hazards";
import { bodyExtent, EARTH_GLOW, paintBody, paintEarthCap } from "./paint/planets";
import {
  DISK_REACH,
  LENS_REACH,
  paintDisk,
  paintFlame,
  paintGlow,
  paintLens,
  paintMilkyWay,
  paintShip,
  paintStars,
  paintSun,
  paintUniverse,
  SHIP_HEIGHT,
  SHIP_WIDTH,
} from "./paint/space";
import { SurfaceCache } from "./SurfaceCache";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  colour: string;
}

const TAU = Math.PI * 2;
// Each star layer: how fast it streams past against the world, the square it repeats in (CSS pixels) and how far
// across it starts. The squares differ in size and start, so no two layers repeat in step and the eye finds no
// grid; small squares keep memory low.
const STAR_LAYERS = [
  { depth: 0.05, tile: 520, shift: 0 },
  { depth: 0.18, tile: 760, shift: 290 },
  { depth: 0.5, tile: 1100, shift: 530 },
];
const BACKDROP_TILE = 720;
const MAX_SPARKS = 160;
// Sprites are painted at most this many device pixels across and scaled up past it: planets are smooth enough
// that nobody can tell, and it keeps a desktop's Jupiter from taking tens of megabytes.
const MAX_SPRITE = 1600;
// Sizes are rounded to this many CSS pixels, so hazards of nearly the same size share a sprite.
const SIZE_STEP = 2;

const bucket = (pixels: number) => Math.max(SIZE_STEP, Math.round(pixels / SIZE_STEP) * SIZE_STEP);

// Draws the voyage from painted-once sprites and repeating tiles: every planet, rock, disk of gas and the ship
// is painted the first time it is needed and blitted after, so a frame is mostly drawImage calls the GPU can
// batch. No shadows, no filters and no gradients made per frame.
export class CanvasVoyageRenderer extends CanvasRenderer<VoyageState> {
  private readonly theme: VoyageTheme;
  private readonly cache = new SurfaceCache();
  private readonly sparks: Spark[] = [];
  private readonly streaks: Array<{ angle: number; speed: number; offset: number }>;
  private readonly random = createSeededRandom(9);
  private lastFrameAt = 0;
  private lastShields = -1;
  private lastStatus: VoyageStatus = "ready";
  private lastPhase: VoyagePhase = "solar";
  private wreck = { x: 0, y: 0 };

  constructor(context: Canvas2DContext, theme: VoyageTheme) {
    super(context);
    this.theme = theme;

    const random = createSeededRandom(5);

    this.streaks = Array.from({ length: 90 }, () => ({ angle: random() * TAU, speed: 0.35 + random() * 0.9, offset: random() }));
  }

  // Twice the CSS resolution at most: past that the eye gains nothing and the GPU pays four times over.
  public resize({ width, height }: VoyageSize, pixelRatio: number): void {
    this.resizeSurface(width, height, Math.min(2, pixelRatio));
    this.cache.clear();
  }

  public draw(state: VoyageState, now: number): void {
    const { width, height } = this.size;

    if (width === 0 || height === 0) {
      return;
    }

    const dt = this.lastFrameAt > 0 ? Math.min(0.05, Math.max(0, now - this.lastFrameAt) / 1000) : 0;
    const universe = state.phase === "universe" && state.universe >= 0 ? this.theme.universes[state.universe % this.theme.universes.length] : null;

    this.lastFrameAt = now;
    this.react(state, universe);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.context.globalAlpha = 1;
    this.context.fillStyle = state.phase === "lost" ? "#000000" : universe?.deep ?? this.theme.space;
    this.context.fillRect(0, 0, width, height);

    if (state.phase === "lost") {
      this.drawTunnel(state);
    } else {
      this.drawSky(state, universe);

      if (state.phase === "solar" || state.phase === "singularity") {
        this.drawSun(state.au);
        this.drawEarth(state);
        this.drawBodies(state);
      }

      if (state.hole) {
        this.drawHole(state.hole, state.unit, now);
      }

      this.drawItems(state, universe, now);
      this.drawHazards(state, universe, now);

      if (state.status !== "over") {
        this.drawShip(state, universe, now, dt);
      } else {
        this.drawShockwave(state);
      }
    }

    this.drawSparks(dt);

    if (state.flash > 0) {
      this.context.globalAlpha = state.flash * 0.28;
      this.context.fillStyle = this.theme.danger;
      this.context.fillRect(0, 0, width, height);
    }

    this.context.globalAlpha = 1;
  }

  // Bursts of sparks for what just happened: a hit, the wreck, arriving somewhere new.
  private react(state: VoyageState, universe: VoyageUniverseTheme | null): void {
    const x = state.ship.x * state.unit;
    const y = state.ship.y * state.unit;

    if (state.status === "flying" && this.lastStatus !== "flying") {
      this.lastShields = state.shields;
    }

    if (this.lastShields > state.shields && state.status !== "ready") {
      this.burst(x, y, 18, this.theme.danger, 240);
    }

    if (state.status === "over" && this.lastStatus !== "over") {
      this.wreck = { x, y };
      this.burst(x, y, 70, this.theme.flameEdge, 380);
      this.burst(x, y, 30, "#ffffff", 220);
    }

    if (state.phase === "universe" && this.lastPhase === "lost" && universe) {
      this.burst(x, y, 40, universe.accent, 300);
    }

    // The planets are left behind for good: let their sprites go.
    if (state.phase !== this.lastPhase && this.lastPhase === "solar") {
      this.cache.clear();
    }

    this.lastShields = state.shields;
    this.lastStatus = state.status;
    this.lastPhase = state.phase;
  }

  private burst(x: number, y: number, count: number, colour: string, speed: number): void {
    for (let index = 0; index < count && this.sparks.length < MAX_SPARKS; index += 1) {
      const angle = this.random() * TAU;
      const velocity = speed * (0.3 + this.random() * 0.7);
      const life = 0.4 + this.random() * 0.7;

      this.sparks.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, max: life, size: 6 + this.random() * 10, colour });
    }
  }

  private sprite(key: string, width: number, height: number, paint: Parameters<SurfaceCache["get"]>[3]): DrawableSurface | null {
    const scale = Math.min(this.pixelRatio, MAX_SPRITE / Math.max(width, height, 1));

    return this.cache.get(key, width * scale, height * scale, paint);
  }

  // A sprite centred at x, y in CSS pixels, turned by `angle`.
  private blit(drawable: DrawableSurface | null, x: number, y: number, width: number, height: number, angle = 0): void {
    if (!drawable) {
      return;
    }

    const surface: CanvasSurface = drawable.surface;

    if (angle === 0) {
      this.context.drawImage(surface, x - width / 2, y - height / 2, width, height);

      return;
    }

    const ratio = this.pixelRatio;
    const cos = Math.cos(angle) * ratio;
    const sin = Math.sin(angle) * ratio;

    this.context.setTransform(cos, sin, -sin, cos, x * ratio, y * ratio);
    this.context.drawImage(surface, -width / 2, -height / 2, width, height);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // A square tile of `size` repeated across the screen, shifted down by `offset` and across by `shift` CSS
  // pixels, so it streams past.
  private tile(drawable: DrawableSurface | null, size: number, offset: number, shift: number, alpha: number): void {
    if (!drawable) {
      return;
    }

    const { width, height } = this.size;
    const top = (offset % size) - size;
    const left = (shift % size) - size;

    this.context.globalAlpha = alpha;

    for (let y = top; y < height; y += size) {
      for (let x = left; x < width; x += size) {
        this.context.drawImage(drawable.surface, x, y, size, size);
      }
    }

    this.context.globalAlpha = 1;
  }

  private drawSky(state: VoyageState, universe: VoyageUniverseTheme | null): void {
    const { width, height } = this.size;
    const flownPixels = state.flown * state.unit;
    const tileRatio = Math.min(1.5, this.pixelRatio);
    const milkyWay = this.cache.get("milky-way", 512, 512, paintMilkyWay(this.theme.star));

    if (milkyWay) {
      this.context.drawImage(milkyWay.surface, 0, 0, width, height);
    }

    STAR_LAYERS.forEach(({ depth, tile, shift }, layer) => {
      const stars = this.cache.get(`stars:${layer}`, tile * tileRatio, tile * tileRatio, paintStars(layer === 0 ? 0 : layer === 1 ? 1 : 2, this.theme.star, tileRatio));

      this.tile(stars, tile, flownPixels * depth, shift, 1);
    });

    if (universe) {
      const side = BACKDROP_TILE * tileRatio;
      const backdrop = this.cache.get(`universe:${universe.style}`, side, side, paintUniverse(universe.style, universe.accent, tileRatio));

      // The Matrix rains faster than the rest drift.
      this.tile(backdrop, BACKDROP_TILE, flownPixels * (universe.style === "matrix" ? 0.9 : 0.3), 0, 0.9);
    }
  }

  // The Sun behind the ship, a warm glow from below that fades with distance.
  private drawSun(au: number): void {
    const { width, height } = this.size;
    const glow = this.cache.get("sun", 256, 256, paintSun);
    const radius = Math.max(width, height) * 0.95;

    this.context.globalAlpha = clamp01(1.2 / au);
    this.blit(glow, width / 2, height * 1.12, radius * 2, radius * 2);
    this.context.globalAlpha = 1;
  }

  private drawEarth(state: VoyageState): void {
    const { width, height } = this.size;
    const top = state.departureY * state.unit;

    if (top > height) {
      return;
    }

    const radius = Math.max(width, height) * 1.1;
    const pad = radius * EARTH_GLOW;
    const capHeight = height * 0.4 + pad;
    const ratio = Math.min(this.pixelRatio, MAX_SPRITE / width);
    const cap = this.cache.get(`earth:${width}x${height}`, width * ratio, capHeight * ratio, paintEarthCap(radius * ratio));

    if (cap) {
      this.context.drawImage(cap.surface, 0, top - pad, width, capHeight);
    }
  }

  private drawBodies(state: VoyageState): void {
    state.bodies.forEach((body) => {
      const radius = body.radius * state.unit;
      const extent = bodyExtent(body.id);
      const size = bucket(radius);
      const drawable = this.sprite(`body:${body.id}:${size}`, extent.width * size, extent.height * size, paintBody(body.id));

      this.blit(drawable, body.x * state.unit, body.y * state.unit, extent.width * radius, extent.height * radius);
    });
  }

  private drawItems(state: VoyageState, universe: VoyageUniverseTheme | null, now: number): void {
    const pulse = 1 + Math.sin(now * 0.006) * 0.1;

    state.items.forEach((item) => {
      const colour = item.kind === "shield" ? this.theme.shield : universe?.accent ?? "#ffd76a";
      const size = bucket(item.radius * state.unit * 2.4);
      const drawable = this.sprite(`item:${item.kind}:${colour}:${size}`, size, size, paintPickup(item.kind, colour));
      const drawn = item.radius * state.unit * 2.4 * pulse;

      this.blit(drawable, item.x * state.unit, item.y * state.unit, drawn, drawn);
    });
  }

  private drawHazards(state: VoyageState, universe: VoyageUniverseTheme | null, now: number): void {
    const isIcy = state.au > 29;

    state.hazards.forEach((hazard) => {
      const drawn = hazard.radius * state.unit * 2.4;
      const size = bucket(drawn);
      const x = hazard.x * state.unit;
      const y = hazard.y * state.unit;

      if (!universe) {
        this.blit(this.sprite(`rock:${hazard.shape}:${isIcy ? "ice" : "rock"}:${size}`, size, size, paintRock(hazard.shape, isIcy)), x, y, drawn, drawn, hazard.angle);

        return;
      }

      const drawable = this.sprite(`hazard:${universe.style}:${size}`, size, size, paintHazard(universe.style, universe.hazard, universe.accent));

      // Pixel invaders do not tumble: they bob, the way they always have.
      if (universe.style === "pixels") {
        this.blit(drawable, x, y + Math.sin(now * 0.004 + hazard.shape) * 3, drawn, drawn);
      } else {
        this.blit(drawable, x, y, drawn, drawn, universe.style === "chips" ? hazard.angle * 2 : hazard.angle);
      }
    });
  }

  // Lensed starlight behind, the disk of gas squashed into a tilted ring, the black core over it, and the near
  // half of the disk drawn again across the front.
  private drawHole(hole: VoyageHole, unit: number, now: number): void {
    const x = hole.x * unit;
    const y = hole.y * unit;
    const horizon = hole.radius * unit;
    const lensSize = bucket(horizon * LENS_REACH * 2);
    const diskSize = bucket(horizon * DISK_REACH * 2);
    const lens = this.sprite(`lens:${lensSize}`, lensSize, lensSize, paintLens(this.theme.star));
    const disk = this.sprite(`disk:${diskSize}`, diskSize, diskSize, paintDisk(this.theme.diskHot, this.theme.disk));
    const spin = now * 0.0009;
    const ratio = this.pixelRatio;

    this.blit(lens, x, y, horizon * LENS_REACH * 2, horizon * LENS_REACH * 2, now * 0.00025);
    this.drawDisk(disk, x, y, horizon, spin);
    this.context.fillStyle = "#000000";
    this.context.beginPath();
    this.context.arc(x, y, horizon, 0, TAU);
    this.context.fill();
    this.context.strokeStyle = this.theme.diskHot;
    this.context.globalAlpha = 0.9;
    this.context.lineWidth = Math.max(1.2, horizon * 0.05);
    this.context.beginPath();
    this.context.arc(x, y, horizon * 1.08, 0, TAU);
    this.context.stroke();
    this.context.globalAlpha = 1;
    this.context.save();
    this.context.beginPath();
    this.context.rect(x - horizon * DISK_REACH, y, horizon * DISK_REACH * 2, horizon * DISK_REACH);
    this.context.clip();
    this.drawDisk(disk, x, y, horizon, spin);
    this.context.restore();
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private drawDisk(disk: DrawableSurface | null, x: number, y: number, horizon: number, spin: number): void {
    if (!disk) {
      return;
    }

    const ratio = this.pixelRatio;
    const squash = 0.32;
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);
    const size = horizon * DISK_REACH * 2;

    this.context.setTransform(cos * ratio, sin * squash * ratio, -sin * ratio, cos * squash * ratio, x * ratio, y * ratio);
    this.context.drawImage(disk.surface, -size / 2, -size / 2, size, size);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private drawShip(state: VoyageState, universe: VoyageUniverseTheme | null, now: number, dt: number): void {
    const { ship, capture, unit } = state;
    const radius = ship.radius * unit;
    const x = ship.x * unit;
    const y = ship.y * unit;
    const accent = universe?.accent ?? this.theme.danger;
    const size = bucket(radius);
    const body = this.sprite(`ship:${accent}:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, paintShip({ ...this.theme, accent }));
    const flame = this.sprite(`flame:${size}`, size * 1.1, size * 2.8, paintFlame(this.theme.flameCore, this.theme.flameEdge));
    const ratio = this.pixelRatio;

    // Blinking while the shields recover.
    if (!capture && ship.invulnerableMs > 0 && Math.floor(now / 90) % 2 === 0) {
      return;
    }

    let angle = ship.tilt * 0.35;
    let stretch = 1;
    let squeeze = 1;

    if (capture) {
      // Pulled long towards the hole and thin across it, shrinking as it goes.
      angle = Math.atan2(ship.y - capture.centre.y, ship.x - capture.centre.x) + Math.PI / 2;
      stretch = (1 + capture.progress * 2.2) * (1 - capture.progress * 0.6);
      squeeze = (1 - capture.progress * 0.75) * (1 - capture.progress * 0.6);
    } else if (state.status === "flying") {
      this.exhaust(x, y + radius * 1.05, radius, dt);
    }

    const cos = Math.cos(angle) * ratio;
    const sin = Math.sin(angle) * ratio;

    this.context.setTransform(cos * squeeze, sin * squeeze, -sin * stretch, cos * stretch, x * ratio, y * ratio);

    if (flame && state.status === "flying" && !capture) {
      const thrust = 0.85 + Math.sin(now * 0.05) * 0.12 + Math.max(0, -ship.vy) * 0.35;

      this.context.drawImage(flame.surface, -radius * 0.55, radius * 0.9, radius * 1.1, radius * 2.8 * thrust);
    }

    if (body) {
      this.context.drawImage(body.surface, -radius * SHIP_WIDTH / 2, -radius * SHIP_HEIGHT / 2, radius * SHIP_WIDTH, radius * SHIP_HEIGHT);
    }

    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private exhaust(x: number, y: number, radius: number, dt: number): void {
    const count = dt > 0 ? 2 : 0;

    for (let index = 0; index < count && this.sparks.length < MAX_SPARKS; index += 1) {
      const life = 0.25 + this.random() * 0.3;

      this.sparks.push({
        x: x + (this.random() - 0.5) * radius * 0.5,
        y,
        vx: (this.random() - 0.5) * 30,
        vy: 140 + this.random() * 120,
        life,
        max: life,
        size: radius * (0.6 + this.random() * 0.5),
        colour: this.theme.flameEdge,
      });
    }
  }

  private drawSparks(dt: number): void {
    if (this.sparks.length === 0) {
      return;
    }

    this.context.globalCompositeOperation = "lighter";

    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];

      spark.life -= dt;

      if (spark.life <= 0) {
        this.sparks.splice(index, 1);
        continue;
      }

      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= 0.98;
      spark.vy *= 0.98;

      const fade = spark.life / spark.max;
      const glow = this.cache.get(`glow:${spark.colour}`, 64, 64, paintGlow(spark.colour));

      this.context.globalAlpha = fade;
      this.blit(glow, spark.x, spark.y, spark.size * (0.5 + fade), spark.size * (0.5 + fade));
    }

    this.context.globalCompositeOperation = "source-over";
    this.context.globalAlpha = 1;
  }

  private drawShockwave(state: VoyageState): void {
    const progress = state.phaseMs / 1200;

    if (progress >= 1) {
      return;
    }

    this.context.strokeStyle = this.theme.flameCore;
    this.context.globalAlpha = 1 - progress;
    this.context.lineWidth = 3 * (1 - progress) + 1;
    this.context.beginPath();
    this.context.arc(this.wreck.x, this.wreck.y, progress * Math.min(this.size.width, this.size.height) * 0.45, 0, TAU);
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  // Inside the black hole: light streaming past from a point ahead, slow and long the first time.
  private drawTunnel(state: VoyageState): void {
    const { width, height } = this.size;
    const cx = width / 2;
    const cy = height / 2;
    const reach = Math.hypot(width, height) / 2;
    const seconds = state.phaseMs / 1000 * (state.universes === 0 ? 0.45 : 1.2);
    const glow = this.cache.get(`glow:${this.theme.window}`, 64, 64, paintGlow(this.theme.window));

    this.context.strokeStyle = this.theme.window;
    this.context.lineCap = "round";
    this.streaks.forEach((streak) => {
      const progress = (streak.offset + seconds * streak.speed) % 1;
      const from = progress * progress * reach;
      const length = reach * (0.02 + progress * 0.16);

      this.context.globalAlpha = progress * 0.9;
      this.context.lineWidth = 0.5 + progress * 2;
      this.context.beginPath();
      this.context.moveTo(cx + Math.cos(streak.angle) * from, cy + Math.sin(streak.angle) * from);
      this.context.lineTo(cx + Math.cos(streak.angle) * (from + length), cy + Math.sin(streak.angle) * (from + length));
      this.context.stroke();
    });
    this.context.globalAlpha = 0.5 + Math.sin(state.phaseMs * 0.004) * 0.2;
    this.blit(glow, cx, cy, Math.min(width, height) * 0.35, Math.min(width, height) * 0.35);
    this.context.globalAlpha = 1;
  }
}
