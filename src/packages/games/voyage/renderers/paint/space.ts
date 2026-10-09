import { Canvas2DContext } from "@/packages/graphics/canvas";
import { createSeededRandom } from "@/packages/math/random";

import { VoyageStyle } from "../../domain/types";

const TAU = Math.PI * 2;

// One layer of stars, a screen tall, scrolled and drawn twice to wrap. The far layer also carries the faint band
// of the Milky Way.
export const paintStars = (layer: 0 | 1 | 2, colour: string, pixelRatio: number) => (context: Canvas2DContext, width: number, height: number) => {
  const random = createSeededRandom(11 + layer * 13);
  const area = width * height / (pixelRatio * pixelRatio);
  const count = Math.round(area / [5200, 15000, 42000][layer]);

  if (layer === 0) {
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(-0.5);

    const band = context.createLinearGradient(0, -height * 0.22, 0, height * 0.22);

    band.addColorStop(0, "rgba(0, 0, 0, 0)");
    band.addColorStop(0.5, "rgba(160, 175, 255, 0.07)");
    band.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = band;
    context.fillRect(-width, -height * 0.22, width * 2, height * 0.44);
    context.fillStyle = colour;

    for (let index = 0; index < count * 0.8; index += 1) {
      context.globalAlpha = 0.15 + random() * 0.3;
      context.fillRect((random() - 0.5) * width * 1.8, (random() - 0.5) * height * 0.3, pixelRatio * 0.7, pixelRatio * 0.7);
    }

    context.restore();
  }

  context.fillStyle = colour;

  for (let index = 0; index < count; index += 1) {
    const size = pixelRatio * [0.6 + random() * 0.6, 1 + random() * 0.8, 1.4 + random() * 1.2][layer];
    const x = random() * width;
    const y = random() * height;

    context.globalAlpha = [0.3 + random() * 0.4, 0.55 + random() * 0.35, 0.85][layer];
    context.fillRect(x, y, size, size);

    if (layer === 2) {
      // A soft halo round the nearest stars.
      context.globalAlpha = 0.18;
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size * 2.6, 0, TAU);
      context.fill();
    }
  }

  context.globalAlpha = 1;
};

const nebula = (context: Canvas2DContext, width: number, height: number, colour: string, seed: number) => {
  const random = createSeededRandom(seed);

  for (let index = 0; index < 4; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = Math.max(width, height) * (0.25 + random() * 0.3);
    const cloud = context.createRadialGradient(x, y, 0, x, y, r);

    cloud.addColorStop(0, colour);
    cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalAlpha = 0.12 + random() * 0.08;
    context.fillStyle = cloud;
    context.fillRect(0, 0, width, height);
  }

  context.globalAlpha = 1;
};

const matrixRain = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(21);
  const size = 14 * pixelRatio;

  context.font = `${size}px monospace`;
  context.fillStyle = accent;

  for (let x = 0; x < width; x += size * 1.25) {
    const length = 6 + Math.floor(random() * 22);
    const head = random() * height;

    for (let index = 0; index < length; index += 1) {
      context.globalAlpha = (1 - index / length) * (index === 0 ? 0.9 : 0.4);
      context.fillText(random() > 0.5 ? "1" : "0", x, (head - index * size + height) % height);
    }
  }

  context.globalAlpha = 1;
};

const neuralNet = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(31);
  const nodes = Array.from({ length: 34 }, () => ({ x: random() * width, y: random() * height }));
  const reach = Math.min(width, height) * 0.28;

  context.strokeStyle = accent;
  context.lineWidth = pixelRatio;
  nodes.forEach((from, index) => {
    nodes.slice(index + 1).forEach((to) => {
      const distance = Math.hypot(from.x - to.x, from.y - to.y);

      if (distance < reach) {
        context.globalAlpha = 0.22 * (1 - distance / reach);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
    });
  });
  context.fillStyle = accent;
  nodes.forEach((node) => {
    context.globalAlpha = 0.5;
    context.beginPath();
    context.arc(node.x, node.y, pixelRatio * (1.5 + random() * 2.5), 0, TAU);
    context.fill();
  });
  context.globalAlpha = 1;
};

const blockLattice = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(41);
  const size = 46 * pixelRatio;

  context.strokeStyle = accent;
  context.lineWidth = pixelRatio;

  for (let y = 0; y < height + size; y += size * 1.5) {
    for (let x = (y / (size * 1.5)) % 2 === 0 ? 0 : size; x < width + size; x += size * 2) {
      if (random() > 0.32) {
        continue;
      }

      const h = size * 0.5;

      context.globalAlpha = 0.25;
      context.beginPath();
      context.moveTo(x, y - size);
      context.lineTo(x + size, y - size + h);
      context.lineTo(x + size, y + h);
      context.lineTo(x, y + size);
      context.lineTo(x - size, y + h);
      context.lineTo(x - size, y - size + h);
      context.closePath();
      context.moveTo(x - size, y - size + h);
      context.lineTo(x, y);
      context.lineTo(x + size, y - size + h);
      context.moveTo(x, y);
      context.lineTo(x, y + size);
      context.stroke();
    }
  }

  context.globalAlpha = 1;
};

const suits = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(51);
  const marks = ["♠", "♥", "♦", "♣"];

  for (let index = 0; index < 34; index += 1) {
    const size = (16 + random() * 28) * pixelRatio;

    context.font = `${size}px serif`;
    context.globalAlpha = 0.1 + random() * 0.16;
    context.fillStyle = random() > 0.5 ? accent : "#ffffff";
    context.fillText(marks[index % marks.length], random() * width, random() * height);
  }

  context.globalAlpha = 1;
};

const pixelSky = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(61);
  const cell = 6 * pixelRatio;

  context.fillStyle = "#ffffff";

  for (let index = 0; index < 70; index += 1) {
    context.globalAlpha = 0.3 + random() * 0.5;
    context.fillRect(Math.floor(random() * width / cell) * cell, Math.floor(random() * height / cell) * cell, cell / 2, cell / 2);
  }

  // A few blocky planets.
  for (let planet = 0; planet < 3; planet += 1) {
    const radius = (4 + Math.floor(random() * 6)) * cell;
    const cx = Math.floor(random() * width / cell) * cell;
    const cy = Math.floor(random() * height / cell) * cell;

    for (let y = -radius; y <= radius; y += cell) {
      for (let x = -radius; x <= radius; x += cell) {
        if (x * x + y * y <= radius * radius) {
          context.globalAlpha = y > radius * 0.2 ? 0.18 : 0.32;
          context.fillStyle = (x + y) / cell % 3 === 0 ? "#ffffff" : accent;
          context.fillRect(cx + x, cy + y, cell, cell);
        }
      }
    }
  }

  context.globalAlpha = 1;
};

// A universe's backdrop, a screen tall: a nebula in its colours under what it is made of.
export const paintUniverse = (style: VoyageStyle, accent: string, pixelRatio: number) => (context: Canvas2DContext, width: number, height: number) => {
  nebula(context, width, height, accent, style.length * 7);

  if (style === "matrix") {
    matrixRain(context, width, height, accent, pixelRatio);
  } else if (style === "neural") {
    neuralNet(context, width, height, accent, pixelRatio);
  } else if (style === "blocks") {
    blockLattice(context, width, height, accent, pixelRatio);
  } else if (style === "chips") {
    suits(context, width, height, accent, pixelRatio);
  } else {
    pixelSky(context, width, height, accent, pixelRatio);
  }
};

// The light bent round a black hole: a dark well, the bright photon ring at its edge, and starlight smeared into
// arcs. Its picture is `lensReach` horizons across from the centre.
export const LENS_REACH = 4.4;

export const paintLens = (colour: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const horizon = c / LENS_REACH;
  const random = createSeededRandom(71);
  const well = context.createRadialGradient(c, c, horizon, c, c, c);

  well.addColorStop(0, "rgba(0, 0, 0, 0.95)");
  well.addColorStop(0.18, "rgba(10, 14, 40, 0.55)");
  well.addColorStop(0.45, "rgba(80, 100, 200, 0.08)");
  well.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = well;
  context.fillRect(0, 0, width, width);
  context.strokeStyle = colour;
  context.lineCap = "round";

  for (let index = 0; index < 46; index += 1) {
    const radius = horizon * (1.4 + random() * (LENS_REACH - 1.6));
    const start = random() * TAU;

    context.globalAlpha = 0.12 + random() * 0.3 * (horizon * 2 / radius);
    context.lineWidth = Math.max(1, horizon * (0.02 + random() * 0.04));
    context.beginPath();
    context.arc(c, c, radius, start, start + 0.2 + random() * 0.7);
    context.stroke();
  }

  context.globalAlpha = 1;
};

// The disk of gas round the hole, seen face on: hot white near the middle, burning orange out to the edge, with
// spiral streaks. Drawn squashed and turning, it becomes the tilted disk. Its picture is `diskReach` horizons out.
export const DISK_REACH = 3.3;

export const paintDisk = (hot: string, cool: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const horizon = c / DISK_REACH;
  const random = createSeededRandom(81);
  const gas = context.createRadialGradient(c, c, horizon * 1.15, c, c, c);

  gas.addColorStop(0, "rgba(0, 0, 0, 0)");
  gas.addColorStop(0.06, hot);
  gas.addColorStop(0.3, cool);
  gas.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gas;
  context.beginPath();
  context.arc(c, c, c, 0, TAU);
  context.arc(c, c, horizon * 1.1, 0, TAU, true);
  context.fill();
  context.strokeStyle = hot;
  context.lineCap = "round";

  for (let index = 0; index < 60; index += 1) {
    const radius = horizon * (1.3 + random() * (DISK_REACH - 1.5));
    const start = random() * TAU;

    context.globalAlpha = 0.15 + random() * 0.35;
    context.lineWidth = Math.max(1, horizon * 0.03);
    context.beginPath();
    context.arc(c, c, radius, start, start + 0.4 + random() * 0.8);
    context.stroke();
  }

  context.globalAlpha = 1;
};

export interface ShipColours {
  hull: string;
  hullShade: string;
  window: string;
  fin: string;
  accent: string;
}

// The ship, nose up, in a surface 2.6 radii wide and 3.4 tall; its centre is the middle of the hull.
export const SHIP_WIDTH = 2.6;
export const SHIP_HEIGHT = 3.4;

export const paintShip = ({ hull, hullShade, window, fin, accent }: ShipColours) => (context: Canvas2DContext, width: number, height: number) => {
  const r = width / SHIP_WIDTH;
  const x = width / 2;
  const y = height / 2;

  context.fillStyle = fin;
  context.beginPath();
  context.moveTo(x - r * 0.42, y + r * 0.1);
  context.lineTo(x - r * 1.15, y + r * 1.05);
  context.lineTo(x - r * 0.38, y + r * 0.85);
  context.moveTo(x + r * 0.42, y + r * 0.1);
  context.lineTo(x + r * 1.15, y + r * 1.05);
  context.lineTo(x + r * 0.38, y + r * 0.85);
  context.fill();
  context.fillStyle = accent;
  context.fillRect(x - r * 1.0, y + r * 0.86, r * 0.32, r * 0.08);
  context.fillRect(x + r * 0.68, y + r * 0.86, r * 0.32, r * 0.08);

  const body = context.createLinearGradient(x - r * 0.5, 0, x + r * 0.5, 0);

  body.addColorStop(0, hullShade);
  body.addColorStop(0.45, hull);
  body.addColorStop(1, hullShade);
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(x, y - r * 1.6);
  context.quadraticCurveTo(x + r * 0.62, y - r * 0.75, x + r * 0.48, y + r * 0.95);
  context.lineTo(x - r * 0.48, y + r * 0.95);
  context.quadraticCurveTo(x - r * 0.62, y - r * 0.75, x, y - r * 1.6);
  context.fill();
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(x, y - r * 1.6);
  context.quadraticCurveTo(x + r * 0.28, y - r * 1.25, x + r * 0.36, y - r * 1.02);
  context.lineTo(x - r * 0.36, y - r * 1.02);
  context.quadraticCurveTo(x - r * 0.28, y - r * 1.25, x, y - r * 1.6);
  context.fill();
  context.fillStyle = window;
  context.beginPath();
  context.arc(x, y - r * 0.38, r * 0.22, 0, TAU);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.8)";
  context.beginPath();
  context.arc(x - r * 0.07, y - r * 0.46, r * 0.07, 0, TAU);
  context.fill();
};

// The exhaust, a teardrop from the nozzle down, stretched each frame to the thrust.
export const paintFlame = (core: string, edge: string) => (context: Canvas2DContext, width: number, height: number) => {
  const x = width / 2;
  const flame = context.createLinearGradient(0, 0, 0, height);

  flame.addColorStop(0, core);
  flame.addColorStop(0.35, edge);
  flame.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = flame;
  context.beginPath();
  context.moveTo(x - width * 0.45, 0);
  context.quadraticCurveTo(x, height * 1.15, x + width * 0.45, 0);
  context.closePath();
  context.fill();
};

// A soft round light: the Sun behind the ship, sparks and engine glow.
export const paintGlow = (colour: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const glow = context.createRadialGradient(c, c, 0, c, c, c);

  glow.addColorStop(0, colour);
  glow.addColorStop(0.3, colour);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, width);
};
