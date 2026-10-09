import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";

import { HullTier } from "../../economy/domain/economy";
import { glow } from "./light";
import { paintShip, SHIP_WIDTH } from "./space";

export interface HullColours {
  hull: string;
  hullShade: string;
  window: string;
  fin: string;
  accent: string;
}

// Where each hull's engines sit, as shares of its radius from its centre (nose up), and how big each is; and
// the colour of what comes out of them: fire for the chemical rockets, blue ion light for the great ships.
export interface Nozzle {
  x: number;
  y: number;
  size: number;
}

export const NOZZLES: Readonly<Record<HullTier, readonly Nozzle[]>> = {
  rocket: [{ x: 0, y: 0.9, size: 1 }],
  shuttle: [{ x: 0, y: 0.92, size: 0.8 }, { x: -0.3, y: 0.88, size: 0.45 }, { x: 0.3, y: 0.88, size: 0.45 }],
  corvette: [{ x: -0.62, y: 0.96, size: 0.62 }, { x: 0.62, y: 0.96, size: 0.62 }],
  starship: [{ x: -0.28, y: 0.96, size: 0.55 }, { x: 0, y: 0.96, size: 0.6 }, { x: 0.28, y: 0.96, size: 0.55 }, { x: -0.85, y: 0.92, size: 0.32 },
    { x: 0.85, y: 0.92, size: 0.32 }],
  intergalactic: [{ x: 0, y: 0.84, size: 1.15 }],
};

export const ION_TIERS: readonly HullTier[] = ["starship", "intergalactic"];

type Painter = (context: Canvas2DContext, x: number, y: number, r: number, colours: HullColours) => void;

const steel = (context: Canvas2DContext, x: number, r: number, { hull, hullShade }: HullColours, spread = 0.5) => {
  const fill = context.createLinearGradient(x - r * spread, 0, x + r * spread, 0);

  fill.addColorStop(0, hullShade);
  fill.addColorStop(0.45, hull);
  fill.addColorStop(1, hullShade);

  return fill;
};

const polygon = (context: Canvas2DContext, points: ReadonlyArray<[number, number]>) => {
  context.beginPath();
  points.forEach(([px, py], index) => (index === 0 ? context.moveTo(px, py) : context.lineTo(px, py)));
  context.closePath();
  context.fill();
};

const nozzle = (context: Canvas2DContext, x: number, y: number, r: number, size: number) => {
  context.fillStyle = "#1a1f2c";
  context.beginPath();
  context.ellipse(x, y, r * 0.16 * size, r * 0.07 * size, 0, 0, TAU);
  context.fill();
};

// A shuttle, as an orbiter: delta wings with black leading edges, a rounded nose under a black heat shield, the
// cockpit's windows, the payload bay's doors, and a main engine between two small ones.
const shuttle: Painter = (context, x, y, r, colours) => {
  context.fillStyle = colours.fin;
  polygon(context, [[x - r * 0.3, y - r * 0.35], [x - r * 1.18, y + r * 0.92], [x - r * 0.32, y + r * 0.92]]);
  polygon(context, [[x + r * 0.3, y - r * 0.35], [x + r * 1.18, y + r * 0.92], [x + r * 0.32, y + r * 0.92]]);
  context.strokeStyle = "#141821";
  context.lineWidth = r * 0.07;
  context.beginPath();
  context.moveTo(x - r * 0.3, y - r * 0.35);
  context.lineTo(x - r * 1.18, y + r * 0.92);
  context.moveTo(x + r * 0.3, y - r * 0.35);
  context.lineTo(x + r * 1.18, y + r * 0.92);
  context.stroke();
  context.fillStyle = colours.accent;
  context.fillRect(x - r * 0.95, y + r * 0.62, r * 0.4, r * 0.07);
  context.fillRect(x + r * 0.55, y + r * 0.62, r * 0.4, r * 0.07);
  context.fillStyle = steel(context, x, r, colours, 0.45);
  context.beginPath();
  context.moveTo(x, y - r * 1.58);
  context.bezierCurveTo(x + r * 0.46, y - r * 1.5, x + r * 0.44, y - r * 0.9, x + r * 0.42, y - r * 0.6);
  context.lineTo(x + r * 0.42, y + r * 0.88);
  context.lineTo(x - r * 0.42, y + r * 0.88);
  context.lineTo(x - r * 0.42, y - r * 0.6);
  context.bezierCurveTo(x - r * 0.44, y - r * 0.9, x - r * 0.46, y - r * 1.5, x, y - r * 1.58);
  context.fill();
  context.fillStyle = "#1b1f29";
  context.beginPath();
  context.moveTo(x, y - r * 1.58);
  context.bezierCurveTo(x + r * 0.3, y - r * 1.54, x + r * 0.36, y - r * 1.35, x + r * 0.38, y - r * 1.25);
  context.lineTo(x - r * 0.38, y - r * 1.25);
  context.bezierCurveTo(x - r * 0.36, y - r * 1.35, x - r * 0.3, y - r * 1.54, x, y - r * 1.58);
  context.fill();
  context.fillStyle = colours.window;
  [-0.2, 0, 0.2].forEach((at) => context.fillRect(x + r * (at - 0.07), y - r * 1.1, r * 0.14, r * 0.12));
  context.strokeStyle = "rgba(0, 0, 0, 0.25)";
  context.lineWidth = Math.max(1, r * 0.025);
  context.beginPath();
  context.moveTo(x, y - r * 0.85);
  context.lineTo(x, y + r * 0.55);
  context.moveTo(x - r * 0.28, y - r * 0.85);
  context.lineTo(x - r * 0.28, y + r * 0.55);
  context.moveTo(x + r * 0.28, y - r * 0.85);
  context.lineTo(x + r * 0.28, y + r * 0.55);
  context.stroke();
};

// A corvette: an arrowhead of armour with twin engine pods, a long canopy, and a gun forward on each shoulder.
const corvette: Painter = (context, x, y, r, colours) => {
  context.fillStyle = colours.fin;
  [-1, 1].forEach((side) => {
    context.beginPath();
    context.ellipse(x + side * r * 0.62, y + r * 0.5, r * 0.2, r * 0.5, 0, 0, TAU);
    context.fill();
  });
  context.strokeStyle = colours.hullShade;
  context.lineWidth = r * 0.06;
  context.beginPath();
  context.moveTo(x - r * 0.55, y - r * 0.3);
  context.lineTo(x - r * 0.55, y - r * 0.95);
  context.moveTo(x + r * 0.55, y - r * 0.3);
  context.lineTo(x + r * 0.55, y - r * 0.95);
  context.stroke();
  context.fillStyle = steel(context, x, r, colours, 0.75);
  polygon(context, [
    [x, y - r * 1.6],
    [x + r * 0.32, y - r * 0.9],
    [x + r * 0.78, y - r * 0.2],
    [x + r * 0.46, y + r * 0.35],
    [x + r * 0.5, y + r * 0.92],
    [x - r * 0.5, y + r * 0.92],
    [x - r * 0.46, y + r * 0.35],
    [x - r * 0.78, y - r * 0.2],
    [x - r * 0.32, y - r * 0.9],
  ]);
  context.strokeStyle = "rgba(0, 0, 0, 0.3)";
  context.lineWidth = Math.max(1, r * 0.025);
  context.beginPath();
  context.moveTo(x, y - r * 1.2);
  context.lineTo(x, y + r * 0.9);
  context.moveTo(x - r * 0.6, y - r * 0.2);
  context.lineTo(x + r * 0.6, y - r * 0.2);
  context.stroke();
  context.fillStyle = colours.accent;
  polygon(context, [[x, y - r * 1.6], [x + r * 0.12, y - r * 1.3], [x - r * 0.12, y - r * 1.3]]);
  context.fillStyle = colours.window;
  context.beginPath();
  context.ellipse(x, y - r * 0.72, r * 0.13, r * 0.32, 0, 0, TAU);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.beginPath();
  context.ellipse(x - r * 0.04, y - r * 0.82, r * 0.04, r * 0.12, 0, 0, TAU);
  context.fill();
};

// A starship: a long spine with a broad command deck forward, two nacelles on pylons glowing at their bows, an
// engine block astern, and its windows lit.
const starship: Painter = (context, x, y, r, colours) => {
  context.strokeStyle = colours.hullShade;
  context.lineWidth = r * 0.08;
  context.beginPath();
  context.moveTo(x - r * 0.25, y + r * 0.25);
  context.lineTo(x - r * 0.85, y + r * 0.05);
  context.moveTo(x + r * 0.25, y + r * 0.25);
  context.lineTo(x + r * 0.85, y + r * 0.05);
  context.stroke();
  [-1, 1].forEach((side) => {
    context.fillStyle = steel(context, x + side * r * 0.85, r, colours, 0.14);
    context.beginPath();
    context.ellipse(x + side * r * 0.85, y + r * 0.3, r * 0.13, r * 0.62, 0, 0, TAU);
    context.fill();
    glow(context, x + side * r * 0.85, y - r * 0.28, r * 0.2, colours.accent);
  });
  context.fillStyle = steel(context, x, r, colours, 0.3);
  polygon(context, [[x, y - r * 1.62], [x + r * 0.18, y - r * 1.2], [x + r * 0.2, y + r * 0.55], [x - r * 0.2, y + r * 0.55], [x - r * 0.18, y - r * 1.2]]);
  context.fillStyle = steel(context, x, r, colours, 0.62);
  context.beginPath();
  context.ellipse(x, y - r * 0.95, r * 0.58, r * 0.3, 0, 0, TAU);
  context.fill();
  context.fillRect(x - r * 0.5, y + r * 0.5, r * 1, r * 0.44);
  context.fillStyle = colours.accent;
  context.fillRect(x - r * 0.5, y + r * 0.5, r * 1, r * 0.06);
  context.fillStyle = colours.window;

  for (let index = 0; index < 7; index += 1) {
    context.fillRect(x - r * 0.04, y - r * 0.6 + index * r * 0.15, r * 0.08, r * 0.05);
  }

  [-0.36, -0.18, 0, 0.18, 0.36].forEach((at) => context.fillRect(x + r * at - r * 0.03, y - r * 0.98, r * 0.06, r * 0.06));
};

// An intergalactic starship: a long pearl hull lined with light, a warp ring held round its waist on four
// struts, a sensor glowing at its bow, and one great ion drive.
const intergalactic: Painter = (context, x, y, r, colours) => {
  const ringY = y + r * 0.2;

  context.strokeStyle = colours.hullShade;
  context.lineWidth = r * 0.06;
  context.beginPath();
  [[-1.05, 0], [1.05, 0], [-0.6, -0.27], [0.6, -0.27]].forEach(([dx, dy]) => {
    context.moveTo(x, ringY);
    context.lineTo(x + r * dx, ringY + r * dy);
  });
  context.stroke();
  context.lineWidth = r * 0.14;
  context.strokeStyle = colours.hullShade;
  context.beginPath();
  context.ellipse(x, ringY, r * 1.1, r * 0.32, 0, Math.PI, TAU);
  context.stroke();
  context.fillStyle = steel(context, x, r, colours, 0.4);
  context.beginPath();
  context.moveTo(x, y - r * 1.62);
  context.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 0.42, y + r * 0.4, x + r * 0.22, y + r * 0.86);
  context.lineTo(x - r * 0.22, y + r * 0.86);
  context.bezierCurveTo(x - r * 0.42, y + r * 0.4, x - r * 0.5, y - r * 1.1, x, y - r * 1.62);
  context.fill();
  context.strokeStyle = colours.accent;
  context.lineWidth = Math.max(1, r * 0.035);
  context.beginPath();
  context.moveTo(x - r * 0.16, y - r * 1.1);
  context.quadraticCurveTo(x - r * 0.3, y - r * 0.2, x - r * 0.14, y + r * 0.7);
  context.moveTo(x + r * 0.16, y - r * 1.1);
  context.quadraticCurveTo(x + r * 0.3, y - r * 0.2, x + r * 0.14, y + r * 0.7);
  context.stroke();
  glow(context, x, y - r * 1.35, r * 0.18, colours.accent);
  context.fillStyle = colours.window;
  context.beginPath();
  context.ellipse(x, y - r * 0.75, r * 0.1, r * 0.22, 0, 0, TAU);
  context.fill();
  context.lineWidth = r * 0.14;
  context.strokeStyle = colours.hullShade;
  context.beginPath();
  context.ellipse(x, ringY, r * 1.1, r * 0.32, 0, 0, Math.PI);
  context.stroke();
  context.lineWidth = r * 0.05;
  context.strokeStyle = colours.accent;
  context.beginPath();
  context.ellipse(x, ringY, r * 1.1, r * 0.32, 0, 0, TAU);
  context.stroke();
};

const PAINTERS: Readonly<Record<Exclude<HullTier, "rocket">, Painter>> = { shuttle, corvette, starship, intergalactic };

// The ship's sprite for its hull and mark, nose up in a box `SHIP_WIDTH` by `SHIP_HEIGHT` radii: each hull its own
// shape, with a chevron in the universe's colour for every mark past the first, and its engines' mouths.
export const paintHull = (tier: HullTier, mark: number, colours: HullColours) => (context: Canvas2DContext, width: number, height: number) => {
  const r = width / SHIP_WIDTH;
  const x = width / 2;
  const y = height / 2;

  if (tier === "rocket") {
    paintShip(colours)(context, width, height);
  } else {
    PAINTERS[tier](context, x, y, r, colours);
  }

  context.strokeStyle = colours.accent;
  context.lineWidth = Math.max(1, r * 0.05);
  context.lineCap = "round";

  for (let index = 1; index < mark; index += 1) {
    const at = y + r * (0.05 + index * 0.13);

    context.beginPath();
    context.moveTo(x - r * 0.18, at + r * 0.07);
    context.lineTo(x, at);
    context.lineTo(x + r * 0.18, at + r * 0.07);
    context.stroke();
  }

  if (tier !== "rocket") {
    NOZZLES[tier].forEach((engine) => nozzle(context, x + engine.x * r, y + engine.y * r, r, engine.size));
  }
};
