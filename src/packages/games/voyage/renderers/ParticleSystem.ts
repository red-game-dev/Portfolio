import type { Camera } from "@/packages/games/engine";
import { Pool } from "@/packages/games/engine";
import { DrawableSurface } from "@/packages/graphics/canvas";
import { clamp01 } from "@/packages/math/clamp";

import { Surface } from "./Surface";

export type ParticleKind = "glow" | "smoke" | "shard";

// One particle, in world units so it stays put in space while the camera moves.
export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  grow: number;
  drag: number;
  angle: number;
  spin: number;
  sprite: DrawableSurface | null;
  // Trails fire while it is young (a burning shard).
  isBurning: boolean;
}

const LIMIT = 900;

// Sparks, smoke, fire and the pieces of a ship: pooled, so a burst of a hundred allocates nothing, capped, so an
// explosion can never cost more than a fixed budget, and drawn additively for light and normally for smoke.
export class ParticleSystem {
  private readonly live: Particle[] = [];
  private readonly pool = new Pool<Particle>(() => ({
    kind: "glow", x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 0, grow: 0, drag: 0, angle: 0, spin: 0, sprite: null, isBurning: false,
  }), LIMIT);

  // How many may be alive at once: the full budget, or less on a device that cannot keep up.
  private budget = LIMIT;

  public get count(): number {
    return this.live.length;
  }

  public setBudget(share: number): void {
    this.budget = Math.max(60, Math.round(LIMIT * clamp01(share)));
  }

  public emit(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, size: number, sprite: DrawableSurface | null, options: {
    grow?: number;
    drag?: number;
    spin?: number;
    angle?: number;
    isBurning?: boolean;
  } = {}): Particle | null {
    if (this.live.length >= this.budget) {
      return null;
    }

    const particle = this.pool.acquire();

    particle.kind = kind;
    particle.x = x;
    particle.y = y;
    particle.vx = vx;
    particle.vy = vy;
    particle.life = life;
    particle.max = life;
    particle.size = size;
    particle.grow = options.grow ?? 0;
    particle.drag = options.drag ?? 0;
    particle.angle = options.angle ?? 0;
    particle.spin = options.spin ?? 0;
    particle.sprite = sprite;
    particle.isBurning = options.isBurning ?? false;
    this.live.push(particle);

    return particle;
  }

  public update(dt: number, trail: (particle: Particle) => void): void {
    for (let index = this.live.length - 1; index >= 0; index -= 1) {
      const particle = this.live[index];

      particle.life -= dt;

      if (particle.life <= 0) {
        this.live[index] = this.live[this.live.length - 1];
        this.live.pop();
        this.pool.release(particle);
        continue;
      }

      const keep = Math.exp(-particle.drag * dt);

      particle.vx *= keep;
      particle.vy *= keep;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.size += particle.grow * dt;
      particle.angle += particle.spin * dt;

      if (particle.isBurning && particle.life > particle.max * 0.4) {
        trail(particle);
      }
    }
  }

  public draw(surface: Surface, camera: Camera, kinds: readonly ParticleKind[], additive: boolean): void {
    const { context } = surface;

    context.globalCompositeOperation = additive ? "lighter" : "source-over";

    for (const particle of this.live) {
      if (!kinds.includes(particle.kind) || !camera.sees(particle.x, particle.y, particle.size)) {
        continue;
      }

      const fade = particle.life / particle.max;
      const size = particle.size * camera.scale;

      context.globalAlpha = particle.kind === "smoke" ? fade * 0.35 : particle.kind === "shard" ? Math.min(1, fade * 2) : fade;
      surface.blit(particle.sprite, camera.toScreenX(particle.x), camera.toScreenY(particle.y), size, size * (particle.kind === "shard" ? 1.31 : 1), particle.angle);
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  public clear(): void {
    this.live.forEach((particle) => this.pool.release(particle));
    this.live.length = 0;
  }
}
