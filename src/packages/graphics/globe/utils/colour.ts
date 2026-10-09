import { hexToRgb } from "@/packages/graphics/colour";
import { clamp } from "@/packages/math/clamp";

export type Rgb01 = [number, number, number];

// A hex colour as three channels from 0 to 1, for shader uniforms.
export const rgb01 = (hex: string): Rgb01 => {
  const [r, g, b] = hexToRgb(hex);

  return [r / 255, g / 255, b / 255];
};

// The colour of a star's light at a surface temperature in kelvin: red dwarfs at 3000, the Sun at 5800, blue
// giants past 10000. A fit to the blackbody curve, scaled so the brightest channel is 1.
export const blackbody = (kelvin: number): Rgb01 => {
  const t = clamp(kelvin, 1000, 40000) / 100;
  const red = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const green = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const blue = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const channel = (value: number) => clamp(value, 0, 255) / 255;
  const channels: Rgb01 = [channel(red), channel(green), channel(blue)];
  const peak = Math.max(...channels) || 1;

  return [channels[0] / peak, channels[1] / peak, channels[2] / peak];
};
