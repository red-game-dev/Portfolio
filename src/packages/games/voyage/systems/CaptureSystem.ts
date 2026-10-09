import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { clearSpace, placeBody, shipOf } from "./queries";

// Falling into a black hole: the ship spirals in, faster and closer as it goes, until it crosses the horizon and
// is gone; then everything else in that space is left behind and the ship is lost between universes.
export class CaptureSystem implements System<VoyageContext> {
  public readonly name = "capture";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, events } = context;
    const capture = state.capture;
    const parts = shipOf(context);

    if (!capture || !parts || state.status !== "flying") {
      return;
    }

    capture.progress = Math.min(1, capture.progress + (dt * 1000) / config.holes.captureMs);
    capture.angle += dt * (2.5 + capture.progress * 16);

    const distance = capture.from * (1 - capture.progress) ** 1.6;
    const x = capture.centre.x + Math.cos(capture.angle) * distance;
    const y = capture.centre.y + Math.sin(capture.angle) * distance;

    parts.body.prevX = parts.body.x;
    parts.body.prevY = parts.body.y;
    parts.body.x = x;
    parts.body.y = y;
    parts.body.vx = 0;
    parts.body.vy = 0;
    // Nose first, along the fall.
    parts.ship.angle = capture.angle + Math.PI;

    if (capture.progress >= 1) {
      clearSpace(context);
      placeBody(parts.body, x, y, 0, 0);
      state.phase = "lost";
      state.phaseMs = 0;
      parts.ship.landedOn = null;
      events.emit("phase", { phase: "lost", universe: state.universe });
    }
  }
}
