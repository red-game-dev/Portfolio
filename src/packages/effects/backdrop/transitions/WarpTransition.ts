import { Canvas2DContext } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { SceneSize, SceneTransition } from "../domain/types";
import { pulse, Rgb, rgba } from "../utils/colour";

export interface WarpTransitionOptions {
  streak: Rgb;
  flash: Rgb;
}

interface Streak {
  angle: number;
  offset: number;
  speed: number;
}

const STREAKS = 180;

// AI into the Universe: the network stretches into star streaks as if jumping to light speed, with a soft
// flash at the peak.
export class WarpTransition implements SceneTransition {
  private readonly random: RandomSource;
  private readonly options: WarpTransitionOptions;
  private streaks: Streak[] = [];
  private width = 0;
  private height = 0;

  constructor(random: RandomSource, options: WarpTransitionOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    this.width = width;
    this.height = height;
    this.streaks = Array.from({ length: STREAKS }, () => ({
      angle: randomBetween(this.random, 0, Math.PI * 2),
      offset: randomBetween(this.random, 0.02, 0.3),
      speed: randomBetween(this.random, 0.6, 1.4),
    }));
  }

  public draw(context: Canvas2DContext, progress: number): void {
    const centreX = this.width / 2;
    const centreY = this.height / 2;
    const reach = Math.hypot(this.width, this.height) / 2;
    const strength = pulse(progress);

    context.lineWidth = 1.2;
    context.strokeStyle = rgba(this.options.streak, strength * 0.85);
    context.beginPath();
    this.streaks.forEach((streak) => {
      const start = reach * (streak.offset + progress * progress * streak.speed);
      const length = reach * 0.35 * progress * streak.speed;
      const cos = Math.cos(streak.angle);
      const sin = Math.sin(streak.angle);

      context.moveTo(centreX + cos * start, centreY + sin * start);
      context.lineTo(centreX + cos * (start + length), centreY + sin * (start + length));
    });
    context.stroke();

    context.fillStyle = rgba(this.options.flash, 0.18 * strength ** 4);
    context.fillRect(0, 0, this.width, this.height);
  }
}
