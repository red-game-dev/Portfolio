import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";

import { Paint } from "../SurfaceCache";

// A station as a space game draws one, seen from above: a turning ring of habitats on four spokes round a docking hub,
// with solar wings either side and running lights; the ring and lights in the colours of whoever keeps it.
export const paintStation = (hull: string, trim: string, light: string): Paint => (context: Canvas2DContext, width: number, height: number) => {
  const size = Math.min(width, height);
  const ring = size * 0.34;

  context.save();
  context.translate(width / 2, height / 2);

  // Solar wings.
  context.fillStyle = "#1f3b6b";
  context.strokeStyle = "#7fa6d9";
  context.lineWidth = Math.max(1, size * 0.008);
  [-1, 1].forEach((side) => {
    context.fillRect(side * size * 0.38 - (side < 0 ? size * 0.1 : 0), -size * 0.06, size * 0.1, size * 0.12);
    context.strokeRect(side * size * 0.38 - (side < 0 ? size * 0.1 : 0), -size * 0.06, size * 0.1, size * 0.12);
  });

  // Spokes and the ring.
  context.strokeStyle = trim;
  context.lineWidth = Math.max(1, size * 0.03);
  context.beginPath();

  for (let spoke = 0; spoke < 4; spoke += 1) {
    const angle = (spoke / 4) * TAU + TAU / 8;

    context.moveTo(0, 0);
    context.lineTo(Math.cos(angle) * ring, Math.sin(angle) * ring);
  }

  context.stroke();
  context.lineWidth = Math.max(2, size * 0.07);
  context.strokeStyle = hull;
  context.beginPath();
  context.arc(0, 0, ring, 0, TAU);
  context.stroke();
  context.lineWidth = Math.max(1, size * 0.015);
  context.strokeStyle = trim;
  context.beginPath();
  context.arc(0, 0, ring + size * 0.035, 0, TAU);
  context.stroke();

  // Habitat windows round the ring.
  context.fillStyle = light;

  for (let window = 0; window < 16; window += 1) {
    const angle = (window / 16) * TAU;

    context.beginPath();
    context.arc(Math.cos(angle) * ring, Math.sin(angle) * ring, Math.max(0.8, size * 0.011), 0, TAU);
    context.fill();
  }

  // The hub, its docking port lit.
  const hub = context.createRadialGradient(-size * 0.03, -size * 0.03, 0, 0, 0, size * 0.12);

  hub.addColorStop(0, "#e8edf5");
  hub.addColorStop(1, hull);
  context.fillStyle = hub;
  context.beginPath();
  context.arc(0, 0, size * 0.11, 0, TAU);
  context.fill();
  context.fillStyle = light;
  context.beginPath();
  context.arc(0, 0, size * 0.035, 0, TAU);
  context.fill();
  context.restore();
};
