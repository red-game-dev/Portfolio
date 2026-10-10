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
}

// Everything that flies apart, in two passes round the ship. Behind it: particles move and fade, and smoke and
// the pieces of a wreck are drawn, so smoke left in the ship's wake never hides it. In front: light, drawn
// additively so it glows, and shockwaves ringing outward from explosions.
export class EffectsLayer implements RenderLayer<VoyageFrame> {
  public readonly name: string;
  private readonly waves: Shockwave[] = [];

  constructor(private readonly kit: RenderKit, private readonly pass: "behind" | "front") {
    this.name = `effects:${pass}`;
  }

  public shockwave(x: number, y: number, reach: number, life = 1.1): void {
    this.waves.push({ x, y, age: 0, life, reach });
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

      front.context.strokeStyle = theme.flameCore;
      front.context.globalAlpha = 1 - progress;
      front.context.lineWidth = 1 + (1 - progress) * 4;
      front.context.beginPath();
      front.context.arc(camera.toScreenX(wave.x), camera.toScreenY(wave.y), progress * wave.reach * camera.scale, 0, TAU);
      front.context.stroke();
    }

    front.context.globalAlpha = 1;
  }

  public clear(): void {
    this.waves.length = 0;
    this.kit.particles.clear();
  }
}
