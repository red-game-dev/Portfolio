import type { RenderLayer } from "@/packages/games/engine";

import { VoyageFrame } from "../frame";
import { RenderKit } from "./kit";

// One number floating up off a hit, kept in a pool and used again.
interface Floating {
  x: number;
  y: number;
  text: string;
  colour: string;
  age: number;
  life: number;
  size: number;
  isLive: boolean;
}

// At most this many numbers float at once; the oldest makes way.
const MOST = 28;

// Numbers off every hit the ship lands, as games show damage: each rising and fading where it struck, a critical hit
// larger and gold; and a streak called out over the ship. Drawn from a fixed pool, so a fight makes no garbage.
export class NumbersLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "numbers";
  private readonly pool: Floating[] = Array.from({ length: MOST }, () => ({ x: 0, y: 0, text: "", colour: "", age: 0, life: 0, size: 0, isLive: false }));
  private next = 0;

  constructor(private readonly kit: RenderKit) {}

  // A number at a point in the world.
  public float(x: number, y: number, text: string, colour: string, size = 13, life = 0.9): void {
    const slot = this.pool[this.next];

    this.next = (this.next + 1) % MOST;
    slot.x = x + (Math.random() - 0.5) * 0.08;
    slot.y = y;
    slot.text = text;
    slot.colour = colour;
    slot.age = 0;
    slot.life = life;
    slot.size = size;
    slot.isLive = true;
  }

  public clear(): void {
    this.pool.forEach((slot) => {
      slot.isLive = false;
    });
  }

  public draw({ camera, dt, state }: VoyageFrame): void {
    const context = this.kit.front.context;

    if (state.phase === "lost") {
      return;
    }

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 3;
    context.strokeStyle = "rgba(5, 8, 18, 0.85)";

    for (const slot of this.pool) {
      if (!slot.isLive) {
        continue;
      }

      slot.age += dt;

      if (slot.age >= slot.life) {
        slot.isLive = false;
        continue;
      }

      const share = slot.age / slot.life;
      // Up quickly, then easing, and a little pop at first.
      const rise = (1 - (1 - share) * (1 - share)) * 34;
      const pop = share < 0.15 ? 1 + (0.15 - share) * 2.5 : 1;
      const x = camera.toScreenX(slot.x);
      const y = camera.toScreenY(slot.y) - rise;

      context.globalAlpha = share > 0.6 ? 1 - (share - 0.6) / 0.4 : 1;
      context.font = `bold ${Math.round(slot.size * pop)}px Roboto, Arial, sans-serif`;
      context.strokeText(slot.text, x, y);
      context.fillStyle = slot.colour;
      context.fillText(slot.text, x, y);
    }

    context.globalAlpha = 1;
  }
}
