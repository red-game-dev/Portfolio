import { Canvas2DContext, createGlowSprite, DrawableSurface } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface EmberSceneOptions {
  emberColor: string;
  intensity: number;
}

interface Ember {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
  sway: number;
}

const AREA_PER_EMBER = 22000;
const MIN_EMBERS = 24;
const MAX_EMBERS = 70;

// Warm embers rising and swaying, like a camp in a fantasy world. One cached glow sprite, scaled per ember.
export class EmberScene implements Scene {
  public readonly id = "mmo";
  private readonly random: RandomSource;
  private readonly options: EmberSceneOptions;
  private embers: Ember[] = [];
  private glow: DrawableSurface | null = null;
  private width = 0;
  private height = 0;

  constructor(random: RandomSource, options: EmberSceneOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height, pixelRatio }: SceneSize): void {
    const count = Math.round(Math.min(MAX_EMBERS, Math.max(MIN_EMBERS, (width * height) / AREA_PER_EMBER)));

    this.width = width;
    this.height = height;
    this.embers = Array.from({ length: count }, () => this.createEmber(randomBetween(this.random, 0, height)));
    this.glow = createGlowSprite(this.options.emberColor, 12, pixelRatio);
  }

  public update(deltaMs: number): void {
    this.embers.forEach((ember, index) => {
      ember.y -= ember.speed * deltaMs;
      ember.phase += deltaMs * 0.0015;

      if (ember.y < -20) {
        this.embers[index] = this.createEmber(this.height + 20);
      }
    });
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    if (!this.glow) {
      return;
    }

    const strength = alpha * this.options.intensity;
    const sprite = this.glow.surface;

    this.embers.forEach((ember) => {
      const flicker = 0.6 + 0.4 * Math.sin(ember.phase * 3);
      // Fade in from the bottom and out towards the top, so nothing pops.
      const height = Math.max(1, this.height);
      const fade = Math.min(1, (height - ember.y) / (height * 0.2), ember.y / (height * 0.35));
      const x = ember.x + Math.sin(ember.phase) * ember.sway;

      context.globalAlpha = Math.max(0, strength * flicker * fade);
      context.drawImage(sprite, x - ember.size, ember.y - ember.size, ember.size * 2, ember.size * 2);
    });
  }

  private createEmber(y: number): Ember {
    return {
      x: randomBetween(this.random, 0, this.width),
      y,
      speed: randomBetween(this.random, 0.012, 0.035),
      size: randomBetween(this.random, 4, 11),
      phase: randomBetween(this.random, 0, Math.PI * 2),
      sway: randomBetween(this.random, 6, 22),
    };
  }
}
