import { Canvas2DContext, createDrawableSurface, DrawableSurface } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface StarfieldSceneOptions {
  starColor: string;
  // Two soft clouds behind the stars, rendered once per resize.
  nebulaColors: [string, string];
  meteorRgb: string;
  intensity: number;
}

interface Star {
  x: number;
  y: number;
  // 0.2 far to 1 near: near stars are bigger, brighter and move faster.
  depth: number;
  phase: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const AREA_PER_STAR = 5200;
const MIN_STARS = 90;
const MAX_STARS = 320;
const BRIGHTNESS_LEVELS = 4;
const OUTWARD_SPEED = 0.000012;
const METEOR_CHANCE = 0.004;

// Stars drift slowly outward from the centre, as if moving through space, and twinkle. Stars are grouped
// by brightness so each group is one fillStyle change.
export class StarfieldScene implements Scene {
  public readonly id = "universe";
  private readonly random: RandomSource;
  private readonly options: StarfieldSceneOptions;
  private readonly buckets: Star[][] = Array.from({ length: BRIGHTNESS_LEVELS }, () => []);
  private stars: Star[] = [];
  private meteor: Meteor | null = null;
  private nebula: DrawableSurface | null = null;
  private width = 0;
  private height = 0;

  constructor(random: RandomSource, options: StarfieldSceneOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height, pixelRatio }: SceneSize): void {
    const count = Math.round(Math.min(MAX_STARS, Math.max(MIN_STARS, (width * height) / AREA_PER_STAR)));

    this.width = width;
    this.height = height;
    this.stars = Array.from({ length: count }, () => this.createStar(randomBetween(this.random, 0, width), randomBetween(this.random, 0, height)));
    this.nebula = this.renderNebula(width, height, pixelRatio);
  }

  public update(deltaMs: number, now: number): void {
    const centreX = this.width / 2;
    const centreY = this.height / 2;

    this.stars.forEach((star, index) => {
      star.x += (star.x - centreX) * OUTWARD_SPEED * star.depth * deltaMs;
      star.y += (star.y - centreY) * OUTWARD_SPEED * star.depth * deltaMs;

      if (star.x < 0 || star.x > this.width || star.y < 0 || star.y > this.height) {
        this.stars[index] = this.createStar(
          centreX + randomBetween(this.random, -this.width * 0.3, this.width * 0.3),
          centreY + randomBetween(this.random, -this.height * 0.3, this.height * 0.3)
        );
      }
    });

    if (this.meteor) {
      this.meteor.x += this.meteor.vx * deltaMs;
      this.meteor.y += this.meteor.vy * deltaMs;
      this.meteor.life -= deltaMs;

      if (this.meteor.life <= 0) {
        this.meteor = null;
      }
    } else if (this.random() < METEOR_CHANCE) {
      this.meteor = {
        x: randomBetween(this.random, this.width * 0.2, this.width),
        y: randomBetween(this.random, 0, this.height * 0.4),
        vx: -0.55,
        vy: 0.22,
        life: 900,
      };
    }

    this.bucketStars(now);
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    const strength = alpha * this.options.intensity;

    if (this.nebula) {
      context.globalAlpha = strength * 0.7;
      context.drawImage(this.nebula.surface, 0, 0, this.width, this.height);
    }

    context.fillStyle = this.options.starColor;
    this.buckets.forEach((bucket, level) => {
      context.globalAlpha = strength * ((level + 1) / BRIGHTNESS_LEVELS);
      bucket.forEach((star) => {
        const size = star.depth > 0.75 ? 2 : 1;

        context.fillRect(Math.round(star.x), Math.round(star.y), size, size);
      });
    });

    this.drawMeteor(context, strength);
  }

  private createStar(x: number, y: number): Star {
    return { x, y, depth: randomBetween(this.random, 0.2, 1), phase: randomBetween(this.random, 0, Math.PI * 2) };
  }

  private bucketStars(now: number): void {
    this.buckets.forEach((bucket) => {
      bucket.length = 0;
    });
    this.stars.forEach((star) => {
      const twinkle = 0.65 + 0.35 * Math.sin(now / 900 + star.phase);
      const level = Math.min(BRIGHTNESS_LEVELS - 1, Math.floor(star.depth * twinkle * BRIGHTNESS_LEVELS));

      this.buckets[level].push(star);
    });
  }

  private drawMeteor(context: Canvas2DContext, strength: number): void {
    if (!this.meteor) {
      return;
    }

    const { x, y, vx, vy, life } = this.meteor;
    const tail = context.createLinearGradient(x, y, x - vx * 260, y - vy * 260);

    tail.addColorStop(0, `rgba(${this.options.meteorRgb}, ${(strength * Math.min(1, life / 300)).toFixed(3)})`);
    tail.addColorStop(1, `rgba(${this.options.meteorRgb}, 0)`);
    context.globalAlpha = 1;
    context.strokeStyle = tail;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - vx * 260, y - vy * 260);
    context.stroke();
  }

  private renderNebula(width: number, height: number, pixelRatio: number): DrawableSurface | null {
    const scale = Math.min(pixelRatio, 1) * 0.5;
    const drawable = createDrawableSurface(Math.ceil(width * scale), Math.ceil(height * scale));

    if (!drawable) {
      return null;
    }

    const { context } = drawable;
    const clouds: Array<[number, number, number, string]> = [
      [0.25, 0.3, 0.55, this.options.nebulaColors[0]],
      [0.75, 0.7, 0.6, this.options.nebulaColors[1]],
    ];

    context.scale(scale, scale);
    clouds.forEach(([cx, cy, radius, color]) => {
      const r = Math.max(width, height) * radius;
      const gradient = context.createRadialGradient(width * cx, height * cy, 0, width * cx, height * cy, r);

      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    });

    return drawable;
  }
}
