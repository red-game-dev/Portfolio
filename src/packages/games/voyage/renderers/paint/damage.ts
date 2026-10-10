import { Canvas2DContext, createDrawableSurface, DrawableSurface } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";
import { createSeededRandom } from "@/packages/math/random";

// A dent: a dark hollow with a bright lip where the light catches the bent metal.
export const paintDent = (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const hollow = context.createRadialGradient(c, c, 0, c, c, c);

  hollow.addColorStop(0, "rgba(20, 24, 34, 0.75)");
  hollow.addColorStop(0.65, "rgba(40, 46, 60, 0.4)");
  hollow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = hollow;
  context.fillRect(0, 0, width, width);
  context.strokeStyle = "rgba(255, 255, 255, 0.45)";
  context.lineWidth = Math.max(1, width * 0.05);
  context.beginPath();
  context.arc(c, c, c * 0.55, Math.PI * 1.1, Math.PI * 1.75);
  context.stroke();
};

// A scorch: soot spreading in an uneven blot.
export const paintScorch = (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const random = createSeededRandom(13);

  for (let index = 0; index < 7; index += 1) {
    const x = c + (random() - 0.5) * c * 0.8;
    const y = c + (random() - 0.5) * c * 0.8;
    const r = c * (0.35 + random() * 0.4);
    const soot = context.createRadialGradient(x, y, 0, x, y, r);

    soot.addColorStop(0, "rgba(28, 20, 14, 0.55)");
    soot.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = soot;
    context.fillRect(0, 0, width, width);
  }
};

// A breach: the hull torn open, glowing at the edges, with cracks running out.
export const paintBreach = (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const random = createSeededRandom(29);
  const ember = context.createRadialGradient(c, c, 0, c, c, c * 0.55);

  paintScorch(context, width);
  ember.addColorStop(0, "rgba(255, 240, 200, 1)");
  ember.addColorStop(0.3, "rgba(255, 140, 50, 0.95)");
  ember.addColorStop(1, "rgba(120, 20, 0, 0)");
  context.fillStyle = ember;
  context.beginPath();

  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * TAU;
    const reach = c * (0.18 + random() * 0.22);

    context[index === 0 ? "moveTo" : "lineTo"](c + Math.cos(angle) * reach, c + Math.sin(angle) * reach);
  }

  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(255, 170, 80, 0.85)";
  context.lineWidth = Math.max(1, width * 0.03);

  for (let index = 0; index < 5; index += 1) {
    const angle = random() * TAU;
    let x = c;
    let y = c;

    context.beginPath();
    context.moveTo(x, y);

    for (let segment = 0; segment < 3; segment += 1) {
      x += Math.cos(angle + (random() - 0.5)) * c * 0.22;
      y += Math.sin(angle + (random() - 0.5)) * c * 0.22;
      context.lineTo(x, y);
    }

    context.stroke();
  }
};

// The shield as a thin bubble round the ship, brightest at its edge.
export const paintShieldRing = (colour: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const ring = context.createRadialGradient(c, c, c * 0.72, c, c, c);

  ring.addColorStop(0, "rgba(0, 0, 0, 0)");
  ring.addColorStop(0.8, colour);
  ring.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = ring;
  context.fillRect(0, 0, width, width);
};

// The ship seen as it falls towards a horizon: its light stretched to red.
export const tintRed = (source: DrawableSurface) => (context: Canvas2DContext, width: number, height: number) => {
  context.drawImage(source.surface, 0, 0, width, height);
  context.globalCompositeOperation = "source-atop";
  context.fillStyle = "rgba(255, 40, 10, 0.85)";
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";
};

// The ship broken into wedges from its centre, each its own sprite, for the pieces that fly apart.
export const cutShards = (source: DrawableSurface, count: number, seed: number): Array<{ surface: DrawableSurface; angle: number }> => {
  const random = createSeededRandom(seed);
  const { width, height } = source.surface;
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.hypot(width, height);
  const cuts = Array.from({ length: count }, (_, index) => ((index + random() * 0.6) / count) * TAU).sort((first, second) => first - second);

  return cuts.flatMap((from, index) => {
    const to = index + 1 < cuts.length ? cuts[index + 1] : cuts[0] + TAU;
    const shard = createDrawableSurface(width, height);

    if (!shard) {
      return [];
    }

    shard.context.beginPath();
    shard.context.moveTo(cx, cy);
    shard.context.lineTo(cx + Math.cos(from) * reach, cy + Math.sin(from) * reach);
    shard.context.lineTo(cx + Math.cos((from + to) / 2) * reach, cy + Math.sin((from + to) / 2) * reach);
    shard.context.lineTo(cx + Math.cos(to) * reach, cy + Math.sin(to) * reach);
    shard.context.closePath();
    shard.context.clip();
    shard.context.drawImage(source.surface, 0, 0);

    return [{ surface: shard, angle: (from + to) / 2 }];
  });
};
