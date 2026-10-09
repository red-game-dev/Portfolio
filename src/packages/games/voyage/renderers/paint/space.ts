import { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";
import { createSeededRandom } from "@/packages/math/random";

import { VoyageStyle } from "../../domain/theme";

// One layer of stars in a square tile, repeated across the screen and scrolled: faint and many far away, fewer
// and brighter close by, the nearest with a soft halo.
export const paintStars = (layer: 0 | 1 | 2, colour: string, pixelRatio: number) => (context: Canvas2DContext, width: number, height: number) => {
  const random = createSeededRandom(11 + layer * 13);
  const area = width * height / (pixelRatio * pixelRatio);
  const count = Math.round(area / [4200, 16000, 60000][layer]);

  context.fillStyle = colour;

  for (let index = 0; index < count; index += 1) {
    const size = pixelRatio * [0.6 + random() * 0.6, 1 + random() * 0.8, 1.3 + random() * 1.1][layer];
    const x = random() * width;
    const y = random() * height;

    context.globalAlpha = [0.25 + random() * 0.4, 0.5 + random() * 0.35, 0.8][layer];
    context.fillRect(x, y, size, size);

    if (layer === 2) {
      context.globalAlpha = 0.08;
      wrap(width, height, (dx, dy) => {
        context.beginPath();
        context.arc(x + size / 2 + dx, y + size / 2 + dy, size * 2.4, 0, TAU);
        context.fill();
      });
    }
  }

  context.globalAlpha = 1;
};

// The band of the Milky Way across the sky: one soft picture, low resolution and stretched over the screen.
// Too far away to move.
export const paintMilkyWay = (colour: string) => (context: Canvas2DContext, width: number, height: number) => {
  const random = createSeededRandom(17);

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(-0.55);

  const band = context.createLinearGradient(0, -height * 0.2, 0, height * 0.2);

  band.addColorStop(0, "rgba(0, 0, 0, 0)");
  band.addColorStop(0.5, "rgba(150, 165, 255, 0.09)");
  band.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = band;
  context.fillRect(-width, -height * 0.2, width * 2, height * 0.4);
  context.fillStyle = colour;

  for (let index = 0; index < 900; index += 1) {
    const spread = (random() + random() + random() - 1.5) / 1.5;

    context.globalAlpha = 0.1 + random() * 0.25;
    context.fillRect((random() - 0.5) * width * 1.8, spread * height * 0.18, 1, 1);
  }

  context.restore();
  context.globalAlpha = 1;
};

// Draws something at every offset a repeating tile needs, so whatever crosses an edge comes back on the far side
// and the tile has no seam.
const wrap = (width: number, height: number, draw: (dx: number, dy: number) => void) => {
  [-width, 0, width].forEach((dx) => [-height, 0, height].forEach((dy) => draw(dx, dy)));
};

// The shortest way from one point to another on a tile that wraps.
const across = (from: number, to: number, size: number) => {
  const direct = to - from;

  return direct > size / 2 ? direct - size : direct < -size / 2 ? direct + size : direct;
};

const nebula = (context: Canvas2DContext, width: number, height: number, colour: string, seed: number) => {
  const random = createSeededRandom(seed);

  for (let index = 0; index < 4; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = Math.min(width, height) * (0.25 + random() * 0.2);

    context.globalAlpha = 0.12 + random() * 0.08;
    wrap(width, height, (dx, dy) => {
      const cloud = context.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);

      cloud.addColorStop(0, colour);
      cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = cloud;
      context.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    });
  }

  context.globalAlpha = 1;
};

const matrixRain = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(21);
  const size = 14 * pixelRatio;
  // Columns spaced to divide the tile exactly, so the last never runs into the first.
  const columns = Math.max(1, Math.floor(width / (size * 1.25)));
  const spacing = width / columns;

  context.font = `${size}px monospace`;
  context.fillStyle = accent;

  for (let column = 0; column < columns; column += 1) {
    const length = 6 + Math.floor(random() * 22);
    const head = random() * height;

    for (let index = 0; index < length; index += 1) {
      const glyph = random() > 0.5 ? "1" : "0";
      const y = (head - index * size + height) % height;

      context.globalAlpha = (1 - index / length) * (index === 0 ? 0.9 : 0.4);
      [-height, 0, height].forEach((dy) => context.fillText(glyph, column * spacing, y + dy));
    }
  }

  context.globalAlpha = 1;
};

const neuralNet = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(31);
  const nodes = Array.from({ length: 34 }, () => ({ x: random() * width, y: random() * height, size: pixelRatio * (1.5 + random() * 2.5) }));
  const reach = Math.min(width, height) * 0.28;

  context.strokeStyle = accent;
  context.lineWidth = pixelRatio;
  nodes.forEach((from, index) => {
    nodes.slice(index + 1).forEach((to) => {
      const dx = across(from.x, to.x, width);
      const dy = across(from.y, to.y, height);
      const distance = Math.hypot(dx, dy);

      if (distance < reach) {
        context.globalAlpha = 0.22 * (1 - distance / reach);
        wrap(width, height, (ox, oy) => {
          context.beginPath();
          context.moveTo(from.x + ox, from.y + oy);
          context.lineTo(from.x + dx + ox, from.y + dy + oy);
          context.stroke();
        });
      }
    });
  });
  context.fillStyle = accent;
  context.globalAlpha = 0.5;
  nodes.forEach((node) => wrap(width, height, (dx, dy) => {
    context.beginPath();
    context.arc(node.x + dx, node.y + dy, node.size, 0, TAU);
    context.fill();
  }));
  context.globalAlpha = 1;
};

const cubeOutline = (context: Canvas2DContext, x: number, y: number, size: number) => {
  const h = size * 0.5;

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
};

const blockLattice = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(41);
  // A lattice spaced to divide the tile exactly, with an even number of rows so the stagger lines up.
  const columns = Math.max(1, Math.round(width / (92 * pixelRatio)));
  const rows = Math.max(2, Math.round(height / (69 * pixelRatio) / 2) * 2);
  const stepX = width / columns;
  const stepY = height / rows;
  const size = stepX / 2;

  context.strokeStyle = accent;
  context.lineWidth = pixelRatio;
  context.globalAlpha = 0.25;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (random() > 0.32) {
        continue;
      }

      const x = column * stepX + (row % 2 === 0 ? 0 : size);
      const y = row * stepY;

      wrap(width, height, (dx, dy) => cubeOutline(context, x + dx, y + dy, size));
    }
  }

  context.globalAlpha = 1;
};

const suits = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(51);
  const marks = ["\u2660", "\u2665", "\u2666", "\u2663"];

  for (let index = 0; index < 34; index += 1) {
    const size = (16 + random() * 28) * pixelRatio;
    const x = random() * width;
    const y = random() * height;

    context.font = `${size}px serif`;
    context.globalAlpha = 0.1 + random() * 0.16;
    context.fillStyle = random() > 0.5 ? accent : "#ffffff";
    wrap(width, height, (dx, dy) => context.fillText(marks[index % marks.length], x + dx, y + dy));
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

  // Two blocky planets, small enough that the tile's repeat goes unnoticed.
  for (let planet = 0; planet < 2; planet += 1) {
    const radius = (3 + Math.floor(random() * 4)) * cell;
    const cx = Math.floor(random() * width / cell) * cell;
    const cy = Math.floor(random() * height / cell) * cell;

    for (let y = -radius; y <= radius; y += cell) {
      for (let x = -radius; x <= radius; x += cell) {
        if (x * x + y * y <= radius * radius) {
          context.globalAlpha = y > radius * 0.2 ? 0.18 : 0.32;
          context.fillStyle = (x + y) / cell % 3 === 0 ? "#ffffff" : accent;
          wrap(width, height, (dx, dy) => context.fillRect(cx + x + dx, cy + y + dy, cell, cell));
        }
      }
    }
  }

  context.globalAlpha = 1;
};

// Far off galaxies in a void: a few faint smudges, tilted ovals of light, and almost nothing else.
const farGalaxies = (context: Canvas2DContext, width: number, height: number, accent: string) => {
  const random = createSeededRandom(53);

  for (let index = 0; index < 7; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = Math.min(width, height) * (0.02 + random() * 0.05);
    const tilt = random() * Math.PI;

    wrap(width, height, (dx, dy) => {
      const light = context.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, size);

      light.addColorStop(0, index % 2 === 0 ? accent : "#ffe8c8");
      light.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.globalAlpha = 0.25 + random() * 0.2;
      context.fillStyle = light;
      context.beginPath();
      context.ellipse(x + dx, y + dy, size, size * 0.35, tilt, 0, TAU);
      context.fill();
    });
  }

  context.globalAlpha = 1;
};

// Shards of crystal hanging in space, catching the light at their edges.
const crystalField = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(59);

  context.strokeStyle = accent;
  context.lineWidth = pixelRatio;

  for (let index = 0; index < 22; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = (8 + random() * 26) * pixelRatio;
    const tilt = random() * Math.PI;

    context.globalAlpha = 0.12 + random() * 0.25;
    wrap(width, height, (dx, dy) => {
      context.beginPath();
      context.moveTo(x + dx + Math.cos(tilt) * size, y + dy + Math.sin(tilt) * size);
      context.lineTo(x + dx + Math.cos(tilt + 2.4) * size * 0.4, y + dy + Math.sin(tilt + 2.4) * size * 0.4);
      context.lineTo(x + dx - Math.cos(tilt) * size, y + dy - Math.sin(tilt) * size);
      context.lineTo(x + dx + Math.cos(tilt - 2.4) * size * 0.4, y + dy + Math.sin(tilt - 2.4) * size * 0.4);
      context.closePath();
      context.stroke();
    });
  }

  context.globalAlpha = 1;
};

// Embers drifting up out of somewhere burning.
const embers = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(61);

  context.fillStyle = accent;

  for (let index = 0; index < 120; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = (0.6 + random() * 1.8) * pixelRatio;

    context.globalAlpha = 0.2 + random() * 0.6;
    wrap(width, height, (dx, dy) => context.fillRect(x + dx, y + dy, size, size * 2.5));
  }

  context.globalAlpha = 1;
};

// The abyss: deep water dark, faint ribbons of light moving through it.
const abyss = (context: Canvas2DContext, width: number, height: number, accent: string, pixelRatio: number) => {
  const random = createSeededRandom(67);

  context.strokeStyle = accent;
  context.lineWidth = 1.5 * pixelRatio;

  for (let index = 0; index < 9; index += 1) {
    const y = random() * height;
    const wave = height * (0.02 + random() * 0.05);
    const phase = random() * TAU;

    context.globalAlpha = 0.06 + random() * 0.08;
    [-height, 0, height].forEach((dy) => {
      context.beginPath();

      for (let x = 0; x <= width; x += width / 32) {
        const at = y + dy + Math.sin((x / width) * TAU * 2 + phase) * wave;

        if (x === 0) {
          context.moveTo(x, at);
        } else {
          context.lineTo(x, at);
        }
      }

      context.stroke();
    });
  }

  context.globalAlpha = 1;
};

// A universe's backdrop, a square tile that repeats without a seam: a nebula in its colours under what the
// universe is made of. A void has almost nothing: only galaxies far beyond it.
export const paintUniverse = (style: VoyageStyle, accent: string, pixelRatio: number) => (context: Canvas2DContext, width: number, height: number) => {
  if (style !== "void") {
    nebula(context, width, height, accent, style.length * 7);
  }

  const painters: Record<VoyageStyle, () => void> = {
    matrix: () => matrixRain(context, width, height, accent, pixelRatio),
    neural: () => neuralNet(context, width, height, accent, pixelRatio),
    blocks: () => blockLattice(context, width, height, accent, pixelRatio),
    chips: () => suits(context, width, height, accent, pixelRatio),
    pixels: () => pixelSky(context, width, height, accent, pixelRatio),
    nebula: () => nebula(context, width, height, accent, 91),
    void: () => farGalaxies(context, width, height, accent),
    crystal: () => crystalField(context, width, height, accent, pixelRatio),
    ember: () => embers(context, width, height, accent, pixelRatio),
    abyss: () => abyss(context, width, height, accent, pixelRatio),
  };

  painters[style]();
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

// The Sun behind the ship: warm at the middle, falling off quickly, so it lights the start without washing the sky.
export const paintSun = (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const glow = context.createRadialGradient(c, c, 0, c, c, c);

  glow.addColorStop(0, "rgba(255, 226, 160, 0.7)");
  glow.addColorStop(0.12, "rgba(255, 184, 90, 0.32)");
  glow.addColorStop(0.45, "rgba(255, 140, 60, 0.07)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, width);
};

// A soft round light: sparks and engine glow.
export const paintGlow = (colour: string) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const glow = context.createRadialGradient(c, c, 0, c, c, c);

  glow.addColorStop(0, colour);
  glow.addColorStop(0.3, colour);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, width);
};
