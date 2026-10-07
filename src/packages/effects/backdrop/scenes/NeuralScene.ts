import { Canvas2DContext, createGlowSprite, DrawableSurface } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface NeuralSceneOptions {
  // "r, g, b", so link strength can be applied as alpha without parsing colours each frame.
  linkRgb: string;
  nodeColor: string;
  pulseColor: string;
  intensity: number;
}

interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Pulse {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

const AREA_PER_NODE = 16000;
const MIN_NODES = 28;
const MAX_NODES = 90;
const MAX_PULSES = 10;
const LINK_LEVELS = 4;

// A slow drifting network: nodes link when close, and signals travel along the links. Links are batched
// into a few alpha levels so each level is one stroke call.
export class NeuralScene implements Scene {
  public readonly id = "ai";
  private readonly random: RandomSource;
  private readonly options: NeuralSceneOptions;
  private readonly linkPaths: number[][] = Array.from({ length: LINK_LEVELS }, () => []);
  private nodes: NeuralNode[] = [];
  private pulses: Pulse[] = [];
  private width = 0;
  private height = 0;
  private linkDistance = 140;
  private glow: DrawableSurface | null = null;

  constructor(random: RandomSource, options: NeuralSceneOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height, pixelRatio }: SceneSize): void {
    const count = Math.round(Math.min(MAX_NODES, Math.max(MIN_NODES, (width * height) / AREA_PER_NODE)));

    this.width = width;
    this.height = height;
    this.linkDistance = Math.min(170, Math.max(110, width / 7));
    this.nodes = Array.from({ length: count }, () => ({
      x: randomBetween(this.random, 0, width),
      y: randomBetween(this.random, 0, height),
      vx: randomBetween(this.random, -0.012, 0.012),
      vy: randomBetween(this.random, -0.012, 0.012),
    }));
    this.pulses = [];
    this.glow = createGlowSprite(this.options.pulseColor, 9, pixelRatio);
  }

  public update(deltaMs: number): void {
    this.nodes.forEach((node) => {
      node.x += node.vx * deltaMs;
      node.y += node.vy * deltaMs;

      if (node.x < 0 || node.x > this.width) {
        node.vx *= -1;
      }

      if (node.y < 0 || node.y > this.height) {
        node.vy *= -1;
      }
    });

    this.pulses = this.pulses.filter((pulse) => {
      pulse.progress += pulse.speed * deltaMs;

      return pulse.progress < 1;
    });

    if (this.pulses.length < MAX_PULSES && this.random() < 0.08) {
      this.spawnPulse();
    }
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    const strength = alpha * this.options.intensity;

    this.drawLinks(context, strength);

    context.globalAlpha = strength * 0.8;
    context.fillStyle = this.options.nodeColor;
    this.nodes.forEach((node) => context.fillRect(Math.round(node.x) - 1, Math.round(node.y) - 1, 2, 2));

    if (this.glow) {
      context.globalAlpha = strength;
      this.pulses.forEach((pulse) => {
        const from = this.nodes[pulse.from];
        const to = this.nodes[pulse.to];
        const x = from.x + (to.x - from.x) * pulse.progress;
        const y = from.y + (to.y - from.y) * pulse.progress;

        context.drawImage((this.glow as DrawableSurface).surface, x - 9, y - 9, 18, 18);
      });
    }
  }

  private drawLinks(context: Canvas2DContext, strength: number): void {
    const maxSquared = this.linkDistance * this.linkDistance;

    this.linkPaths.forEach((path) => {
      path.length = 0;
    });

    for (let first = 0; first < this.nodes.length; first += 1) {
      for (let second = first + 1; second < this.nodes.length; second += 1) {
        const a = this.nodes[first];
        const b = this.nodes[second];
        const distanceSquared = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

        if (distanceSquared < maxSquared) {
          const level = Math.min(LINK_LEVELS - 1, Math.floor((1 - Math.sqrt(distanceSquared) / this.linkDistance) * LINK_LEVELS));

          this.linkPaths[level].push(a.x, a.y, b.x, b.y);
        }
      }
    }

    context.lineWidth = 1;
    this.linkPaths.forEach((path, level) => {
      if (path.length === 0) {
        return;
      }

      context.globalAlpha = 1;
      context.strokeStyle = `rgba(${this.options.linkRgb}, ${(strength * 0.35 * ((level + 1) / LINK_LEVELS)).toFixed(3)})`;
      context.beginPath();

      for (let index = 0; index < path.length; index += 4) {
        context.moveTo(path[index], path[index + 1]);
        context.lineTo(path[index + 2], path[index + 3]);
      }

      context.stroke();
    });
  }

  private spawnPulse(): void {
    const from = Math.floor(this.random() * this.nodes.length);
    const origin = this.nodes[from];
    const maxSquared = this.linkDistance * this.linkDistance;
    const neighbours = this.nodes
      .map((node, index) => ({ index, distance: (node.x - origin.x) ** 2 + (node.y - origin.y) ** 2 }))
      .filter((candidate) => candidate.index !== from && candidate.distance < maxSquared);

    if (neighbours.length === 0) {
      return;
    }

    const target = neighbours[Math.floor(this.random() * neighbours.length)];

    this.pulses.push({ from, to: target.index, progress: 0, speed: randomBetween(this.random, 0.0007, 0.0014) });
  }
}
