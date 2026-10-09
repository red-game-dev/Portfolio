import type { RenderLayer } from "@/packages/games/engine";

import { VoyageFrame } from "../frame";
import { RenderKit } from "./kit";

// The star's storms, seen as they cross the view: a front of hot plasma racing outward across its arc, a soft
// glow behind its leading edge.
export class WeatherLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "weather";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, camera }: VoyageFrame): void {
    if (state.phase === "lost" || state.storms.length === 0) {
      return;
    }

    const { back } = this.kit;
    const { star } = state.system;
    const x = camera.toScreenX(star.x);
    const y = camera.toScreenY(star.y);
    const away = Math.hypot(camera.x - star.x, camera.y - star.y);
    const view = Math.hypot(back.width, back.height) / camera.scale;

    back.context.globalCompositeOperation = "lighter";
    back.context.lineCap = "round";
    state.storms.forEach((storm) => {
      if (Math.abs(storm.radius - away) > view) {
        return;
      }

      const radius = storm.radius * camera.scale;
      const from = storm.angle - storm.width / 2;
      const to = storm.angle + storm.width / 2;

      [{ width: 0.9, alpha: 0.1 }, { width: 0.35, alpha: 0.22 }, { width: 0.06, alpha: 0.55 }].forEach((band) => {
        back.context.strokeStyle = `rgba(255, ${Math.round(150 + storm.strength * 60)}, 90, ${band.alpha * (0.4 + storm.strength * 0.6)})`;
        back.context.lineWidth = Math.max(1, band.width * camera.scale);
        back.context.beginPath();
        back.context.arc(x, y, Math.max(0, radius - band.width * camera.scale * 0.4), from, to);
        back.context.stroke();
      });
    });
    back.context.globalCompositeOperation = "source-over";
  }
}
