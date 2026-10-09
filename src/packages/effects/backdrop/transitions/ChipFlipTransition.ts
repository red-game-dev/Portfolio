import { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb, rgba } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { easeInOut, pulse } from "@/packages/math/easing";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { SceneSize, SceneTransition } from "../domain/types";

export interface ChipFlipTransitionOptions {
  chipColors: Rgb[];
  rim: Rgb;
}

interface Chip {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius: number;
  color: number;
  spin: number;
}

const CHIPS = 48;

// The chain into the casino: blocks tumble off their lanes and flip into chips as they scatter across the
// table.
export class ChipFlipTransition implements SceneTransition {
  private readonly random: RandomSource;
  private readonly options: ChipFlipTransitionOptions;
  private chips: Chip[] = [];

  constructor(random: RandomSource, options: ChipFlipTransitionOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    const lanes = [0.2, 0.55, 0.85];

    this.chips = Array.from({ length: CHIPS }, (_, index) => ({
      startX: randomBetween(this.random, 0, width),
      startY: lanes[index % lanes.length] * height,
      endX: randomBetween(this.random, width * 0.05, width * 0.95),
      endY: randomBetween(this.random, height * 0.05, height * 0.95),
      radius: randomBetween(this.random, 8, 18),
      color: index % Math.max(1, this.options.chipColors.length),
      spin: randomBetween(this.random, 2, 5),
    }));
  }

  public draw(context: Canvas2DContext, progress: number): void {
    const travel = easeInOut(progress);
    const strength = pulse(progress);

    context.lineWidth = 2;
    this.chips.forEach((chip) => {
      const x = chip.startX + (chip.endX - chip.startX) * travel;
      const y = chip.startY + (chip.endY - chip.startY) * travel;
      // The flip: the chip's width follows the cosine of its spin.
      const width = Math.max(0.5, chip.radius * Math.abs(Math.cos(travel * Math.PI * chip.spin)));

      context.fillStyle = rgba(this.options.chipColors[chip.color] ?? this.options.rim, strength * 0.8);
      context.strokeStyle = rgba(this.options.rim, strength * 0.7);
      context.beginPath();
      context.ellipse(x, y, width, chip.radius, 0, 0, TAU);
      context.fill();
      context.stroke();
    });
  }
}
