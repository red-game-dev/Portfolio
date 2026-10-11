import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";

import { VoyageFrame } from "../frame";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

interface Shockwave {
  x: number;
  y: number;
  age: number;
  life: number;
  reach: number;
  colour: string | null;
}

// A railgun's line, bright and fading.
interface Beam {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  age: number;
}

const BEAM_LIFE = 0.28;

// Everything that flies apart, in two passes round the ship. Behind it: particles move and fade, and smoke and
// the pieces of a wreck are drawn, so smoke left in the ship's wake never hides it. In front: light, drawn
// additively so it glows, and shockwaves ringing outward from explosions.
export class EffectsLayer implements RenderLayer<VoyageFrame> {
  public readonly name: string;
  private readonly waves: Shockwave[] = [];
  private readonly beams: Beam[] = [];

  constructor(private readonly kit: RenderKit, private readonly pass: "behind" | "front") {
    this.name = `effects:${pass}`;
  }

  public shockwave(x: number, y: number, reach: number, life = 1.1, colour: string | null = null): void {
    this.waves.push({ x, y, age: 0, life, reach, colour });
  }

  public beam(x0: number, y0: number, x1: number, y1: number): void {
    this.beams.push({ x0, y0, x1, y1, age: 0 });
  }

  public draw({ camera, dt }: VoyageFrame): void {
    const { front, particles, theme } = this.kit;

    if (this.pass === "behind") {
      const fire = this.kit.cache.get("fire", 64, 64, paintGlow("rgba(255, 120, 40, 1)"));

      particles.update(dt, (shard) => {
        particles.emit("glow", shard.x, shard.y, shard.vx * 0.2, shard.vy * 0.2, 0.4, shard.size * 0.5, fire, { drag: 2 });
      });
      particles.draw(front, camera, ["smoke"], false);
      particles.draw(front, camera, ["shard"], false);

      return;
    }

    particles.draw(front, camera, ["glow"], true);

    for (let index = this.waves.length - 1; index >= 0; index -= 1) {
      const wave = this.waves[index];

      wave.age += dt;

      if (wave.age >= wave.life) {
        this.waves.splice(index, 1);
        continue;
      }

      const progress = wave.age / wave.life;

      front.context.strokeStyle = wave.colour ?? theme.flameCore;
      front.context.globalAlpha = 1 - progress;
      front.context.lineWidth = 1 + (1 - progress) * 4;
      front.context.beginPath();
      front.context.arc(camera.toScreenX(wave.x), camera.toScreenY(wave.y), progress * wave.reach * camera.scale, 0, TAU);
      front.context.stroke();
    }

    front.context.globalAlpha = 1;
    this.drawBeams(camera, dt);
  }

  public clear(): void {
    this.waves.length = 0;
    this.beams.length = 0;
    this.kit.particles.clear();
  }

  // Each railgun line, a white core in a cyan glow, narrowing as it fades.
  private drawBeams(camera: VoyageFrame["camera"], dt: number): void {
    const context = this.kit.front.context;

    for (let index = this.beams.length - 1; index >= 0; index -= 1) {
      const beam = this.beams[index];

      beam.age += dt;

      if (beam.age >= BEAM_LIFE) {
        this.beams.splice(index, 1);
        continue;
      }

      const left = 1 - beam.age / BEAM_LIFE;
      const x0 = camera.toScreenX(beam.x0);
      const y0 = camera.toScreenY(beam.y0);
      const x1 = camera.toScreenX(beam.x1);
      const y1 = camera.toScreenY(beam.y1);

      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";
      context.strokeStyle = "rgba(125, 249, 255, 1)";
      context.globalAlpha = left * 0.6;
      context.lineWidth = 9 * left;
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.stroke();
      context.strokeStyle = "#ffffff";
      context.globalAlpha = left;
      context.lineWidth = 2.5 * left;
      context.stroke();
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }
}
