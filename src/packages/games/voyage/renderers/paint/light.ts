import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";

// A soft disc of light, `colour` at its centre fading to nothing at `radius`: lamps, engines and eyes on a hull.
export const glow = (context: Canvas2DContext, x: number, y: number, radius: number, colour: string) => {
  const light = context.createRadialGradient(x, y, 0, x, y, radius);

  light.addColorStop(0, colour);
  light.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = light;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
};
