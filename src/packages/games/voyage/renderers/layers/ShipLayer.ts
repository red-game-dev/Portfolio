import type { RenderLayer } from "@/packages/games/engine";
import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { lerpAngle, TAU } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { VoyageTheme } from "../../config";
import { Decal } from "../../domain/components";
import { markOf, tierOf } from "../../economy/config/tiers";
import { HullTier } from "../../economy/domain/economy";
import { activeLevel } from "../../utils/boosts";
import { lerpX, lerpY, sizeBucket, VoyageFrame } from "../frame";
import { paintBreach, paintDent, paintScorch, paintShieldRing, tintRed } from "../paint/damage";
import { ION_TIERS, NOZZLES, paintHull } from "../paint/ships";
import { paintFlame, paintGlow, SHIP_HEIGHT, SHIP_WIDTH } from "../paint/space";
import { RenderKit } from "./kit";

// How each kind of hit is painted, and its sprite's key, made once.
const DECAL_PAINTERS: Record<Decal["kind"], (context: Canvas2DContext, width: number) => void> = { dent: paintDent, scorch: paintScorch, breach: paintBreach };
const DECAL_KEYS: Record<Decal["kind"], string> = { dent: "decal:dent", scorch: "decal:scorch", breach: "decal:breach" };

// How much of the ship shows through a cloak, and how much longer an afterburner's flame is.
const CLOAKED = 0.3;
const BURNER = 1.6;
// The blue white of an ion drive, for the great ships (and any ship on the ion drive boost).
const ION = { core: "#eef8ff", edge: "#5fb8ff" };

// Where on the hull a mark at `angle` sits, in the ship's own frame (nose up), as shares of its radius.
const HULL = { across: 0.4, along: 1.22 };
// The hull starts to glow above this temperature (Celsius).
const HEAT_GLOW_C = 350;

// The ship: its flame from every engine its hull has (fire for rockets, ion light for the great ships; sputtering
// when the hull is failing), its body as its hull and mark, the marks of every hit where it landed,
// glowing breaches that smoke and then burn, the shimmer of its shields and their flash where a hit is caught,
// the plasma at its nose on entry, its hull glowing as it heats and shedding molten drops once it melts, and,
// falling into a black hole, stretched long and red. A cloak leaves it faint, an afterburner lengthens the flame to
// white, and the ion drive boost turns it blue.
export class ShipLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "ship";
  private shieldFlash = 0;
  private shieldAngle = 0;
  private sputter = 0;
  // The hull's painter, made again only when the hull, its mark or the universe's colour changes.
  private painter: { key: string; paint: ReturnType<typeof paintHull> } | null = null;

  constructor(private readonly kit: RenderKit) {}

  public flashShield(angle: number): void {
    this.shieldFlash = 1;
    this.shieldAngle = angle;
  }

  public draw({ state, world, camera, alpha, now, dt, universe, theme, config }: VoyageFrame): void {
    const body = world.stores.body.get(state.ship);
    const ship = world.stores.ship.get(state.ship);
    const health = world.stores.health.get(state.ship);

    // Gone once destroyed; a run that ended stranded leaves the ship where it is.
    if (!body || !ship || !health || state.phase === "lost" || (state.status === "over" && health.hull <= 0)) {
      return;
    }

    const { front } = this.kit;
    const base = camera.scale / camera.zoom;
    const r = body.radius * camera.scale;
    const size = sizeBucket(body.radius * base);
    const accent = universe?.accent ?? theme.danger;
    const tier = tierOf(state.level);
    const mark = markOf(state.level);
    const sprite = this.kit.sprite(`ship:${tier}:${mark}:${accent}:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, this.hullPainter(tier, mark, accent, theme));
    const worldX = lerpX(body, alpha);
    const worldY = lerpY(body, alpha);
    const x = camera.toScreenX(worldX);
    const y = camera.toScreenY(worldY);
    const angle = lerpAngle(ship.prevAngle, ship.angle, alpha);
    const hull = health.hull / health.maxHull;
    const capture = state.capture;
    const fall = capture ? capture.progress : 0;
    const shown = activeLevel(state, "cloak") > 0 ? CLOAKED : 1;
    const isBurner = activeLevel(state, "afterburner") > 0;
    const isIon = ION_TIERS.includes(tier) || activeLevel(state, "ionBurn") > 0;

    // Pulled long towards the hole and thin across it, its light shifting to red as it nears the horizon.
    const stretch = 1 + fall * 2.6;
    const squeeze = 1 - fall * 0.7;

    this.sputter = hull < 0.25 && Math.random() < 0.08 ? 0.12 : Math.max(0, this.sputter - dt);
    this.emitExhaust(worldX, worldY, angle, body.radius, ship.thrust, hull, isIon);
    this.emitDamage(worldX, worldY, angle, body.radius, health.decals, hull);

    if (ship.temperatureC > config.thermal.ratings.hull) {
      this.emitDrips(worldX, worldY, body.vx, body.vy, body.radius, (ship.temperatureC - config.thermal.ratings.hull) / config.thermal.ratings.hull);
    }

    front.frame(x, y, angle + Math.PI / 2, squeeze, stretch);

    if ((ship.thrust > 0.02 || ship.isBraking) && this.sputter === 0 && !capture) {
      const core = isIon ? ION.core : isBurner ? "#ffffff" : theme.flameCore;
      const edge = isIon ? ION.edge : theme.flameEdge;
      const flame = this.kit.sprite(`flame:${core}:${edge}:${size}`, size * 1.1, size * 2.8, paintFlame(core, edge));
      const length = r * 2.8 * (0.45 + ship.thrust * 0.75) * (0.88 + Math.sin(now * 0.05) * 0.12) * (isBurner ? BURNER : 1);

      front.context.globalAlpha = shown;

      if (flame) {
        NOZZLES[tier].forEach(({ x: nx, y: ny, size: scale }) => {
          front.context.drawImage(flame.surface, (nx - 0.55 * scale) * r, ny * r, r * 1.1 * scale, length * scale);
        });
      }
    }

    if (sprite) {
      front.context.globalAlpha = Math.max(0, 1 - fall * 0.85) * shown;
      front.context.drawImage(sprite.surface, -r * SHIP_WIDTH / 2, -r * SHIP_HEIGHT / 2, r * SHIP_WIDTH, r * SHIP_HEIGHT);

      if (fall > 0) {
        const red = this.kit.sprite(`ship-red:${tier}:${mark}:${accent}:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, tintRed(sprite));

        front.context.globalAlpha = Math.min(1, fall * 1.4) * (1 - fall * 0.6);

        if (red) {
          front.context.drawImage(red.surface, -r * SHIP_WIDTH / 2, -r * SHIP_HEIGHT / 2, r * SHIP_WIDTH, r * SHIP_HEIGHT);
        }
      }

      front.context.globalAlpha = 1;
    }

    health.decals.forEach((decal) => this.drawDecal(decal, r, now));

    // Hot metal glows: dull red, then orange, then white as it nears the point where the plating melts.
    const glow = clamp((ship.temperatureC - HEAT_GLOW_C) / (config.thermal.ratings.hull - HEAT_GLOW_C), 0, 1.2);

    if (glow > 0) {
      const colour = glow < 0.5 ? "rgba(255, 70, 20, 1)" : glow < 0.9 ? "rgba(255, 150, 50, 1)" : "rgba(255, 235, 200, 1)";
      const heat = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

      front.context.globalCompositeOperation = "lighter";
      front.context.globalAlpha = Math.min(1, glow * 0.85);

      if (heat) {
        front.context.drawImage(heat.surface, -r * 1.6, -r * 2.2, r * 3.2, r * 4.4);
      }

      front.context.globalCompositeOperation = "source-over";
      front.context.globalAlpha = 1;
    }

    // Plasma at the nose on entry into air.
    if (state.readings.density > 0.05 && ship.temperatureC > HEAT_GLOW_C) {
      const plasma = this.kit.cache.get("plasma", 64, 64, paintGlow("rgba(255, 190, 120, 1)"));

      front.context.globalCompositeOperation = "lighter";
      front.context.globalAlpha = Math.min(1, (ship.temperatureC - HEAT_GLOW_C) / 600);

      if (plasma) {
        front.context.drawImage(plasma.surface, -r * 0.9, -r * 2.1, r * 1.8, r * 1.4);
      }

      front.context.globalCompositeOperation = "source-over";
      front.context.globalAlpha = 1;
    }

    front.reset();
    this.drawShields(x, y, r, health.shields / health.maxShields, dt);
  }

  private hullPainter(tier: HullTier, mark: number, accent: string, theme: VoyageTheme): ReturnType<typeof paintHull> {
    const key = `${tier}:${mark}:${accent}`;

    if (this.painter?.key !== key) {
      this.painter = { key, paint: paintHull(tier, mark, { ...theme, accent }) };
    }

    return this.painter.paint;
  }

  private drawDecal(decal: Decal, r: number, now: number): void {
    const { front } = this.kit;
    const sprite = this.kit.cache.get(DECAL_KEYS[decal.kind], 96, 96, DECAL_PAINTERS[decal.kind]);
    const size = r * (0.4 + decal.severity * 0.45);
    const px = Math.sin(decal.angle) * r * HULL.across;
    const py = -Math.cos(decal.angle) * r * HULL.along;

    front.context.globalAlpha = decal.kind === "breach" ? 0.75 + Math.sin(now * 0.02 + decal.seed * 9) * 0.25 : 0.9;

    if (sprite) {
      front.context.drawImage(sprite.surface, px - size / 2, py - size / 2, size, size);
    }

    front.context.globalAlpha = 1;
  }

  private drawShields(x: number, y: number, r: number, share: number, dt: number): void {
    const { front, theme } = this.kit;
    const ring = this.kit.cache.get(`shield:${theme.shield}`, 128, 128, paintShieldRing(theme.shield));
    const shimmer = share > 0 ? 0.06 + share * 0.05 : 0;

    this.shieldFlash = Math.max(0, this.shieldFlash - dt * 3);

    if (shimmer + this.shieldFlash <= 0.01) {
      return;
    }

    front.context.globalCompositeOperation = "lighter";
    front.context.globalAlpha = Math.min(1, shimmer + this.shieldFlash * 0.7);
    front.blit(ring, x, y, r * 4.2, r * 4.2);

    if (this.shieldFlash > 0) {
      const spot = this.kit.cache.get(`glow:${theme.shield}`, 64, 64, paintGlow(theme.shield));

      front.context.globalAlpha = this.shieldFlash;
      front.blit(spot, x + Math.cos(this.shieldAngle) * r * 2, y + Math.sin(this.shieldAngle) * r * 2, r * 2.2, r * 2.2);
    }

    front.context.globalAlpha = 1;
    front.context.globalCompositeOperation = "source-over";
  }

  private emitExhaust(x: number, y: number, angle: number, radius: number, thrust: number, hull: number, isIon: boolean): void {
    if (thrust < 0.05 || this.sputter > 0) {
      return;
    }

    const { particles, theme } = this.kit;
    const colour = isIon ? ION.edge : theme.flameEdge;
    const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));
    const backX = x - Math.cos(angle) * radius * 1.7;
    const backY = y - Math.sin(angle) * radius * 1.7;

    for (let index = 0; index < (thrust > 0.5 ? 2 : 1); index += 1) {
      const spread = (Math.random() - 0.5) * 0.5;

      particles.emit("glow", backX, backY, -Math.cos(angle + spread) * (0.8 + Math.random() * 0.6), -Math.sin(angle + spread) * (0.8 + Math.random() * 0.6),
        0.25 + Math.random() * 0.25, radius * (0.9 + Math.random() * 0.5) * (hull < 0.25 ? 0.7 : 1), glow, { drag: 2, grow: -radius });
    }
  }

  // Breaches leak smoke once the hull is below half, and burn below a quarter.
  private emitDamage(x: number, y: number, angle: number, radius: number, decals: Decal[], hull: number): void {
    if (hull > 0.5) {
      return;
    }

    const { particles } = this.kit;
    const smoke = this.kit.cache.get("smoke", 64, 64, paintGlow("rgba(70, 70, 78, 0.9)"));
    const fire = this.kit.cache.get("fire", 64, 64, paintGlow("rgba(255, 120, 40, 1)"));
    const worst = decals.filter((decal) => decal.kind !== "dent");

    worst.slice(0, 3).forEach((decal) => {
      if (Math.random() > (hull < 0.25 ? 0.5 : 0.25)) {
        return;
      }

      // The decal's place on the hull, turned into the world.
      const localX = Math.sin(decal.angle) * radius * HULL.across;
      const localY = -Math.cos(decal.angle) * radius * HULL.along;
      const turn = angle + Math.PI / 2;
      const px = x + localX * Math.cos(turn) - localY * Math.sin(turn);
      const py = y + localX * Math.sin(turn) + localY * Math.cos(turn);

      particles.emit("smoke", px, py, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, 0.8 + Math.random() * 0.8, radius * 0.5, smoke,
        { grow: radius * 0.8, drag: 0.8 });

      if (hull < 0.25) {
        particles.emit("glow", px, py, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.3, radius * 0.7, fire, { drag: 1.5 });
      }
    });
  }

  // Molten metal shed as the plating gives way: bright drops that keep the ship's motion, cooling as they go.
  private emitDrips(x: number, y: number, vx: number, vy: number, radius: number, severity: number): void {
    if (Math.random() > Math.min(0.5, 0.12 + severity * 0.4)) {
      return;
    }

    const { particles } = this.kit;
    const drop = this.kit.cache.get("glow:rgba(255, 200, 120, 1)", 64, 64, paintGlow("rgba(255, 200, 120, 1)"));
    const spread = Math.random() * TAU;
    const kick = 0.15 + Math.random() * 0.3;

    particles.emit("glow", x + Math.cos(spread) * radius, y + Math.sin(spread) * radius, vx * 0.9 + Math.cos(spread) * kick, vy * 0.9 + Math.sin(spread) * kick,
      0.4 + Math.random() * 0.5, radius * (0.12 + Math.random() * 0.16), drop, { drag: 0.4, grow: -radius * 0.15 });
  }
}
