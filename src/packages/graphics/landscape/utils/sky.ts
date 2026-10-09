import { hexToRgb, mixRgb, Rgb } from "@/packages/graphics/colour";
import { clamp01 } from "@/packages/math/clamp";
import { smoothstep } from "@/packages/math/easing";

import { Air, SkyLight } from "../domain/types";

const SPACE: Rgb = [2, 3, 8];

// The sky for a sun `elevation` degrees over the horizon (negative under it), through air that thins to `density`
// of itself with height. Day comes in as the sun clears the horizon, the glow of dusk peaks as it touches it and
// fades through twilight, and the stars come out as the sun sinks past six degrees below, or wherever the air is
// too thin to hide them. With no air the sky is black and the stars always show; the ground is lit only while
// the sun is up, harshly.
export const skyLight = (air: Air | null, elevation: number, density = 1): SkyLight => {
  if (!air || air.strength * density <= 0.01) {
    return { zenith: SPACE, horizon: SPACE, glow: SPACE, glowStrength: 0, stars: 1, light: elevation > -0.5 ? 1 : 0.05 };
  }

  const strength = clamp01(air.strength * density);
  const day = smoothstep(-4, 12, elevation);
  const dusk = clamp01(1 - Math.abs(elevation - 1) / 10);
  const night = mixRgb(SPACE, hexToRgb(air.night), strength);
  const zenith = mixRgb(night, mixRgb(SPACE, hexToRgb(air.zenith), strength), day);
  const horizonByDay = mixRgb(SPACE, hexToRgb(air.horizon), strength);
  const horizon = mixRgb(mixRgb(night, horizonByDay, day), hexToRgb(air.dusk), dusk * 0.75 * strength);
  const stars = clamp01((1 - smoothstep(-14, -3, elevation) * strength) * (1 - air.haze) + (1 - strength) * 0.6);

  return {
    zenith,
    horizon,
    glow: hexToRgb(air.dusk),
    glowStrength: dusk * strength,
    stars: Math.min(1, stars),
    light: Math.max(0.06 + 0.1 * strength, day),
  };
};

// The sun's colour as it sinks through the air: reddened near the horizon in proportion to how much air there is.
export const sunColour = (colour: string, air: Air | null, elevation: number, density = 1): Rgb => {
  const reddening = air ? (1 - smoothstep(-1, 18, elevation)) * clamp01(air.strength * density) : 0;

  return mixRgb(hexToRgb(colour), [255, 120, 50], reddening * 0.8);
};
