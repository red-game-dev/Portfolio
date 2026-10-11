import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";

import { VoyageFrame } from "../frame";
import { RenderKit } from "./kit";
import { drawEdgeArrow, isWellInView } from "./pointer";

// The beacon's colour, how big it is on screen at least (CSS pixels), and how fast it flashes (radians per ms).
const BEACON = "#ffb347";
const SMALLEST = 7;
const FLASH = 0.009;

// A call for help: the beacon flashing where it drifts, its signal rippling out, and while survivors come aboard a
// ring filling round it; out of view, an arrow at the screen's edge pointing the way, with the seconds it has left.
export class DistressLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "distress";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, camera, config, now }: VoyageFrame): void {
    const call = state.distress;

    if (!call || state.status !== "flying") {
      return;
    }

    const { front } = this.kit;
    const context = front.context;
    const x = camera.toScreenX(call.x);
    const y = camera.toScreenY(call.y);
    const seconds = Math.max(0, Math.ceil((call.until - state.elapsedMs) / 1000));
    const label = `${this.kit.labels.distress ?? ""} ${seconds}s`;

    if (!isWellInView(front, x, y)) {
      drawEdgeArrow(front, x, y, BEACON, label, now);

      return;
    }

    const reach = config.distress.reach * camera.scale;
    const flash = 0.5 + Math.sin(now * FLASH) * 0.5;
    const ripple = (now * 0.0006) % 1;

    context.strokeStyle = BEACON;
    context.fillStyle = BEACON;
    context.lineWidth = 2;
    context.globalAlpha = (1 - ripple) * 0.7;
    context.beginPath();
    context.arc(x, y, SMALLEST + ripple * Math.max(40, reach), 0, TAU);
    context.stroke();
    context.globalAlpha = 0.25;
    context.setLineDash([4, 6]);
    context.beginPath();
    context.arc(x, y, Math.max(SMALLEST * 2, reach), 0, TAU);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 0.6 + flash * 0.4;
    context.beginPath();
    context.arc(x, y, SMALLEST * (0.8 + flash * 0.4), 0, TAU);
    context.fill();

    if (call.held > 0) {
      context.globalAlpha = 1;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x, y, SMALLEST * 2.4, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, call.held / config.distress.hold));
      context.stroke();
    }

    context.globalAlpha = 0.9;
    context.font = "600 11px Roboto, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(label, x, y - Math.max(SMALLEST * 3, reach) - 6);
    context.textAlign = "start";
    context.globalAlpha = 1;
  }
}
