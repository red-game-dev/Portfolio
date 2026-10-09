import { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb, rgba } from "@/packages/graphics/colour";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface ChainSceneOptions {
  block: Rgb;
  flash: Rgb;
  intensity: number;
}

interface Lane {
  y: number;
  size: number;
  gap: number;
  speed: number;
  // Further lanes are dimmer, for depth.
  depth: number;
  offset: number;
}

interface Mined {
  lane: number;
  index: number;
  age: number;
}

const LANES = [
  { y: 0.2, size: 26, depth: 0.45, speed: 0.012 },
  { y: 0.55, size: 44, depth: 0.8, speed: 0.02 },
  { y: 0.85, size: 34, depth: 0.6, speed: 0.016 },
];
const MINE_EVERY_MS = 1100;
const MINED_MS = 1400;

// Chains of blocks sliding past at three depths. Every so often a block is mined: it lights up and a
// pulse runs down the chain from it. Strokes and fills only, a few dozen per frame.
export class ChainScene implements Scene {
  public readonly id = "chain";
  private readonly random: RandomSource;
  private readonly options: ChainSceneOptions;
  private lanes: Lane[] = [];
  private mined: Mined[] = [];
  private width = 0;
  private sinceMined = 0;

  constructor(random: RandomSource, options: ChainSceneOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    this.width = width;
    this.lanes = LANES.map((lane) => ({
      y: lane.y * height,
      size: lane.size,
      gap: lane.size * 1.6,
      speed: lane.speed,
      depth: lane.depth,
      offset: randomBetween(this.random, 0, lane.size * 2.6),
    }));
    this.mined = [];
  }

  public update(deltaMs: number): void {
    this.lanes.forEach((lane) => {
      lane.offset = (lane.offset + lane.speed * deltaMs) % (lane.size + lane.gap);
    });
    this.mined.forEach((block) => {
      block.age += deltaMs;
    });
    this.mined = this.mined.filter((block) => block.age < MINED_MS);
    this.sinceMined += deltaMs;

    if (this.sinceMined >= MINE_EVERY_MS && this.lanes.length > 0) {
      this.sinceMined = 0;

      const lane = Math.floor(this.random() * this.lanes.length);
      const count = this.blockCount(this.lanes[lane]);

      this.mined.push({ lane, index: Math.floor(this.random() * Math.max(1, count - 1)), age: 0 });
    }
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    const strength = alpha * this.options.intensity;

    this.lanes.forEach((lane, laneIndex) => {
      const pitch = lane.size + lane.gap;
      const count = this.blockCount(lane);
      const top = lane.y - lane.size / 2;

      context.globalAlpha = strength * lane.depth;
      context.strokeStyle = rgba(this.options.block, 0.55);
      context.lineWidth = 1;
      context.beginPath();

      for (let index = 0; index < count; index += 1) {
        const x = index * pitch - lane.offset;

        context.rect(x, top, lane.size, lane.size);
        // The hash link to the next block.
        context.moveTo(x + lane.size, lane.y);
        context.lineTo(x + pitch, lane.y);
        // Two data rows inside the block.
        context.moveTo(x + lane.size * 0.22, top + lane.size * 0.38);
        context.lineTo(x + lane.size * 0.78, top + lane.size * 0.38);
        context.moveTo(x + lane.size * 0.22, top + lane.size * 0.62);
        context.lineTo(x + lane.size * 0.6, top + lane.size * 0.62);
      }

      context.stroke();
      this.mined.filter((block) => block.lane === laneIndex).forEach((block) => this.drawMined(context, lane, block, strength));
    });

    context.globalAlpha = 1;
  }

  private drawMined(context: Canvas2DContext, lane: Lane, block: Mined, strength: number): void {
    const pitch = lane.size + lane.gap;
    const progress = block.age / MINED_MS;
    const x = block.index * pitch - lane.offset;
    const glow = 1 - progress;

    context.globalAlpha = strength * lane.depth * glow;
    context.fillStyle = rgba(this.options.block, 0.35);
    context.fillRect(x, lane.y - lane.size / 2, lane.size, lane.size);
    context.fillStyle = rgba(this.options.flash, 1);
    // The pulse runs along the links ahead of the newly mined block.
    context.fillRect(x + lane.size + progress * pitch * 4, lane.y - 1.5, 6, 3);
  }

  private blockCount(lane: Lane): number {
    return Math.ceil((this.width + lane.size * 2) / (lane.size + lane.gap)) + 1;
  }
}
