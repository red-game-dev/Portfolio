import { Canvas2DContext } from "@/packages/graphics/canvas";
import { createSeededRandom } from "@/packages/math/random";

import { HullShape } from "../../domain/universe";

const TAU = Math.PI * 2;

export type CraftShape = HullShape | "trader" | "whale" | "rocket" | "starship";

// Each craft is painted facing +x (its nose to the right) in a square `width` across, centred, so it can be
// turned to its heading. Colours: hull, trim, glow.
type Painter = (context: Canvas2DContext, c: number, r: number, colours: [string, string, string]) => void;

const glow = (context: Canvas2DContext, x: number, y: number, radius: number, colour: string) => {
  const light = context.createRadialGradient(x, y, 0, x, y, radius);

  light.addColorStop(0, colour);
  light.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = light;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
};

const PAINTERS: Record<CraftShape, Painter> = {
  // A flying saucer: a disc with a lit rim and a glass dome.
  saucer: (context, c, r, [hull, trim, light]) => {
    const disc = context.createLinearGradient(c, c - r * 0.5, c, c + r * 0.5);

    disc.addColorStop(0, trim);
    disc.addColorStop(1, hull);
    context.fillStyle = disc;
    context.beginPath();
    context.ellipse(c, c, r * 0.95, r * 0.95, 0, 0, TAU);
    context.fill();
    context.fillStyle = hull;
    context.beginPath();
    context.ellipse(c, c, r * 0.62, r * 0.62, 0, 0, TAU);
    context.fill();
    glow(context, c, c, r * 0.42, light);

    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * TAU;

      context.fillStyle = light;
      context.beginPath();
      context.arc(c + Math.cos(angle) * r * 0.8, c + Math.sin(angle) * r * 0.8, r * 0.07, 0, TAU);
      context.fill();
    }
  },
  // An insect: a long segmented body, mandibles forward, legs swept back.
  insect: (context, c, r, [hull, trim, light]) => {
    context.strokeStyle = trim;
    context.lineWidth = r * 0.08;
    context.lineCap = "round";

    for (let leg = -1; leg <= 1; leg += 2) {
      for (let index = 0; index < 3; index += 1) {
        const x = c - r * 0.3 + index * r * 0.32;

        context.beginPath();
        context.moveTo(x, c);
        context.lineTo(x - r * 0.3, c + leg * r * 0.75);
        context.stroke();
      }

      context.beginPath();
      context.moveTo(c + r * 0.6, c + leg * r * 0.12);
      context.quadraticCurveTo(c + r * 1, c + leg * r * 0.35, c + r * 0.95, c + leg * r * 0.05);
      context.stroke();
    }

    [[-0.45, 0.32], [0, 0.26], [0.45, 0.22]].forEach(([at, size]) => {
      context.fillStyle = hull;
      context.beginPath();
      context.ellipse(c + at * r, c, r * size * 1.3, r * size, 0, 0, TAU);
      context.fill();
    });
    glow(context, c + r * 0.5, c, r * 0.18, light);
  },
  // A crystal: a faceted shard, glowing from inside.
  crystal: (context, c, r, [hull, trim, light]) => {
    const points = [[1, 0], [0.2, 0.5], [-0.6, 0.35], [-0.9, 0], [-0.6, -0.35], [0.2, -0.5]];

    glow(context, c, c, r, light);
    context.fillStyle = hull;
    context.beginPath();
    points.forEach(([x, y], index) => (index === 0 ? context.moveTo(c + x * r, c + y * r) : context.lineTo(c + x * r, c + y * r)));
    context.closePath();
    context.fill();
    context.strokeStyle = trim;
    context.lineWidth = r * 0.05;
    points.forEach(([x, y]) => {
      context.beginPath();
      context.moveTo(c, c);
      context.lineTo(c + x * r, c + y * r);
      context.stroke();
    });
  },
  // Something grown, not built: a lopsided body with trailing tendrils.
  organic: (context, c, r, [hull, trim, light]) => {
    const random = createSeededRandom(7);

    context.strokeStyle = trim;
    context.lineWidth = r * 0.06;

    for (let index = 0; index < 5; index += 1) {
      const y = c + (index - 2) * r * 0.18;

      context.beginPath();
      context.moveTo(c - r * 0.3, y);
      context.bezierCurveTo(c - r * 0.6, y + (random() - 0.5) * r, c - r * 0.8, y + (random() - 0.5) * r, c - r * 1, y + (random() - 0.5) * r * 0.6);
      context.stroke();
    }

    context.fillStyle = hull;
    context.beginPath();
    context.moveTo(c + r * 0.9, c);
    context.bezierCurveTo(c + r * 0.6, c - r * 0.75, c - r * 0.5, c - r * 0.55, c - r * 0.45, c);
    context.bezierCurveTo(c - r * 0.5, c + r * 0.6, c + r * 0.5, c + r * 0.7, c + r * 0.9, c);
    context.fill();
    glow(context, c + r * 0.35, c - r * 0.1, r * 0.22, light);
    glow(context, c - r * 0.05, c + r * 0.2, r * 0.14, light);
  },
  // A monolith: a dark slab with seams of light.
  monolith: (context, c, r, [hull, , light]) => {
    context.fillStyle = hull;
    context.fillRect(c - r * 0.85, c - r * 0.42, r * 1.7, r * 0.84);
    context.strokeStyle = light;
    context.lineWidth = r * 0.05;
    [-0.4, 0, 0.4].forEach((at) => {
      context.beginPath();
      context.moveTo(c + at * r, c - r * 0.42);
      context.lineTo(c + at * r, c + r * 0.42);
      context.stroke();
    });
    glow(context, c + r * 0.85, c, r * 0.3, light);
  },
  // A drone of a swarm: a small sharp dart.
  swarm: (context, c, r, [hull, trim, light]) => {
    context.fillStyle = hull;
    context.beginPath();
    context.moveTo(c + r, c);
    context.lineTo(c - r * 0.7, c - r * 0.65);
    context.lineTo(c - r * 0.35, c);
    context.lineTo(c - r * 0.7, c + r * 0.65);
    context.closePath();
    context.fill();
    context.strokeStyle = trim;
    context.lineWidth = r * 0.08;
    context.stroke();
    glow(context, c - r * 0.3, c, r * 0.25, light);
  },
  // A trader: a hauler of stacked cargo pods behind a small cab.
  trader: (context, c, r, [hull, trim, light]) => {
    [-0.7, -0.35, 0, 0.35].forEach((at, index) => {
      context.fillStyle = index % 2 === 0 ? hull : trim;
      context.fillRect(c + at * r, c - r * 0.32, r * 0.32, r * 0.64);
    });
    context.fillStyle = trim;
    context.beginPath();
    context.moveTo(c + r * 0.95, c);
    context.lineTo(c + r * 0.68, c - r * 0.28);
    context.lineTo(c + r * 0.68, c + r * 0.28);
    context.closePath();
    context.fill();
    glow(context, c - r * 0.8, c, r * 0.22, light);
  },
  // A void whale: a vast slow creature, fins and a tail, lit along its flanks.
  whale: (context, c, r, [hull, trim, light]) => {
    context.fillStyle = hull;
    context.beginPath();
    context.moveTo(c + r * 0.95, c);
    context.bezierCurveTo(c + r * 0.7, c - r * 0.45, c - r * 0.4, c - r * 0.4, c - r * 0.7, c - r * 0.08);
    context.lineTo(c - r * 1, c - r * 0.35);
    context.lineTo(c - r * 0.85, c);
    context.lineTo(c - r * 1, c + r * 0.35);
    context.lineTo(c - r * 0.7, c + r * 0.08);
    context.bezierCurveTo(c - r * 0.4, c + r * 0.4, c + r * 0.7, c + r * 0.45, c + r * 0.95, c);
    context.fill();
    context.fillStyle = trim;
    context.beginPath();
    context.ellipse(c, c + r * 0.3, r * 0.3, r * 0.08, 0.4, 0, TAU);
    context.fill();

    for (let index = 0; index < 7; index += 1) {
      glow(context, c + r * (0.55 - index * 0.17), c - r * 0.12 + (index % 2) * r * 0.24, r * 0.07, light);
    }
  },
  // One of ours: a slim rocket.
  rocket: (context, c, r, [hull, trim]) => {
    context.fillStyle = hull;
    context.fillRect(c - r * 0.7, c - r * 0.12, r * 1.4, r * 0.24);
    context.fillStyle = trim;
    context.beginPath();
    context.moveTo(c + r * 0.95, c);
    context.lineTo(c + r * 0.7, c - r * 0.12);
    context.lineTo(c + r * 0.7, c + r * 0.12);
    context.closePath();
    context.fill();
    context.fillRect(c - r * 0.75, c - r * 0.24, r * 0.2, r * 0.48);
  },
  // One of ours: a great steel starship.
  starship: (context, c, r, [hull, trim]) => {
    const steel = context.createLinearGradient(c, c - r * 0.3, c, c + r * 0.3);

    steel.addColorStop(0, "#e8ecf2");
    steel.addColorStop(1, hull);
    context.fillStyle = steel;
    context.beginPath();
    context.moveTo(c + r * 0.95, c);
    context.quadraticCurveTo(c + r * 0.75, c - r * 0.24, c + r * 0.45, c - r * 0.24);
    context.lineTo(c - r * 0.8, c - r * 0.24);
    context.lineTo(c - r * 0.8, c + r * 0.24);
    context.lineTo(c + r * 0.45, c + r * 0.24);
    context.quadraticCurveTo(c + r * 0.75, c + r * 0.24, c + r * 0.95, c);
    context.fill();
    context.fillStyle = trim;
    context.fillRect(c - r * 0.85, c - r * 0.42, r * 0.28, r * 0.18);
    context.fillRect(c - r * 0.85, c + r * 0.24, r * 0.28, r * 0.18);
    context.fillRect(c + r * 0.45, c - r * 0.34, r * 0.16, r * 0.1);
    context.fillRect(c + r * 0.45, c + r * 0.24, r * 0.16, r * 0.1);
  },
};

// A craft's sprite, facing right. A boss is the same hull in a corona of its glow.
export const paintCraft = (shape: CraftShape, colours: [string, string, string], isBoss = false) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const r = width * 0.46;

  if (isBoss) {
    glow(context, c, c, r * 1.05, colours[2]);
  }

  PAINTERS[shape](context, c, r * (isBoss ? 0.85 : 1), colours);
};
