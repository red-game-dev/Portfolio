import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";

import { VoyageFrame } from "../frame";
import { RenderKit } from "./kit";

// How often a meteor starts (ms) on a shower's ordinary nights and on its peak, how long each burns (ms), and how
// long its streak is (CSS pixels at most).
const EVERY_MS = 900;
const PEAK_EVERY_MS = 320;
const BURN_MS = 650;
const LENGTH = 160;

// A number from 0 to 1 that is always the same for the same meteor, so each one keeps its path while it burns.
const draw = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;

  return x - Math.floor(x);
};

// A real meteor shower, seen from our solar system: streaks of light across the sky, all from one direction (the
// shower's radiant), more of them on the peak night. Only while a shower is on and the ship flies at home.
export class MeteorsLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "meteors";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, now }: VoyageFrame): void {
    const shower = state.sky.find((event) => event.kind === "shower");

    if (!shower || state.status !== "flying" || (state.phase !== "solar" && state.phase !== "singularity")) {
      return;
    }

    const { back } = this.kit;
    const context = back.context;
    const every = shower.isPeak ? PEAK_EVERY_MS : EVERY_MS;
    const radiant = draw(shower.id.length * 7.3) * TAU;
    const latest = Math.floor(now / every);

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";

    for (let index = latest - Math.ceil(BURN_MS / every); index <= latest; index += 1) {
      const age = (now - index * every) / BURN_MS;

      if (age < 0 || age > 1) {
        continue;
      }

      const angle = radiant + (draw(index) - 0.5) * 0.5;
      const x = draw(index + 0.31) * back.width;
      const y = draw(index + 0.67) * back.height;
      const travel = LENGTH * (0.6 + draw(index + 0.11) * 0.8);
      const head = { x: x + Math.cos(angle) * travel * age, y: y + Math.sin(angle) * travel * age };
      const tail = { x: head.x - Math.cos(angle) * travel * 0.6, y: head.y - Math.sin(angle) * travel * 0.6 };
      const streak = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
      const fade = Math.sin(age * Math.PI);

      streak.addColorStop(0, "rgba(255, 255, 255, 0)");
      streak.addColorStop(1, `rgba(255, 244, 214, ${0.85 * fade})`);
      context.strokeStyle = streak;
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(tail.x, tail.y);
      context.lineTo(head.x, head.y);
      context.stroke();
    }

    context.restore();
  }
}
