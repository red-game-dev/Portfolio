import { Canvas2DContext } from "@/packages/graphics/canvas";
import { shadeHex } from "@/packages/graphics/colour";

import { LaunchLand, LaunchVehicle } from "../../domain/types";

export interface PadScene {
  width: number;
  height: number;
  // The rocket's centre line, the ground under it, and pixels per metre.
  x: number;
  groundY: number;
  perMetre: number;
  rocketWidth: number;
  rocketHeight: number;
  towerHeight: number;
  vehicle: LaunchVehicle;
  land: LaunchLand;
  // The tower stands on this side of the rocket (-1 left, 1 right).
  towerSide: number;
  // Daylight on the pad (0 to 1), and the floodlights' share once it is dark.
  light: number;
  floodlights: number;
  // How far the access arm has swung away, 0 still at the rocket.
  armSwing: number;
}

const LAND = { scrub: "#55703e", flats: "#b9a47c", hills: "#9a8a57" };
const TOWER = { booster: "#686c73", heavy: "#3a3d43", steel: "#5a5e65" };

// A lattice of steel between two rails: the launch tower, its bracing zigzagging up.
const lattice = (context: Canvas2DContext, x: number, base: number, width: number, height: number, colour: string) => {
  const rails = Math.max(1, width * 0.12);
  const bays = Math.max(4, Math.round(height / Math.max(4, width)));

  context.fillStyle = colour;
  context.fillRect(x - width / 2, base - height, rails, height);
  context.fillRect(x + width / 2 - rails, base - height, rails, height);
  context.strokeStyle = colour;
  context.lineWidth = Math.max(0.6, rails * 0.6);
  context.beginPath();

  for (let bay = 0; bay < bays; bay += 1) {
    const y = base - (bay / bays) * height;
    const next = base - ((bay + 1) / bays) * height;

    context.moveTo(x - width / 2, y);
    context.lineTo(x + width / 2, next);
    context.moveTo(x - width / 2, next);
    context.lineTo(x + width / 2, next);
  }

  context.stroke();
};

// The pad round the rocket: the land near by, the concrete apron and its flame trench, the tower beside the rocket
// with its access arm (swinging away as the engines light) or, for the steel rocket, its catching arms; lightning
// masts with their wires, a water tower in the distance; and by night the floodlights on the masts and their beams.
export const paintPad = (context: Canvas2DContext, scene: PadScene): void => {
  const { width, height, x, groundY, rocketWidth, rocketHeight, towerHeight, towerSide, light, floodlights } = scene;
  const landLight = Math.max(light, 0.18 + floodlights * 0.25);
  const top = groundY - height * 0.025;

  if (top > height + towerHeight) {
    return;
  }

  // The land between the sea or the hills and the viewer.
  const land = context.createLinearGradient(0, top, 0, height);

  land.addColorStop(0, shadeHex(LAND[scene.land], landLight * 0.8));
  land.addColorStop(1, shadeHex(LAND[scene.land], landLight * 0.45));
  context.fillStyle = land;
  context.fillRect(0, top, width, Math.max(0, height - top));

  // The apron and the flame trench under the rocket.
  const apron = rocketWidth * 11;

  context.fillStyle = shadeHex("#8f9298", Math.max(landLight, floodlights * 0.7));
  context.beginPath();
  context.moveTo(x - apron * 0.4, groundY - 2);
  context.lineTo(x + apron * 0.4, groundY - 2);
  context.lineTo(x + apron * 0.6, groundY + rocketWidth * 1.4);
  context.lineTo(x - apron * 0.6, groundY + rocketWidth * 1.4);
  context.closePath();
  context.fill();
  context.fillStyle = "#121315";
  context.fillRect(x - rocketWidth * 1.6, groundY - 1, rocketWidth * 3.2, rocketWidth * 0.9);

  const towerLight = Math.max(landLight, floodlights * 0.6);
  const towerWidth = Math.max(5, rocketWidth * 1.3);
  const towerX = x + towerSide * (rocketWidth * 1.9 + towerWidth / 2);
  const towerColour = shadeHex(TOWER[scene.vehicle], towerLight);

  lattice(context, towerX, groundY, towerWidth, towerHeight, towerColour);
  context.fillStyle = towerColour;
  context.fillRect(towerX - 0.6, groundY - towerHeight - towerHeight * 0.12, 1.2, towerHeight * 0.12);

  if (scene.vehicle === "steel") {
    // The catching arms, open once the rocket is away.
    const armY = groundY - towerHeight * 0.72;
    const reach = (rocketWidth * 1.9) * (1 - scene.armSwing * 0.4);

    context.fillRect(Math.min(towerX, towerX - towerSide * reach), armY, reach, Math.max(1.5, towerWidth * 0.3));
    context.fillRect(Math.min(towerX, towerX - towerSide * reach), armY + towerWidth * 0.7, reach, Math.max(1.5, towerWidth * 0.3));
  } else {
    // The crew access arm, swinging back as the engines light.
    const armY = groundY - rocketHeight * 0.82;
    const reach = rocketWidth * 1.9;
    const angle = scene.armSwing * 1.2;

    context.save();
    context.translate(towerX, armY);
    context.rotate(towerSide > 0 ? angle : -angle);
    context.fillRect(towerSide > 0 ? -reach : 0, -1, reach, Math.max(2, rocketWidth * 0.45));
    context.restore();
  }

  // Lightning masts either side, wired to each other, and a water tower further off.
  const mastHeight = towerHeight * 1.25;
  const masts = [x - rocketWidth * 10, x + rocketWidth * 10];

  context.fillStyle = shadeHex("#7d8188", towerLight);
  masts.forEach((mast) => context.fillRect(mast - 0.7, groundY - mastHeight, 1.4, mastHeight));
  context.strokeStyle = shadeHex("#9aa0a8", towerLight, 0.55);
  context.lineWidth = 0.6;
  context.beginPath();
  context.moveTo(masts[0], groundY - mastHeight);
  context.quadraticCurveTo(x, groundY - mastHeight * 0.82, masts[1], groundY - mastHeight);
  context.stroke();

  const tankX = x - towerSide * rocketWidth * 15;
  const tankRadius = rocketWidth * 1.1;

  context.fillStyle = shadeHex("#c9ccd1", landLight);
  context.fillRect(tankX - tankRadius * 0.8, groundY - tankRadius * 3, 1, tankRadius * 3);
  context.fillRect(tankX + tankRadius * 0.8, groundY - tankRadius * 3, 1, tankRadius * 3);
  context.beginPath();
  context.arc(tankX, groundY - tankRadius * 3.6, tankRadius, 0, Math.PI * 2);
  context.fill();

  if (floodlights <= 0.05) {
    return;
  }

  // The floodlights at the masts' feet, their beams crossing on the rocket.
  masts.forEach((mast) => {
    const lampY = groundY - mastHeight * 0.18;
    const beam = context.createLinearGradient(mast, lampY, x, groundY - rocketHeight * 0.5);

    beam.addColorStop(0, `rgba(255, 244, 220, ${0.22 * floodlights})`);
    beam.addColorStop(1, "rgba(255, 244, 220, 0)");
    context.fillStyle = beam;
    context.beginPath();
    context.moveTo(mast, lampY);
    context.lineTo(x - rocketWidth, groundY - rocketHeight * 0.95);
    context.lineTo(x + rocketWidth, groundY - rocketHeight * 0.1);
    context.closePath();
    context.fill();
    context.fillStyle = `rgba(255, 248, 230, ${0.9 * floodlights})`;
    context.fillRect(mast - 1.5, lampY - 1.5, 3, 3);
  });
};
