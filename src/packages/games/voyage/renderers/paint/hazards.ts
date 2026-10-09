import { Canvas2DContext } from "@/packages/graphics/canvas";
import { createSeededRandom } from "@/packages/math/random";

import { PickupKind } from "../../domain/components";
import { VoyageStyle } from "../../domain/theme";

const TAU = Math.PI * 2;

// The invader every pixel world has, eleven by eight.
const INVADER = [
  "..X.....X..",
  "...X...X...",
  "..XXXXXXX..",
  ".XX.XXX.XX.",
  "XXXXXXXXXXX",
  "X.XXXXXXX.X",
  "X.X.....X.X",
  "...XX.XX...",
];

// A rock of the solar system: lumpy, cratered, lit from below. Icy past Neptune.
export const paintRock = (shape: number, isIcy: boolean) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const r = width / 2.4;
  const random = createSeededRandom(shape * 101 + 7);
  const corners = 9 + (shape % 4);
  const fill = context.createRadialGradient(c, c + r * 0.5, r * 0.1, c, c, r * 1.1);

  fill.addColorStop(0, isIcy ? "#d6e6f2" : "#a49686");
  fill.addColorStop(1, isIcy ? "#4d6578" : "#3e3630");
  context.fillStyle = fill;
  context.beginPath();

  for (let index = 0; index < corners; index += 1) {
    const angle = (index / corners) * TAU;
    const reach = r * (0.74 + random() * 0.3);

    context[index === 0 ? "moveTo" : "lineTo"](c + Math.cos(angle) * reach, c + Math.sin(angle) * reach);
  }

  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.14)";
  context.lineWidth = Math.max(1, r * 0.05);
  context.stroke();
  context.fillStyle = "rgba(0, 0, 0, 0.28)";

  for (let index = 0; index < 3; index += 1) {
    context.beginPath();
    context.arc(c + (random() - 0.5) * r, c + (random() - 0.5) * r, r * (0.1 + random() * 0.12), 0, TAU);
    context.fill();
  }
};

// A broken block of the Matrix: chamfered, split into red and cyan, with scan lines across it.
const glitch = (context: Canvas2DContext, c: number, r: number, colour: string, accent: string) => {
  const step = r / 3;
  const layers: Array<[number, string]> = [[-r * 0.08, "rgba(255, 0, 80, 0.7)"], [r * 0.08, "rgba(0, 255, 255, 0.6)"], [0, colour]];
  const outline: Array<[number, number]> = [[-r + step, -r], [r - step, -r], [r, -r + step], [r, r - step], [r - step, r], [-r + step, r], [-r, r - step],
    [-r, -r + step]];

  layers.forEach(([shift, tone]) => {
    context.fillStyle = tone;
    context.beginPath();
    outline.forEach(([x, y], index) => context[index === 0 ? "moveTo" : "lineTo"](c + x + shift, c + y));
    context.closePath();
    context.fill();
  });

  context.fillStyle = accent;

  for (let y = c - r + step * 0.5; y < c + r; y += step * 0.6) {
    context.fillRect(c - r * 0.7, y, r * 1.4, Math.max(1, r * 0.06));
  }
};

const hallucination = (context: Canvas2DContext, c: number, r: number, colour: string) => {
  const glow = context.createRadialGradient(c, c, 0, c, c, r);

  glow.addColorStop(0, "#ffffff");
  glow.addColorStop(0.3, colour);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.beginPath();

  for (let index = 0; index < 24; index += 1) {
    const reach = index % 2 === 0 ? r : r * 0.45;
    const angle = (index / 24) * TAU;

    context[index === 0 ? "moveTo" : "lineTo"](c + Math.cos(angle) * reach, c + Math.sin(angle) * reach);
  }

  context.closePath();
  context.fill();
  context.fillStyle = "#0a0a14";
  context.beginPath();
  context.arc(c, c, r * 0.16, 0, TAU);
  context.fill();
};

const cube = (context: Canvas2DContext, c: number, r: number, colour: string) => {
  const w = r * 0.88;
  const h = r * 0.5;
  const faces: Array<[string, Array<[number, number]>]> = [
    ["rgba(255, 255, 255, 0.85)", [[c, c - r], [c + w, c - r + h], [c, c - r + h * 2], [c - w, c - r + h]]],
    [colour, [[c - w, c - r + h], [c, c - r + h * 2], [c, c + r], [c - w, c + r - h]]],
    ["rgba(30, 20, 60, 0.95)", [[c + w, c - r + h], [c, c - r + h * 2], [c, c + r], [c + w, c + r - h]]],
  ];

  faces.forEach(([tone, points]) => {
    context.fillStyle = tone;
    context.beginPath();
    points.forEach(([x, y], index) => context[index === 0 ? "moveTo" : "lineTo"](x, y));
    context.closePath();
    context.fill();
  });

  context.globalAlpha = 0.5;
  context.fillStyle = colour;
  context.beginPath();
  faces[0][1].forEach(([x, y], index) => context[index === 0 ? "moveTo" : "lineTo"](x, y));
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
};

const chip = (context: Canvas2DContext, c: number, r: number, colour: string) => {
  context.fillStyle = colour;
  context.beginPath();
  context.arc(c, c, r, 0, TAU);
  context.fill();
  context.fillStyle = "#ffffff";

  for (let index = 0; index < 8; index += 1) {
    context.save();
    context.translate(c, c);
    context.rotate((index / 8) * TAU);
    context.fillRect(-r * 0.12, -r, r * 0.24, r * 0.26);
    context.restore();
  }

  context.fillStyle = "rgba(0, 0, 0, 0.3)";
  context.beginPath();
  context.arc(c, c, r * 0.62, 0, TAU);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.8)";
  context.setLineDash([r * 0.18, r * 0.12]);
  context.lineWidth = Math.max(1, r * 0.07);
  context.beginPath();
  context.arc(c, c, r * 0.48, 0, TAU);
  context.stroke();
  context.setLineDash([]);
};

const invader = (context: Canvas2DContext, c: number, r: number, colour: string) => {
  const cell = Math.max(1, Math.floor((r * 2) / INVADER[0].length));
  const left = c - (cell * INVADER[0].length) / 2;
  const top = c - (cell * INVADER.length) / 2;

  context.fillStyle = colour;
  INVADER.forEach((row, y) => {
    Array.from(row).forEach((mark, x) => {
      if (mark === "X") {
        context.fillRect(left + x * cell, top + y * cell, cell, cell);
      }
    });
  });
};

// What drifts through each universe, in its colour.
export const paintHazard = (style: VoyageStyle, colour: string, accent: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const r = width / 2.4;

  if (style === "matrix") {
    glitch(context, c, r * 0.8, colour, accent);
  } else if (style === "neural") {
    hallucination(context, c, r, colour);
  } else if (style === "blocks") {
    cube(context, c, r, colour);
  } else if (style === "chips") {
    chip(context, c, r, colour);
  } else {
    invader(context, c, r, colour);
  }
};

// Something to catch: a Red Coin (a gold disc with a raised rim and an R struck in it), a ring with a cross for
// shields, a canister for fuel, a wrench cross for hull repair, each with a soft glow round it.
export const paintPickup = (kind: PickupKind, colour: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const r = width / 2;
  const glow = context.createRadialGradient(c, c, 0, c, c, r);

  glow.addColorStop(0, "rgba(255, 255, 255, 0.35)");
  glow.addColorStop(0.28, colour);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, width);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(1.5, r * 0.09);

  if (kind === "coin") {
    const face = context.createRadialGradient(c - r * 0.15, c - r * 0.15, r * 0.05, c, c, r * 0.52);

    face.addColorStop(0, "#fff3c4");
    face.addColorStop(0.6, colour);
    face.addColorStop(1, "#b07a10");
    context.fillStyle = face;
    context.beginPath();
    context.arc(c, c, r * 0.52, 0, TAU);
    context.fill();
    context.strokeStyle = "#8a5a00";
    context.lineWidth = Math.max(1, r * 0.06);
    context.beginPath();
    context.arc(c, c, r * 0.4, 0, TAU);
    context.stroke();
    context.fillStyle = "#8a5a00";
    context.font = `bold ${Math.round(r * 0.52)}px Roboto, Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("R", c, c + r * 0.03);
  } else if (kind === "shield") {
    context.beginPath();
    context.arc(c, c, r * 0.46, 0, TAU);
    context.stroke();
    context.fillRect(c - r * 0.06, c - r * 0.24, r * 0.12, r * 0.48);
    context.fillRect(c - r * 0.24, c - r * 0.06, r * 0.48, r * 0.12);
  } else if (kind === "fuel") {
    context.fillRect(c - r * 0.2, c - r * 0.28, r * 0.4, r * 0.56);
    context.fillRect(c - r * 0.08, c - r * 0.38, r * 0.16, r * 0.1);
    context.fillStyle = colour;
    context.fillRect(c - r * 0.12, c - r * 0.05, r * 0.24, r * 0.25);
  } else if (kind === "repair") {
    context.save();
    context.translate(c, c);
    context.rotate(Math.PI / 4);
    context.fillRect(-r * 0.07, -r * 0.34, r * 0.14, r * 0.68);
    context.fillRect(-r * 0.34, -r * 0.07, r * 0.68, r * 0.14);
    context.restore();
  }
};
