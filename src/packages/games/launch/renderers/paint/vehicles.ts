import { Canvas2DContext } from "@/packages/graphics/canvas";
import { shadeHex } from "@/packages/graphics/colour";

import { LaunchVehicle } from "../../domain/types";

// The kind of flame each engine burns: kerosene (bright yellow, sooty), solid fuel (white hot, thick smoke),
// methane (blue white with pink edges), and an upper stage's in vacuum (faint and wide).
export type PlumeKind = "kerosene" | "solid" | "methane" | "vacuum";

// The parts of a rocket that can be drawn apart once they separate.
export type VehiclePart = "core" | "upper" | "fairing" | "sides";

// What a rocket still carries: its first stage (or core), its side boosters, its upper stage, and its fairing or
// abort tower. A part that has separated is drawn on its own, with only its own flag set.
export interface Stack {
  hasCore: boolean;
  hasUpper: boolean;
  hasSides: boolean;
  hasFairing: boolean;
}

// How each rocket is built, as shares of its full height (from the base) and of its height for widths.
interface Build {
  coreTop: number;
  upperTop: number;
  width: number;
  sideWidth: number;
  sideTop: number;
}

export const BUILDS: Readonly<Record<LaunchVehicle, Build>> = {
  booster: { coreTop: 0.62, upperTop: 0.86, width: 0.053, sideWidth: 0, sideTop: 0 },
  heavy: { coreTop: 0.64, upperTop: 0.86, width: 0.085, sideWidth: 0.038, sideTop: 0.56 },
  steel: { coreTop: 0.57, upperTop: 1, width: 0.075, sideWidth: 0, sideTop: 0 },
};

export const PLUMES: Readonly<Record<LaunchVehicle, { core: PlumeKind; upper: PlumeKind; sides?: PlumeKind }>> = {
  booster: { core: "kerosene", upper: "vacuum" },
  heavy: { core: "kerosene", upper: "vacuum", sides: "solid" },
  steel: { core: "methane", upper: "methane" },
};

// A cylinder lit from one side, as a metal or painted tank looks under one light.
const tank = (context: Canvas2DContext, x: number, top: number, width: number, height: number, hex: string, light: number) => {
  const body = context.createLinearGradient(x - width / 2, 0, x + width / 2, 0);

  body.addColorStop(0, shadeHex(hex, light * 0.45));
  body.addColorStop(0.35, shadeHex(hex, Math.min(1, light * 1.05)));
  body.addColorStop(0.6, shadeHex(hex, light * 0.85));
  body.addColorStop(1, shadeHex(hex, light * 0.4));
  context.fillStyle = body;
  context.fillRect(x - width / 2, top, width, height);
};

const nose = (context: Canvas2DContext, x: number, base: number, width: number, height: number, hex: string, light: number) => {
  const body = context.createLinearGradient(x - width / 2, 0, x + width / 2, 0);

  body.addColorStop(0, shadeHex(hex, light * 0.45));
  body.addColorStop(0.35, shadeHex(hex, Math.min(1, light * 1.05)));
  body.addColorStop(1, shadeHex(hex, light * 0.4));
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(x - width / 2, base);
  context.bezierCurveTo(x - width / 2, base - height * 0.55, x - width * 0.12, base - height, x, base - height);
  context.bezierCurveTo(x + width * 0.12, base - height, x + width / 2, base - height * 0.55, x + width / 2, base);
  context.closePath();
  context.fill();
};

// One rocket standing on its base at 0, 0, pointing up (negative y), `height` pixels tall, with only the parts
// it still carries: the booster's white two stages with a black interstage, grid fins and folded legs under its
// fairing; the heavy lifter's orange core between two white boosters, a slim upper stage and a capsule under its
// abort tower; the stainless super heavy, its booster's vented ring and grid fins, and the ship's flaps over a
// dark heat shield.
export const paintVehicle = (context: Canvas2DContext, vehicle: LaunchVehicle, height: number, stack: Stack, light: number): void => {
  const build = BUILDS[vehicle];
  const width = height * build.width;
  const coreTop = -height * build.coreTop;
  const upperTop = -height * build.upperTop;

  if (vehicle === "booster") {
    if (stack.hasCore) {
      tank(context, 0, coreTop, width, -coreTop, "#eef0f3", light);
      context.fillStyle = shadeHex("#1a1c20", light);
      context.fillRect(-width / 2, coreTop - height * 0.02, width, height * 0.06);
      // Folded landing legs and the engine section.
      context.fillRect(-width / 2, -height * 0.13, width * 0.18, height * 0.12);
      context.fillRect(width / 2 - width * 0.18, -height * 0.13, width * 0.18, height * 0.12);
      context.fillStyle = shadeHex("#3a3d44", light);
      context.fillRect(-width * 0.62, coreTop + height * 0.01, width * 0.24, height * 0.016);
      context.fillRect(width * 0.38, coreTop + height * 0.01, width * 0.24, height * 0.016);
      context.fillStyle = shadeHex("#2a2c31", light);
      context.fillRect(-width * 0.45, -height * 0.012, width * 0.9, height * 0.012);
    }

    if (!stack.hasUpper) {
      return;
    }

    tank(context, 0, upperTop, width, coreTop - upperTop - height * 0.02, "#eef0f3", light);

    if (stack.hasFairing) {
      const fairingWidth = width * 1.35;

      tank(context, 0, upperTop - height * 0.05, fairingWidth, height * 0.05, "#f4f5f7", light);
      nose(context, 0, upperTop - height * 0.05, fairingWidth, height * 0.09, "#f4f5f7", light);
    } else {
      nose(context, 0, upperTop, width * 0.7, height * 0.03, "#8a8f99", light);
    }

    return;
  }

  if (vehicle === "heavy") {
    const sideWidth = height * build.sideWidth;
    const sideTop = -height * build.sideTop;

    if (stack.hasCore) {
      tank(context, 0, coreTop, width, -coreTop, "#d0732c", light);
      context.fillStyle = shadeHex("#e9e9e9", light);
      context.fillRect(-width * 0.45, -height * 0.015, width * 0.9, height * 0.015);
    }

    if (stack.hasSides) {
      [-1, 1].forEach((side) => {
        const x = side * (width / 2 + sideWidth / 2);

        tank(context, x, sideTop, sideWidth, -sideTop, "#f2f2f2", light);
        nose(context, x, sideTop, sideWidth, height * 0.05, "#f2f2f2", light);
        context.fillStyle = shadeHex("#1b1b1b", light);
        context.fillRect(x - sideWidth / 2, sideTop + height * 0.08, sideWidth, height * 0.012);
        context.fillRect(x - sideWidth * 0.4, -height * 0.02, sideWidth * 0.8, height * 0.02);
      });
    }

    if (!stack.hasUpper) {
      return;
    }

    // The upper stage and its capsule, under the abort tower until the fairing would go.
    const upperWidth = width * 0.62;

    tank(context, 0, upperTop + height * 0.08, upperWidth, coreTop - upperTop - height * 0.08, "#ececec", light);
    tank(context, 0, upperTop + height * 0.02, width * 0.7, height * 0.06, "#d9dadc", light);
    nose(context, 0, upperTop + height * 0.02, width * 0.7, height * 0.05, "#e8e8ea", light);

    if (stack.hasFairing) {
      context.fillStyle = shadeHex("#bfc2c8", light);
      context.fillRect(-width * 0.04, upperTop - height * 0.12, width * 0.08, height * 0.11);
    }

    return;
  }

  // Stainless steel, lit warm or cold by the sky round it.
  if (stack.hasCore) {
    tank(context, 0, coreTop, width, -coreTop, "#c7ccd4", light);
    context.fillStyle = shadeHex("#2b2e33", light);
    context.fillRect(-width / 2, coreTop - height * 0.02, width, height * 0.022);
    context.fillStyle = shadeHex("#6d727b", light);
    context.fillRect(-width * 0.68, coreTop + height * 0.015, width * 0.2, height * 0.02);
    context.fillRect(width * 0.48, coreTop + height * 0.015, width * 0.2, height * 0.02);
  }

  if (!stack.hasUpper) {
    return;
  }

  const shipBase = coreTop - height * 0.02;

  tank(context, 0, upperTop + height * 0.08, width, shipBase - upperTop - height * 0.08, "#cfd3da", light);
  nose(context, 0, upperTop + height * 0.08, width, height * 0.08, "#cfd3da", light);
  // The heat shield down one side, and the flaps fore and aft.
  context.fillStyle = shadeHex("#111216", light, 0.85);
  context.fillRect(-width / 2, upperTop + height * 0.1, width * 0.32, shipBase - upperTop - height * 0.1);
  context.fillStyle = shadeHex("#2a2c30", light);
  context.fillRect(-width * 0.78, upperTop + height * 0.12, width * 0.28, height * 0.05);
  context.fillRect(width * 0.5, upperTop + height * 0.12, width * 0.28, height * 0.05);
  context.fillRect(-width * 0.92, shipBase - height * 0.11, width * 0.42, height * 0.09);
  context.fillRect(width * 0.5, shipBase - height * 0.11, width * 0.42, height * 0.09);
};

export interface Nozzle {
  x: number;
  y: number;
  width: number;
  part: VehiclePart;
}

// Where each engine fires from, and how wide its flame starts, for the parts still attached.
export const nozzles = (vehicle: LaunchVehicle, height: number, stack: Stack): Nozzle[] => {
  const build = BUILDS[vehicle];
  const width = height * build.width;

  if (!stack.hasCore) {
    return [{ x: 0, y: -height * build.coreTop - height * 0.02, width: width * 0.55, part: "upper" }];
  }

  const core: Nozzle = { x: 0, y: 0, width: width * (vehicle === "steel" ? 1.05 : 0.85), part: "core" };

  if (vehicle !== "heavy" || !stack.hasSides) {
    return [core];
  }

  const sideWidth = height * build.sideWidth;
  const sides: Nozzle[] = [-1, 1].map((side) => ({ x: side * (width / 2 + sideWidth / 2), y: 0, width: sideWidth * 0.9, part: "sides" }));

  return [core, ...sides];
};

// A rocket flame from (x, y) downwards: narrow and hard edged in thick air, ballooning wide and pale as the air
// thins; shock diamonds in its core low down; flickering. `density` is the air's share of sea level.
export const paintPlume = (context: Canvas2DContext, x: number, y: number, width: number, kind: PlumeKind, density: number, now: number): void => {
  const thin = 1 - density;
  const flicker = 0.9 + 0.1 * Math.sin(now * 0.05 + x) + 0.05 * Math.sin(now * 0.13);
  const spread = kind === "vacuum" ? 2.6 + thin * 2 : 1 + thin ** 1.4 * 3.2;
  const length = width * (kind === "solid" ? 7 : kind === "vacuum" ? 5 : 5.5) * (1 + thin * 0.9) * flicker;
  const colours = {
    kerosene: ["rgba(255, 252, 235, 0.95)", "rgba(255, 196, 92, 0.85)", "rgba(255, 120, 40, 0)"],
    solid: ["rgba(255, 255, 248, 1)", "rgba(255, 228, 160, 0.9)", "rgba(255, 170, 80, 0)"],
    methane: ["rgba(240, 246, 255, 0.95)", "rgba(170, 190, 255, 0.6)", "rgba(255, 150, 200, 0)"],
    vacuum: ["rgba(235, 240, 255, 0.55)", "rgba(180, 200, 255, 0.22)", "rgba(160, 180, 255, 0)"],
  }[kind];
  const flame = context.createLinearGradient(0, y, 0, y + length);

  flame.addColorStop(0, colours[0]);
  flame.addColorStop(0.35, colours[1]);
  flame.addColorStop(1, colours[2]);
  context.fillStyle = flame;
  context.beginPath();
  context.moveTo(x - width / 2, y);
  context.quadraticCurveTo(x - (width * spread) / 2, y + length * 0.45, x, y + length);
  context.quadraticCurveTo(x + (width * spread) / 2, y + length * 0.45, x + width / 2, y);
  context.closePath();
  context.fill();

  // A glow round the nozzle, and the bright diamonds of a sea level exhaust.
  const glow = context.createRadialGradient(x, y + width * 0.4, 0, x, y + width * 0.4, width * 2.4);

  glow.addColorStop(0, kind === "methane" ? "rgba(200, 215, 255, 0.5)" : "rgba(255, 220, 150, 0.55)");
  glow.addColorStop(1, "rgba(255, 200, 120, 0)");
  context.fillStyle = glow;
  context.fillRect(x - width * 2.4, y - width * 2, width * 4.8, width * 4.8);

  if (density > 0.45 && kind !== "vacuum") {
    context.fillStyle = "rgba(255, 255, 255, 0.8)";

    for (let diamond = 1; diamond <= 3; diamond += 1) {
      const dy = y + width * diamond * 0.9;
      const size = width * 0.22 * (1 - diamond * 0.2);

      context.beginPath();
      context.moveTo(x, dy - size);
      context.lineTo(x + size * 0.55, dy);
      context.lineTo(x, dy + size);
      context.lineTo(x - size * 0.55, dy);
      context.closePath();
      context.fill();
    }
  }
};
