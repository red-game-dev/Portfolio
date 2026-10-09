export type Rgb = [number, number, number];

// "#4bffa5" (or "#4bf") as [75, 255, 165].
export const hexToRgb = (hex: string): Rgb => {
  const digits = hex.replace(/^#/, "");
  const full = digits.length === 3 ? Array.from(digits, (digit) => digit + digit).join("") : digits;

  return [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16)) as Rgb;
};

// [75, 255, 165] as "#4bffa5".
export const rgbToHex = (colour: Rgb): string => `#${colour.map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16)
  .padStart(2, "0")).join("")}`;

// "75, 255, 165": the channels as CSS custom properties hold them, for rgba(var(--x-rgb), 0.5).
export const rgbChannels = (hex: string) => hexToRgb(hex).join(", ");

export const mixRgb = (from: Rgb, to: Rgb, amount: number): Rgb => [0, 1, 2].map((index) => Math.round(from[index] + (to[index] - from[index]) * amount)) as Rgb;

export const rgba = ([red, green, blue]: Rgb, alpha: number) => `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;

export const rgbCss = ([red, green, blue]: Rgb) => `rgb(${red}, ${green}, ${blue})`;

// A colour under some light: 1 as it is, less towards black.
export const scaleRgb = ([red, green, blue]: Rgb, light: number): Rgb => [Math.round(red * light), Math.round(green * light), Math.round(blue * light)];

// A hex colour under some light, as CSS, for painters that light whatever they draw by the light where it is.
export const shadeHex = (hex: string, light: number, alpha = 1): string => {
  const shaded = scaleRgb(hexToRgb(hex), light);

  return alpha >= 1 ? rgbCss(shaded) : rgba(shaded, alpha);
};

// A colour from hue (degrees), saturation and lightness (0 to 1), as "#rrggbb".
export const hslToHex = (hue: number, saturation: number, lightness: number): string => {
  const h = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  const hex = (value: number) => Math.round((value + m) * 255).toString(16)
.padStart(2, "0");

  return `#${hex(r)}${hex(g)}${hex(b)}`;
};
