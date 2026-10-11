import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";

import { VoyageFrame } from "../frame";
import { paintStation } from "../paint/stations";
import { RenderKit } from "./kit";

// A station is never drawn smaller than this on screen (CSS pixels), its ring turns this fast (radians per ms), and
// the colours of a free port and of our own.
const SMALLEST = 18;
const SPIN = 0.00025;
const FREE_PORT: [string, string, string] = ["#c9d1e0", "#5f6b85", "#ffd76a"];
const DOCK = "#7dffb0";

// The ports: each station on its orbit, its ring turning, in the colours of whoever keeps it; and round the port the
// ship is alongside slowly enough to dock at (a station, or a trader), a ring with the way to dock.
export class StationsLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "stations";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, world, camera, now }: VoyageFrame): void {
    const { front } = this.kit;

    for (const port of state.stations) {
      if (!camera.sees(port.x, port.y, port.radius * 3)) {
        continue;
      }

      const colours = state.cosmos?.factions[port.faction]?.colours ?? FREE_PORT;
      const drawn = Math.max(SMALLEST, port.radius * 2 * camera.scale);
      const size = Math.max(32, Math.round(drawn / 16) * 16);
      const sprite = this.kit.sprite(`station:${colours.join()}:${size}`, size, size, paintStation(colours[0], colours[1], colours[2]));

      front.blit(sprite, camera.toScreenX(port.x), camera.toScreenY(port.y), drawn, drawn, now * SPIN + port.seed);
    }

    const { dockable } = state;

    if (!dockable || state.docked) {
      return;
    }

    const at = dockable.kind === "station"
      ? state.stations.find((port) => port.id === dockable.id)
      : world.stores.body.get(Number(dockable.id.slice("trader:".length)));

    if (!at) {
      return;
    }

    const context = front.context;
    const x = camera.toScreenX(at.x);
    const y = camera.toScreenY(at.y);
    const ring = Math.max(SMALLEST, at.radius * camera.scale) + 10 + Math.sin(now * 0.005) * 3;

    context.strokeStyle = DOCK;
    context.fillStyle = DOCK;
    context.lineWidth = 2;
    context.setLineDash([6, 5]);
    context.lineDashOffset = -now * 0.02;
    context.beginPath();
    context.arc(x, y, ring, 0, TAU);
    context.stroke();
    context.setLineDash([]);
    context.font = "600 12px Roboto, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(this.kit.labels.dock ?? "", x, y - ring - 8);
    context.textAlign = "start";
  }
}
