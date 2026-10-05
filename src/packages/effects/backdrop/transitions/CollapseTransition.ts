import { Canvas2DContext } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { SceneSize, SceneTransition } from "../domain/types";
import { mixRgb, pulse, Rgb, rgba } from "../utils/colour";
import { easeInOut } from "../utils/easing";

export interface CollapseTransitionOptions {
  from: Rgb;
  to: Rgb;
  fontFamily: string;
}

interface Particle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  glyph: string;
}

const PARTICLES = 140;

// Matrix into AI: falling bits stop, drift to new positions and become the nodes of a network, linking up
// as they arrive.
export class CollapseTransition implements SceneTransition {
  private readonly random: RandomSource;
  private readonly options: CollapseTransitionOptions;
  private particles: Particle[] = [];

  constructor(random: RandomSource, options: CollapseTransitionOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    this.particles = Array.from({ length: PARTICLES }, () => ({
      startX: randomBetween(this.random, 0, width),
      startY: randomBetween(this.random, -height * 0.2, height),
      endX: randomBetween(this.random, width * 0.05, width * 0.95),
      endY: randomBetween(this.random, height * 0.05, height * 0.95),
      glyph: this.random() < 0.5 ? "0" : "1",
    }));
  }

  public draw(context: Canvas2DContext, progress: number): void {
    const travel = easeInOut(progress);
    const colour = mixRgb(this.options.from, this.options.to, travel);
    const strength = pulse(progress);
    const positions = this.particles.map((particle) => ({
      x: particle.startX + (particle.endX - particle.startX) * travel,
      y: particle.startY + (particle.endY - particle.startY) * travel,
    }));

    if (travel > 0.55) {
      context.strokeStyle = rgba(colour, (travel - 0.55) * strength * 0.9);
      context.lineWidth = 1;
      context.beginPath();
      positions.forEach((point, index) => {
        const next = positions[(index + 7) % positions.length];

        context.moveTo(point.x, point.y);
        context.lineTo(next.x, next.y);
      });
      context.stroke();
    }

    context.font = `14px ${this.options.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    positions.forEach((point, index) => {
      if (travel < 0.6) {
        context.fillStyle = rgba(colour, strength * (1 - travel));
        context.fillText(this.particles[index].glyph, point.x, point.y);
      }

      if (travel > 0.35) {
        context.fillStyle = rgba(colour, strength * travel);
        context.fillRect(point.x - 1.5, point.y - 1.5, 3, 3);
      }
    });
  }
}
