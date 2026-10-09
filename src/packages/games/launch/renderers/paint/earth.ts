import { Canvas2DContext } from "@/packages/graphics/canvas";
import { mixRgb, Rgb, rgba } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { smoothstep } from "@/packages/math/easing";

// A cumulus cloud: soft overlapping puffs, lit on top and greyer underneath, in the colour the sky lights it.
export const paintCloud = (context: Canvas2DContext, x: number, y: number, size: number, colour: Rgb, alpha: number): void => {
  const puffs: ReadonlyArray<readonly [number, number, number]> = [[-0.55, 0.12, 0.42], [-0.15, -0.12, 0.55], [0.3, -0.02, 0.48], [0.62, 0.15, 0.34], [0.05, 0.2, 0.5]];
  const underside = mixRgb(colour, [90, 96, 110], 0.35);

  puffs.forEach(([dx, dy, radius]) => {
    const cx = x + dx * size;
    const cy = y + dy * size;
    const r = radius * size;
    const puff = context.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);

    puff.addColorStop(0, rgba(colour, alpha));
    puff.addColorStop(0.7, rgba(mixRgb(colour, underside, 0.5), alpha * 0.85));
    puff.addColorStop(1, rgba(underside, 0));
    context.fillStyle = puff;
    context.beginPath();
    context.arc(cx, cy, r, 0, TAU);
    context.fill();
  });
};

export interface LimbScene {
  width: number;
  height: number;
  // 0 just above the clouds, 1 in orbit: how high the curve stands and how round it is.
  rise: number;
  // The Sun's height over the pad (degrees) and its side of the view.
  sunElevation: number;
  sunSide: number;
}

// Where the Earth's curve sits: rising into the bottom of the view and rounding as the rocket climbs.
export const limbOf = ({ width, height, rise }: LimbScene) => {
  const radius = width * (6 - 4.4 * smoothstep(0, 1, rise));
  const top = height * (1.06 - 0.34 * rise);

  return { x: width / 2, y: top + radius, radius, top };
};

// The air along the Earth's edge, over the globe itself: a bright thin band, softening outwards, green airglow
// over the night side, and a sunrise or sunset glow where the edge meets the Sun.
export const paintAirglow = (context: Canvas2DContext, scene: LimbScene): void => {
  if (scene.rise <= 0) {
    return;
  }

  const { width } = scene;
  const { x: cx, y: cy, radius, top } = limbOf(scene);
  const day = smoothstep(-8, 8, scene.sunElevation);
  const band = context.createRadialGradient(cx, cy, radius * 0.995, cx, cy, radius * 1.03);

  band.addColorStop(0, rgba(mixRgb([60, 200, 120], [130, 190, 255], day), 0.45 + 0.35 * day));
  band.addColorStop(0.35, rgba([90, 150, 255], 0.3 * Math.max(0.25, day)));
  band.addColorStop(1, "rgba(60, 110, 255, 0)");
  context.fillStyle = band;
  context.beginPath();
  context.arc(cx, cy, radius * 1.03, 0, TAU);
  context.arc(cx, cy, radius * 0.995, 0, TAU, true);
  context.fill();

  const twilight = 1 - Math.min(1, Math.abs(scene.sunElevation) / 12);

  if (twilight > 0) {
    const gx = cx + scene.sunSide * width * 0.42;
    const reach = width * 0.55;
    const glow = context.createRadialGradient(gx, top, 0, gx, top, reach);

    glow.addColorStop(0, `rgba(255, 150, 70, ${0.55 * twilight})`);
    glow.addColorStop(1, "rgba(255, 120, 60, 0)");
    context.fillStyle = glow;
    context.fillRect(gx - reach, top - reach, reach * 2, reach * 2);
  }
};
