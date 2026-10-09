import { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { SceneSize, SceneTransition } from "../domain/types";
import { pulse, Rgb, rgba } from "../utils/colour";

export interface PortalTransitionOptions {
  ring: Rgb;
  glow: Rgb;
}

interface Spark {
  angle: number;
  speed: number;
}

const RINGS = 3;
const SPARKS = 90;

// The Universe into the game world: a portal opens at the centre, rings of light burst outward and sparks
// fly, and the world on the other side fades in behind them.
export class PortalTransition implements SceneTransition {
  private readonly random: RandomSource;
  private readonly options: PortalTransitionOptions;
  private sparks: Spark[] = [];
  private width = 0;
  private height = 0;

  constructor(random: RandomSource, options: PortalTransitionOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    this.width = width;
    this.height = height;
    this.sparks = Array.from({ length: SPARKS }, () => ({
      angle: randomBetween(this.random, 0, TAU),
      speed: randomBetween(this.random, 0.4, 1),
    }));
  }

  public draw(context: Canvas2DContext, progress: number): void {
    const centreX = this.width / 2;
    const centreY = this.height / 2;
    const reach = Math.hypot(this.width, this.height) / 2;
    const strength = pulse(progress);
    const glow = context.createRadialGradient(centreX, centreY, 0, centreX, centreY, reach * 0.6 * progress + 1);

    glow.addColorStop(0, rgba(this.options.glow, 0.35 * strength));
    glow.addColorStop(1, rgba(this.options.glow, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, this.width, this.height);

    for (let ring = 0; ring < RINGS; ring += 1) {
      const local = Math.min(1, Math.max(0, progress * 1.4 - ring * 0.18));

      if (local > 0 && local < 1) {
        context.strokeStyle = rgba(this.options.ring, (1 - local) * 0.9);
        context.lineWidth = 2 + (1 - local) * 4;
        context.beginPath();
        context.arc(centreX, centreY, reach * local, 0, TAU);
        context.stroke();
      }
    }

    context.fillStyle = rgba(this.options.ring, strength);
    this.sparks.forEach((spark) => {
      const distance = reach * progress * spark.speed;

      context.fillRect(centreX + Math.cos(spark.angle) * distance, centreY + Math.sin(spark.angle) * distance, 2, 2);
    });
  }
}
