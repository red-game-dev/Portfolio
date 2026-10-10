import { Canvas2DContext } from "@/packages/graphics/canvas";
import { shadeHex } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";

import { LandingMethod, LandingPhase } from "../../landing";

// How many canopies are open and how large, against a crew capsule's main parachutes.
export interface CanopySet {
  count: number;
  size: number;
}

// What a blunt craft is painted in: the four stops across its curved sides (shadow to light to shadow) and its
// heat shield.
export interface ShellColours {
  sides: [string, string, string, string];
  shield: string;
}

// A crew capsule, grey and white, its shield charred brown black; and an aeroshell carrying a ship down, its
// backshell white, its shield the brown of cork and resin.
export const CAPSULE: ShellColours = { sides: ["#787c84", "#d6dae0", "#eceef2", "#969aa2"], shield: "#32241c" };
export const AEROSHELL: ShellColours = { sides: ["#8a8f98", "#e4e7ec", "#f6f7f9", "#a4a8b0"], shield: "#5a3a26" };

const ORANGE = "#f07028";
const WHITE = "#f2f0ea";

// The canopies open in each phase of each way down: two drogues then three mains for a capsule, Mars's one large
// supersonic parachute, Huygens's large parachute then its smaller one, Venera's single parachute.
const CANOPIES: Partial<Record<LandingMethod, Partial<Record<LandingPhase, CanopySet>>>> = {
  parachutes: { drogue: { count: 2, size: 0.45 }, main: { count: 3, size: 1 }, softLanding: { count: 3, size: 1 } },
  chuteAndBurn: { supersonic: { count: 1, size: 1.3 } },
  probe: { drogue: { count: 1, size: 1.1 }, main: { count: 1, size: 0.6 } },
  dragPlate: { main: { count: 1, size: 1.2 } },
};

export const canopiesFor = (method: LandingMethod, phase: LandingPhase): CanopySet | null => CANOPIES[method]?.[phase] ?? null;

// Canopies overhead, swaying, in orange and white gores, their lines running down to the point they hold (`x`,
// `anchorY`). `tall` is the craft's height and `wide` its width, so the canopies are sized to it.
export const paintCanopies = (context: Canvas2DContext, x: number, anchorY: number, tall: number, wide: number, set: CanopySet, ambient: number,
  now: number): void => {
  const offsets = set.count === 1 ? [0] : set.count === 2 ? [-0.6, 0.6] : [-1, 0, 1];
  const rx = wide * 0.62 * set.size;
  const ry = tall * 0.3 * set.size;

  offsets.forEach((offset, index) => {
    const cx = x + offset * wide * 0.8 * set.size + Math.sin(now * 0.0019 + index) * wide * 0.06;
    const cy = anchorY - tall * (0.85 + 0.2 * set.size + Math.abs(offset) * 0.1);

    context.strokeStyle = shadeHex("#e6e6e6", ambient, 0.55);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(cx - rx, cy);
    context.lineTo(x, anchorY);
    context.moveTo(cx + rx, cy);
    context.lineTo(x, anchorY);
    context.stroke();

    for (let gore = 0; gore < 8; gore += 1) {
      const from = Math.PI + (gore / 8) * Math.PI;

      context.fillStyle = shadeHex((gore + index) % 2 === 0 ? ORANGE : WHITE, ambient);
      context.beginPath();
      context.moveTo(cx, cy);
      context.ellipse(cx, cy, rx, ry, 0, from, from + Math.PI / 8);
      context.closePath();
      context.fill();
    }
  });
};

// The parachutes spread on the ground off to one side after a landing, their lines running back to the capsule.
export const paintDrapedCanopies = (context: Canvas2DContext, x: number, groundY: number, tall: number, wide: number, high: number, ambient: number): void => {
  [-1, 0.2, 1].forEach((offset, index) => {
    const cx = x + wide * (1.35 + index * 0.55) * (offset < 0 ? -1 : 1);
    const cy = groundY + tall * (0.04 + index * 0.03);

    context.strokeStyle = shadeHex("#e6e6e6", ambient, 0.5);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, groundY - high);
    context.lineTo(cx, cy - tall * 0.04);
    context.stroke();

    for (let gore = 0; gore < 6; gore += 1) {
      const from = Math.PI + (gore / 6) * Math.PI;

      context.fillStyle = shadeHex((gore + index) % 2 === 0 ? ORANGE : WHITE, ambient);
      context.beginPath();
      context.moveTo(cx, cy);
      context.ellipse(cx, cy, wide * 0.55, tall * 0.075, 0, from, from + Math.PI / 6);
      context.closePath();
      context.fill();
    }
  });
};

// A blunt craft at the origin, its heat shield at 0 and its top at `-high`: curved sides lit from `lit` (-1 left, 1
// right), soot streaked up from the shield, the shield a little proud of the sides, a ring on top and two windows.
export const paintShell = (context: Canvas2DContext, wide: number, high: number, tall: number, ambient: number, lit: number, colours: ShellColours): void => {
  const top = wide * 0.42;
  const sides = context.createLinearGradient(-wide / 2 * lit, 0, wide / 2 * lit, 0);

  [0, 0.45, 0.7, 1].forEach((stop, index) => sides.addColorStop(stop, shadeHex(colours.sides[index], ambient)));
  context.fillStyle = sides;
  context.beginPath();
  context.moveTo(-wide / 2, 0);
  context.quadraticCurveTo(-wide * 0.44, -high * 0.55, -top / 2, -high);
  context.quadraticCurveTo(0, -high - tall * 0.05, top / 2, -high);
  context.quadraticCurveTo(wide * 0.44, -high * 0.55, wide / 2, 0);
  context.closePath();
  context.fill();

  const soot = context.createLinearGradient(0, 0, 0, -high);

  soot.addColorStop(0, shadeHex("#463426", ambient, 0.85));
  soot.addColorStop(0.35, "rgba(60, 45, 35, 0.25)");
  soot.addColorStop(1, "rgba(60, 45, 35, 0)");
  context.fillStyle = soot;
  context.fill();
  context.fillStyle = shadeHex(colours.shield, ambient);
  context.beginPath();
  context.ellipse(0, -high * 0.02, wide * 0.53, high * 0.08, 0, 0, TAU);
  context.fill();
  context.fillStyle = shadeHex("#8c9098", ambient);
  context.beginPath();
  context.ellipse(0, -high - tall * 0.02, top * 0.32, tall * 0.025, 0, 0, TAU);
  context.fill();
  context.fillStyle = "rgba(24, 34, 54, 0.92)";
  [-1, 1].forEach((side) => {
    context.beginPath();
    context.ellipse(side * wide * 0.15, -high * 0.58, wide * 0.045, high * 0.065, side * 0.25, 0, TAU);
    context.fill();
  });
};

// The air turned to plasma by a craft coming in shield first (in its own frame, the shield facing down at 0): a
// tail of glowing gas streaming back past it, and the bow of it pressed against the shield, white hot at the
// heart and rose to orange at the edge, flickering. `heat` is how hard the air heats it, about 1 at a capsule's
// peak.
export const paintPlasma = (context: Canvas2DContext, wide: number, high: number, tall: number, heat: number, now: number, isFront: boolean): void => {
  const strength = Math.min(1.2, heat) * (0.85 + 0.15 * Math.sin(now * 0.031));

  if (strength < 0.02) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "lighter";

  if (isFront) {
    const bow = context.createRadialGradient(0, high * 0.06, 0, 0, high * 0.06, wide * 0.85);

    bow.addColorStop(0, `rgba(255, 250, 230, ${(0.85 * strength).toFixed(3)})`);
    bow.addColorStop(0.35, `rgba(255, 170, 90, ${(0.6 * strength).toFixed(3)})`);
    bow.addColorStop(1, "rgba(255, 90, 120, 0)");
    context.fillStyle = bow;
    context.beginPath();
    context.ellipse(0, high * 0.06, wide * 0.85, high * 0.42, 0, 0, TAU);
    context.fill();
  } else {
    const length = tall * (1 + 2.4 * strength);
    const tail = context.createLinearGradient(0, 0, 0, -length);

    tail.addColorStop(0, `rgba(255, 190, 120, ${(0.55 * strength).toFixed(3)})`);
    tail.addColorStop(0.4, `rgba(255, 110, 150, ${(0.28 * strength).toFixed(3)})`);
    tail.addColorStop(1, "rgba(255, 90, 160, 0)");
    context.fillStyle = tail;
    context.beginPath();
    context.moveTo(-wide * 0.62, 0);
    context.quadraticCurveTo(-wide * 0.5, -length * 0.5, -wide * 0.12, -length);
    context.lineTo(wide * 0.12, -length);
    context.quadraticCurveTo(wide * 0.5, -length * 0.5, wide * 0.62, 0);
    context.closePath();
    context.fill();
  }

  context.restore();
};

// A drag plate, Venera's disc round the lander's waist, seen nearly edge on.
export const paintPlate = (context: Canvas2DContext, x: number, y: number, wide: number, tall: number, ambient: number): void => {
  context.fillStyle = shadeHex("#b9bec6", ambient);
  context.beginPath();
  context.ellipse(x, y, wide * 0.95, tall * 0.045, 0, 0, TAU);
  context.fill();
  context.strokeStyle = shadeHex("#5b6068", ambient);
  context.lineWidth = Math.max(1, tall * 0.01);
  context.stroke();
};

// Dust kicked out to both sides along the ground: `spread` from 0 (just rising) to 1 (spread out and gone),
// `strength` how much there is.
export const paintDust = (context: Canvas2DContext, x: number, groundY: number, wide: number, tall: number, colour: string, spread: number, strength: number): void => {
  if (strength <= 0 || spread >= 1) {
    return;
  }

  const alpha = context.globalAlpha;

  context.globalAlpha = alpha * strength * (1 - Math.max(0, spread)) * 0.5;
  context.fillStyle = colour;
  [-1, 1].forEach((side) => {
    context.beginPath();
    context.ellipse(x + side * wide * (0.6 + spread * 1.6), groundY - tall * 0.05, wide * (0.4 + spread), tall * (0.1 + spread * 0.15), 0, 0, TAU);
    context.fill();
  });
  context.globalAlpha = alpha;
};

// Spray thrown up round a splashdown and falling back: `spread` from 0 (the moment it hits) to 1 (settled).
export const paintSplash = (context: Canvas2DContext, x: number, waterY: number, wide: number, tall: number, spread: number): void => {
  if (spread < 0 || spread >= 1) {
    return;
  }

  context.fillStyle = `rgba(240, 248, 255, ${(0.75 * (1 - spread)).toFixed(3)})`;
  [-1, -0.45, 0.45, 1].forEach((side, index) => {
    const reach = wide * (0.5 + spread * (0.8 + index * 0.1));
    const rise = Math.sin(spread * Math.PI) * tall * (0.35 + (index % 2) * 0.15);

    context.beginPath();
    context.ellipse(x + side * reach, waterY - rise, wide * 0.16 * (1 - spread * 0.4), tall * 0.07, 0, 0, TAU);
    context.fill();
  });
};

// A recovery ship on the water: a dark hull, its white bridge and deck house aft, a crane over the stern, rising and
// falling a little on the swell. `size` is its length.
export const paintRecoveryShip = (context: Canvas2DContext, x: number, waterY: number, size: number, ambient: number, now: number): void => {
  const bob = Math.sin(now * 0.0021) * size * 0.012;
  const y = waterY + bob;
  const deck = y - size * 0.07;

  context.fillStyle = shadeHex("#2c3440", ambient);
  context.beginPath();
  context.moveTo(x - size * 0.5, deck);
  context.lineTo(x + size * 0.5, deck - size * 0.02);
  context.lineTo(x + size * 0.44, y + size * 0.03);
  context.lineTo(x - size * 0.46, y + size * 0.03);
  context.closePath();
  context.fill();
  context.fillStyle = shadeHex("#eef0f2", ambient);
  context.fillRect(x + size * 0.12, deck - size * 0.12, size * 0.22, size * 0.12);
  context.fillRect(x + size * 0.18, deck - size * 0.18, size * 0.1, size * 0.06);
  context.fillStyle = "rgba(24, 34, 54, 0.9)";
  context.fillRect(x + size * 0.19, deck - size * 0.165, size * 0.08, size * 0.02);
  context.strokeStyle = shadeHex("#f2a33a", ambient);
  context.lineWidth = Math.max(1, size * 0.012);
  context.beginPath();
  context.moveTo(x - size * 0.3, deck);
  context.lineTo(x - size * 0.42, deck - size * 0.2);
  context.lineTo(x - size * 0.55, deck - size * 0.12);
  context.stroke();
  // A pale wake along the waterline.
  context.strokeStyle = "rgba(235, 245, 255, 0.45)";
  context.beginPath();
  context.moveTo(x - size * 0.5, y + size * 0.035);
  context.lineTo(x + size * 0.46, y + size * 0.035);
  context.stroke();
};

// A recovery helicopter: its body and tail boom, skids, and the blur of its rotor turning.
export const paintHelicopter = (context: Canvas2DContext, x: number, y: number, size: number, ambient: number, now: number): void => {
  context.fillStyle = shadeHex("#3b4a3a", ambient);
  context.beginPath();
  context.ellipse(x, y, size * 0.22, size * 0.1, 0, 0, TAU);
  context.fill();
  context.fillRect(x + size * 0.15, y - size * 0.03, size * 0.38, size * 0.04);
  context.fillStyle = "rgba(24, 34, 54, 0.85)";
  context.beginPath();
  context.ellipse(x - size * 0.12, y - size * 0.02, size * 0.07, size * 0.05, 0, 0, TAU);
  context.fill();
  context.strokeStyle = shadeHex("#2a2f36", ambient);
  context.lineWidth = Math.max(1, size * 0.02);
  context.beginPath();
  context.moveTo(x - size * 0.2, y + size * 0.15);
  context.lineTo(x + size * 0.15, y + size * 0.15);
  context.moveTo(x, y - size * 0.1);
  context.lineTo(x, y - size * 0.15);
  context.stroke();
  const sweep = size * (0.42 + 0.06 * Math.sin(now * 0.08));

  context.strokeStyle = "rgba(40, 46, 54, 0.55)";
  context.beginPath();
  context.moveTo(x - sweep, y - size * 0.15);
  context.lineTo(x + sweep, y - size * 0.15);
  context.stroke();
};

// The pad a new rocket stands on: a concrete apron, and beside it the launch tower, a steel lattice with its swing
// arm reaching across to the rocket. `tall` is the rocket's height.
export const paintPad = (context: Canvas2DContext, x: number, groundY: number, tall: number, wide: number, ambient: number): void => {
  const towerX = x + wide * 1.05;
  const towerTop = groundY - tall * 1.2;
  const towerWide = wide * 0.55;

  context.fillStyle = shadeHex("#9a9c9e", ambient);
  context.beginPath();
  context.ellipse(x + wide * 0.4, groundY + tall * 0.02, wide * 2.2, tall * 0.05, 0, 0, TAU);
  context.fill();
  context.strokeStyle = shadeHex("#7d3326", ambient);
  context.lineWidth = Math.max(1, wide * 0.035);
  context.strokeRect(towerX, towerTop, towerWide, groundY - towerTop);
  context.beginPath();

  for (let level = 0; level < 9; level += 1) {
    const top = towerTop + ((groundY - towerTop) * level) / 9;
    const bottom = towerTop + ((groundY - towerTop) * (level + 1)) / 9;

    context.moveTo(towerX, top);
    context.lineTo(towerX + towerWide, bottom);
    context.moveTo(towerX + towerWide, top);
    context.lineTo(towerX, bottom);
  }

  // The crew access arm, across to the rocket near its top.
  context.moveTo(towerX, groundY - tall * 0.82);
  context.lineTo(x + wide * 0.32, groundY - tall * 0.82);
  context.stroke();
};
