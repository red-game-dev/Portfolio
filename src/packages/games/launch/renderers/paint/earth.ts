import { Canvas2DContext } from "@/packages/graphics/canvas";
import { mixRgb, Rgb, rgba } from "@/packages/graphics/colour";
import { smoothstep } from "@/packages/math/easing";

const TAU = Math.PI * 2;

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
  now: number;
}

// Earth from on high: the curve of the planet rising into the bottom of the view and rounding as the rocket climbs,
// blue sea with cloud streaks by day, dark with city lights by night, the thin bright band of the air along its edge
// (and the green of the airglow over the night side), and a sunrise or sunset glow where the edge meets the Sun.
export const paintLimb = (context: Canvas2DContext, { width, height, rise, sunElevation, sunSide, now }: LimbScene): void => {
  if (rise <= 0) {
    return;
  }

  const radius = width * (6 - 4.4 * smoothstep(0, 1, rise));
  const top = height * (1.06 - 0.34 * rise);
  const cx = width / 2;
  const cy = top + radius;
  const day = smoothstep(-8, 8, sunElevation);
  const sea: Rgb = mixRgb([4, 8, 18], [26, 82, 150], day);
  const surface = context.createRadialGradient(cx, cy, radius * 0.96, cx, cy, radius);

  surface.addColorStop(0, rgba(sea, 1));
  surface.addColorStop(1, rgba(mixRgb(sea, [120, 170, 230], 0.45 * day), 1));
  context.fillStyle = surface;
  context.beginPath();
  context.arc(cx, cy, radius, 0, TAU);
  context.fill();

  context.save();
  context.beginPath();
  context.arc(cx, cy, radius, 0, TAU);
  context.clip();

  // Weather by day, the lights of cities by night, drifting slowly as the planet turns under the rocket.
  const drift = (now * 0.004) % width;

  for (let streak = 0; streak < 18; streak += 1) {
    const sx = ((streak * 97.3 + drift) % (width * 1.4)) - width * 0.2;
    const depth = (streak % 6) / 6;
    const sy = top + height * (0.04 + depth * 0.4);

    if (day > 0.1) {
      context.fillStyle = `rgba(245, 248, 255, ${0.28 * day})`;
      context.beginPath();
      context.ellipse(sx, sy, width * (0.05 + (streak % 5) * 0.02) * (0.6 + depth), 2 + depth * 5, 0, 0, TAU);
      context.fill();
    }

    if (day < 0.9) {
      context.fillStyle = `rgba(255, 200, 120, ${0.7 * (1 - day)})`;
      context.fillRect(sx + (streak % 3) * 7, sy + 3, 1.2 + depth, 1.2 + depth);
      context.fillRect(sx - (streak % 4) * 5, sy + 6, 1, 1);
    }
  }

  context.restore();

  // The air along the edge: a bright thin band, softening outwards; airglow over the night side.
  const band = context.createRadialGradient(cx, cy, radius * 0.995, cx, cy, radius * 1.03);

  band.addColorStop(0, rgba(mixRgb([60, 200, 120], [130, 190, 255], day), 0.55 + 0.35 * day));
  band.addColorStop(0.35, rgba([90, 150, 255], 0.35 * Math.max(0.25, day)));
  band.addColorStop(1, "rgba(60, 110, 255, 0)");
  context.fillStyle = band;
  context.beginPath();
  context.arc(cx, cy, radius * 1.03, 0, TAU);
  context.arc(cx, cy, radius * 0.995, 0, TAU, true);
  context.fill();

  // Where the Sun is near the horizon below, the edge burns orange on its side.
  const twilight = 1 - Math.min(1, Math.abs(sunElevation) / 12);

  if (twilight > 0) {
    const gx = cx + sunSide * width * 0.42;
    const reach = width * 0.55;
    const glow = context.createRadialGradient(gx, top, 0, gx, top, reach);

    glow.addColorStop(0, `rgba(255, 150, 70, ${0.55 * twilight})`);
    glow.addColorStop(1, "rgba(255, 120, 60, 0)");
    context.fillStyle = glow;
    context.fillRect(gx - reach, top - reach, reach * 2, reach * 2);
  }
};
