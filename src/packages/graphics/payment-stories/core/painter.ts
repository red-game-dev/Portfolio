import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { hexToRgb, rgba } from "@/packages/graphics/colour";

import {
  StoryBurst, StoryCoin, StoryFrame, StoryIcons, StoryLook, StoryNode, StoryPacket, StoryReceipt, StorySignal, StoryWire, Tone,
} from "../domain/types";
import { along, settle } from "./motion";

// Draws a story's frame in the counter's language: a drafting grid behind, wires dashed at rest and lit with a glow
// as a payment passes, the drawings' boxes with their icons glowing as it reaches them (shaking red as one fails, a
// tick or a cross drawn on its corner), the payment as a comet with a fading trail, rings and sparks where a step
// is decided, receipts as paper and coins with a gold sheen turning as they fly.

const PANEL = { width: 300, height: 210 } as const;
const NODE = { size: 38, radius: 8, icon: 16 } as const;
const WIRE_STEPS = 28;
const TRAIL = 8;

const paths = new Map<string, Path2D>();

const pathOf = (data: string): Path2D => {
  const known = paths.get(data) ?? new Path2D(data);

  paths.set(data, known);

  return known;
};

const colourOf = (tone: Tone, look: StoryLook) => (tone === "failed" ? look.failure : look.accent);

const roundRect = (context: Canvas2DContext, x: number, y: number, width: number, height: number, radius: number) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
};

const paintBackdrop = (context: Canvas2DContext, look: StoryLook) => {
  const accent = hexToRgb(look.accent);
  const glow = context.createRadialGradient(PANEL.width / 2, PANEL.height / 2, 10, PANEL.width / 2, PANEL.height / 2, PANEL.width * 0.62);

  glow.addColorStop(0, rgba(accent, 0.07));
  glow.addColorStop(1, rgba(accent, 0));
  context.fillStyle = glow;
  context.fillRect(0, 0, PANEL.width, PANEL.height);
  context.fillStyle = rgba(accent, 0.09);

  for (let x = 7; x < PANEL.width; x += 14) {
    for (let y = 7; y < PANEL.height; y += 14) {
      context.fillRect(x - 0.5, y - 0.5, 1, 1);
    }
  }
};

const traceWire = (context: Canvas2DContext, wire: StoryWire, upTo: number) => {
  const steps = Math.max(1, Math.round(WIRE_STEPS * upTo));

  context.beginPath();
  context.moveTo(wire.from.x, wire.from.y);

  for (let step = 1; step <= steps; step += 1) {
    const point = along(wire, (step / steps) * upTo);

    context.lineTo(point.x, point.y);
  }
};

const paintWire = (context: Canvas2DContext, wire: StoryWire, look: StoryLook) => {
  const colour = hexToRgb(colourOf(wire.tone, look));
  const accent = hexToRgb(look.accent);

  context.save();
  context.lineCap = "round";
  context.setLineDash([3, 4]);
  context.strokeStyle = rgba(accent, 0.22);
  context.lineWidth = 1.3;
  traceWire(context, wire, 1);
  context.stroke();
  context.setLineDash([]);

  if (wire.lit > 0) {
    traceWire(context, wire, wire.lit);
    context.globalCompositeOperation = "lighter";
    context.strokeStyle = rgba(colour, 0.18);
    context.lineWidth = 6;
    context.stroke();
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = rgba(colour, 0.9);
    context.lineWidth = 1.8;
    context.stroke();
  }

  context.restore();
};

const paintMark = (context: Canvas2DContext, node: StoryNode, look: StoryLook, x: number, y: number) => {
  if (!node.mark || node.mark.progress <= 0) {
    return;
  }

  const { kind, progress } = node.mark;
  const centre = { x: x + NODE.size / 2 - 3, y: y - NODE.size / 2 + 3 };
  const pop = settle(Math.min(1, progress * 1.6));

  context.save();
  context.translate(centre.x, centre.y);
  context.scale(pop, pop);
  context.fillStyle = kind === "cross" ? look.failure : look.accent;
  context.beginPath();
  context.arc(0, 0, 7.5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#061010";
  context.lineWidth = 1.9;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  if (kind === "tick") {
    // Its two strokes drawn in turn.
    const first = Math.min(1, progress * 2.5);
    const second = Math.max(0, Math.min(1, progress * 2.5 - 1));

    context.moveTo(-3.4, 0.2);
    context.lineTo(-3.4 + 2.2 * first, 0.2 + 2.4 * first);

    if (second > 0) {
      context.lineTo(-1.2 + 4.8 * second, 2.6 - 5.6 * second);
    }
  } else {
    const length = Math.min(1, progress * 2);

    context.moveTo(-2.8, -2.8);
    context.lineTo(-2.8 + 5.6 * length, -2.8 + 5.6 * length);
    context.moveTo(2.8, -2.8);
    context.lineTo(2.8 - 5.6 * length, -2.8 + 5.6 * length);
  }

  context.stroke();
  context.restore();
};

const paintNode = (context: Canvas2DContext, node: StoryNode, look: StoryLook, icons: StoryIcons, t: number) => {
  const colour = hexToRgb(colourOf(node.tone, look));
  const shake = Math.sin(t * 140) * 3 * node.shake;
  const x = node.at.x + shake;
  const { y } = node.at;
  const left = x - NODE.size / 2;
  const top = y - NODE.size / 2;
  const isOn = node.tone !== "idle";
  const icon = icons[node.icon];

  context.save();

  if (node.glow > 0) {
    context.shadowColor = rgba(colour, 0.9);
    context.shadowBlur = 22 * node.glow;
  }

  roundRect(context, left, top, NODE.size, NODE.size, NODE.radius);
  context.fillStyle = "#0f1413";
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = rgba(colour, isOn ? 0.55 + 0.45 * node.glow : 0.3 + 0.4 * node.glow);
  context.lineWidth = 1.2;
  context.stroke();

  if (node.glow > 0) {
    const inner = context.createRadialGradient(x, y, 2, x, y, NODE.size * 0.7);

    inner.addColorStop(0, rgba(colour, 0.28 * node.glow));
    inner.addColorStop(1, rgba(colour, 0));
    context.fillStyle = inner;
    roundRect(context, left, top, NODE.size, NODE.size, NODE.radius);
    context.fill();
  }

  const scale = NODE.icon / Math.max(icon.width, icon.height);

  context.translate(x - (icon.width * scale) / 2, y - (icon.height * scale) / 2);
  context.scale(scale, scale);
  context.fillStyle = rgba(colour, isOn ? 0.95 : 0.5);
  context.fill(pathOf(icon.path));
  context.restore();
  paintMark(context, node, look, x, y);
};

const paintPacket = (context: Canvas2DContext, packet: StoryPacket, look: StoryLook) => {
  const colour = hexToRgb(colourOf(packet.tone, look));

  context.save();
  context.globalCompositeOperation = "lighter";

  for (let index = TRAIL; index >= 1; index -= 1) {
    const behind = packet.at - packet.heading * index * 0.03;

    if (behind < 0 || behind > 1) {
      continue;
    }

    const point = along(packet.wire, behind);
    const fade = 1 - index / (TRAIL + 1);

    context.fillStyle = rgba(colour, 0.45 * fade);
    context.beginPath();
    context.arc(point.x, point.y, 3.6 * packet.size * fade, 0, Math.PI * 2);
    context.fill();
  }

  const head = along(packet.wire, packet.at);
  const glow = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, 11 * packet.size);

  glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  glow.addColorStop(0.25, rgba(colour, 0.9));
  glow.addColorStop(1, rgba(colour, 0));
  context.fillStyle = glow;
  context.beginPath();
  context.arc(head.x, head.y, 11 * packet.size, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const paintBurst = (context: Canvas2DContext, burst: StoryBurst, look: StoryLook) => {
  const colour = hexToRgb(colourOf(burst.tone, look));
  const grow = settle(burst.progress);
  const fade = 1 - burst.progress;

  context.save();
  context.globalCompositeOperation = "lighter";
  context.strokeStyle = rgba(colour, 0.8 * fade);
  context.lineWidth = 0.6 + 2 * fade;
  context.beginPath();
  context.arc(burst.at.x, burst.at.y, NODE.size / 2 + 4 + 20 * grow, 0, Math.PI * 2);
  context.stroke();
  context.lineCap = "round";

  for (let spark = 0; spark < 8; spark += 1) {
    const angle = (spark / 8) * Math.PI * 2 + 0.3;
    const from = NODE.size / 2 + 6 + 16 * grow;
    const to = from + 6 * fade;

    context.beginPath();
    context.moveTo(burst.at.x + Math.cos(angle) * from, burst.at.y + Math.sin(angle) * from);
    context.lineTo(burst.at.x + Math.cos(angle) * to, burst.at.y + Math.sin(angle) * to);
    context.stroke();
  }

  context.restore();
};

const paintReceipt = (context: Canvas2DContext, receipt: StoryReceipt, look: StoryLook) => {
  context.save();
  context.globalAlpha = receipt.opacity;
  context.translate(receipt.at.x, receipt.at.y);
  context.rotate(receipt.turn);
  context.fillStyle = "rgba(0, 0, 0, 0.45)";
  context.fillRect(-6, -8, 14, 19);
  context.fillStyle = look.paper;
  roundRect(context, -7, -9.5, 14, 19, 1.5);
  context.fill();
  context.fillStyle = "rgba(20, 30, 28, 0.45)";
  [-5, -1.5, 2].forEach((row, index) => context.fillRect(-4.5, row, index === 2 ? 5 : 9, 1.3));
  context.fillStyle = look.accent;
  context.fillRect(-4.5, 5.5, 9, 1.6);
  context.restore();
};

const paintCoin = (context: Canvas2DContext, coin: StoryCoin, look: StoryLook) => {
  const turn = Math.max(0.2, Math.abs(Math.cos(coin.spin)));
  const [light, dark] = look.gold;

  context.save();
  context.globalAlpha = coin.opacity;
  context.translate(coin.at.x, coin.at.y);
  context.shadowColor = rgba(hexToRgb(light), 0.8);
  context.shadowBlur = 12;
  context.scale(turn, 1);

  const face = context.createRadialGradient(-coin.radius * 0.35, -coin.radius * 0.4, 0, 0, 0, coin.radius);

  face.addColorStop(0, light);
  face.addColorStop(1, dark);
  context.fillStyle = face;
  context.beginPath();
  context.arc(0, 0, coin.radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = rgba(hexToRgb(dark), 0.95);
  context.lineWidth = Math.max(0.8, coin.radius * 0.14);
  context.stroke();
  context.strokeStyle = rgba(hexToRgb(light), 0.7);
  context.lineWidth = 0.8;
  context.beginPath();
  context.arc(0, 0, coin.radius * 0.62, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

const paintSignal = (context: Canvas2DContext, signal: StorySignal, look: StoryLook) => {
  const accent = hexToRgb(look.accent);

  context.save();

  for (let bar = 0; bar < 4; bar += 1) {
    const height = 4 + bar * 3;
    const isLit = !signal.isLost && bar < signal.bars;

    context.fillStyle = isLit ? rgba(accent, 0.95) : "rgba(120, 132, 129, 0.45)";
    context.fillRect(signal.at.x - 11 + bar * 6, signal.at.y - height, 4, height);
  }

  if (signal.isLost) {
    context.strokeStyle = look.failure;
    context.lineWidth = 1.8;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(signal.at.x - 13, signal.at.y + 1);
    context.lineTo(signal.at.x + 13, signal.at.y - 14);
    context.stroke();
  }

  context.restore();
};

// One frame of a story, drawn in the panel's own units (300 by 210); the caller scales the context to the canvas.
export const paintStory = (context: Canvas2DContext, frame: StoryFrame, look: StoryLook, icons: StoryIcons, t: number): void => {
  paintBackdrop(context, look);
  frame.wires.forEach((wire) => paintWire(context, wire, look));
  frame.nodes.forEach((node) => paintNode(context, node, look, icons, t));
  frame.bursts.forEach((burst) => paintBurst(context, burst, look));
  frame.packets.forEach((packet) => paintPacket(context, packet, look));
  frame.coins.forEach((coin) => paintCoin(context, coin, look));
  frame.receipts.forEach((receipt) => paintReceipt(context, receipt, look));

  if (frame.signal) {
    paintSignal(context, frame.signal, look);
  }
};
