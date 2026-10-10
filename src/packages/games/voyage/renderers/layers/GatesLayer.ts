import type { RenderLayer } from "@/packages/games/engine";
import { hexWithAlpha } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { fill } from "@/packages/text/format";

import { VoyageFrame } from "../frame";
import { RenderKit } from "./kit";

// A gate is never drawn smaller than this on screen (CSS pixels), so one far off can still be found.
const SMALLEST = 12;
// How fast its rings turn (radians per ms).
const SPIN = 0.0012;

// The gates of a maze universe: a ring in the universe's own colour, its arcs turning, the space inside it swirling
// towards the system it leads to, that system's name above it (marked once it has been reached, and as the way on
// once that is known).
export class GatesLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "gates";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, world, camera, universe, theme, now }: VoyageFrame): void {
    const { network } = state;

    if (state.phase !== "universe" || !network || world.stores.gate.size === 0) {
      return;
    }

    const context = this.kit.front.context;
    const accent = universe?.accent ?? theme.danger;

    world.stores.gate.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);

      if (!body || !camera.sees(body.x, body.y, body.radius * 4)) {
        return;
      }

      const { to } = world.stores.gate.values[index];
      const x = camera.toScreenX(body.x);
      const y = camera.toScreenY(body.y);
      const radius = Math.max(SMALLEST, body.radius * camera.scale);
      const inner = context.createRadialGradient(x, y, 0, x, y, radius);
      const turn = now * SPIN;

      inner.addColorStop(0, hexWithAlpha(accent, 0.55));
      inner.addColorStop(0.6, hexWithAlpha(accent, 0.18));
      inner.addColorStop(1, hexWithAlpha(accent, 0));
      context.fillStyle = inner;
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.fill();
      context.strokeStyle = accent;
      context.lineWidth = Math.max(2, radius * 0.08);

      for (let arc = 0; arc < 3; arc += 1) {
        const from = turn * (arc % 2 === 0 ? 1 : -1.4) + (arc * TAU) / 3;

        context.globalAlpha = 0.9 - arc * 0.2;
        context.beginPath();
        context.arc(x, y, radius * (1 - arc * 0.16), from, from + TAU / 4);
        context.stroke();
      }

      context.globalAlpha = 1;

      const place = network.nodes[to];
      const isReached = state.explored.has(to);
      const mark = isReached ? this.kit.labels[to === network.exit ? "gateWayOn" : "gateVisited"] : undefined;
      const label = mark ? fill(mark, { name: place.name }) : place.name;

      context.font = "bold 11px Roboto, Arial, sans-serif";
      context.textAlign = "center";
      context.fillStyle = "#ffffff";
      context.fillText(label, x, y - radius - 8);
      context.textAlign = "start";
    });
  }
}
