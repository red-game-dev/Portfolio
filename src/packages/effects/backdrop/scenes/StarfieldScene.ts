import { Canvas2DContext, createDrawableSurface, DrawableSurface } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";
import { Rgb, rgba } from "../utils/colour";

export interface StarfieldSceneOptions {
  star: Rgb;
  // Two soft clouds of colour behind the stars.
  nebula: [Rgb, Rgb];
  intensity: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  // Pixels per millisecond: nearer layers fall faster, so the page reads as climbing.
  speed: number;
  phase: number;
  brightness: number;
}

// Three depths of stars, from dust to the bright few.
const LAYERS = [
  { share: 0.6, size: [0.6, 1.1], speed: [0.003, 0.006], brightness: [0.25, 0.5] },
  { share: 0.3, size: [1, 1.6], speed: [0.008, 0.014], brightness: [0.45, 0.75] },
  { share: 0.1, size: [1.6, 2.4], speed: [0.016, 0.024], brightness: [0.75, 1] },
] as const;

const AREA_PER_STAR = 2600;
const MIN_STARS = 60;
const MAX_STARS = 320;

// Space: stars at three depths drifting down as if the reader were still rising, each twinkling on its own,
// over two faint clouds of nebula painted once per size. Stars are single rectangles, so hundreds cost little.
export class StarfieldScene implements Scene {
  public readonly id = "beyond";
  private readonly random: RandomSource;
  private readonly options: StarfieldSceneOptions;
  private stars: Star[] = [];
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
    this.stars = LAYERS.flatMap((layer) => Array.from({ length: Math.round(count * layer.share) }, () => this.createStar(layer, randomBetween(this.random, 0, height))));
    this.nebula = this.paintNebula(width, height, pixelRatio);
  }

  public update(deltaMs: number): void {
    this.stars.forEach((star) => {
      star.y += star.speed * deltaMs;
      star.phase += deltaMs * 0.002;

      if (star.y > this.height + 4) {
        star.y = -4;
        star.x = randomBetween(this.random, 0, this.width);
      }
    });
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    const strength = alpha * this.options.intensity;

    if (this.nebula) {
      context.globalAlpha = strength;
      context.drawImage(this.nebula.surface, 0, 0, this.width, this.height);
    }

    context.fillStyle = rgba(this.options.star, 1);
    this.stars.forEach((star) => {
      context.globalAlpha = Math.max(0, strength * star.brightness * (0.7 + 0.3 * Math.sin(star.phase)));
      context.fillRect(star.x, star.y, star.size, star.size);
    });
  }

  private createStar(layer: (typeof LAYERS)[number], y: number): Star {
    return {
      x: randomBetween(this.random, 0, this.width),
      y,
      size: randomBetween(this.random, layer.size[0], layer.size[1]),
      speed: randomBetween(this.random, layer.speed[0], layer.speed[1]),
      phase: randomBetween(this.random, 0, Math.PI * 2),
      brightness: randomBetween(this.random, layer.brightness[0], layer.brightness[1]),
    };
  }

  // Painted at a quarter of the size and stretched: soft clouds lose nothing, and it costs a sixteenth.
  private paintNebula(width: number, height: number, pixelRatio: number): DrawableSurface | null {
    const scale = 0.25 * pixelRatio;
    const surface = createDrawableSurface(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));

    if (!surface) {
      return null;
    }

    const { context } = surface;
    const w = width * scale;
    const h = height * scale;

    const clouds: Array<{ x: number; y: number; colour: Rgb }> = [
      { x: 0.25, y: 0.3, colour: this.options.nebula[0] },
      { x: 0.75, y: 0.7, colour: this.options.nebula[1] },
    ];

    clouds.forEach(({ x, y, colour }) => {
      const cx = w * x;
      const cy = h * y;
      const cloud = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);

      cloud.addColorStop(0, rgba(colour, 0.22));
      cloud.addColorStop(1, rgba(colour, 0));
      context.fillStyle = cloud;
      context.fillRect(0, 0, w, h);
    });

    return surface;
  }
}
