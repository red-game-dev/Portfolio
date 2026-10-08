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
  // Where along its ray it starts, and how fast it grows.
  start: number;
  speed: number;
}

const STREAKS = 140;

// The game world into space: light stretches into streaks racing out from the centre, a flash as the jump
// lands, and the stars on the other side settle in behind it.
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
      start: randomBetween(this.random, 0.02, 0.3),
      speed: randomBetween(this.random, 0.6, 1.2),
    }));
  }

  public draw(context: Canvas2DContext, progress: number): void {
    const centreX = this.width / 2;
    const centreY = this.height / 2;
    const reach = Math.hypot(this.width, this.height) / 2;
    const strength = pulse(progress);
    // The streaks stretch fastest in the middle of the jump.
    const stretch = progress * progress * 1.6;

    context.strokeStyle = rgba(this.options.streak, 0.75 * strength);
    context.lineWidth = 1.5;
    context.beginPath();
    this.streaks.forEach((streak) => {
      const from = reach * Math.min(1, streak.start + stretch * streak.speed * 0.4);
      const to = reach * Math.min(1.2, streak.start + stretch * streak.speed);
      const cos = Math.cos(streak.angle);
      const sin = Math.sin(streak.angle);

      context.moveTo(centreX + cos * from, centreY + sin * from);
      context.lineTo(centreX + cos * to, centreY + sin * to);
    });
    context.stroke();

    // A flash as the jump lands, brightest just past the middle.
    const flash = pulse(Math.min(1, Math.max(0, (progress - 0.45) / 0.35)));

    if (flash > 0) {
      context.fillStyle = rgba(this.options.flash, 0.28 * flash);
      context.fillRect(0, 0, this.width, this.height);
    }
  }
}
