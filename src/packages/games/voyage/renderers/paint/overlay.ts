import { Canvas2DContext } from "@/packages/graphics/canvas";

// A colour that gathers at the edges of the screen and leaves the middle clear, drawn once and stretched.
export const paintVignette = (colour: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const edge = context.createRadialGradient(c, c, c * 0.45, c, c, c * 1.05);

  edge.addColorStop(0, "rgba(0, 0, 0, 0)");
  edge.addColorStop(1, colour);
  context.fillStyle = edge;
  context.fillRect(0, 0, width, width);
};

// Dark gathering towards a point, for the last moments before a horizon.
export const paintDarkness = (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const dark = context.createRadialGradient(c, c, 0, c, c, c);

  dark.addColorStop(0, "rgba(0, 0, 0, 1)");
  dark.addColorStop(0.5, "rgba(0, 0, 0, 0.75)");
  dark.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = dark;
  context.fillRect(0, 0, width, width);
};
