export type Rgb = [number, number, number];

// "#4bffa5" (or "#4bf") as [75, 255, 165].
export const hexToRgb = (hex: string): Rgb => {
  const digits = hex.replace(/^#/, "");
  const full = digits.length === 3 ? Array.from(digits, (digit) => digit + digit).join("") : digits;

  return [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16)) as Rgb;
};

// "75, 255, 165": the channels as CSS custom properties hold them, for rgba(var(--x-rgb), 0.5).
export const rgbChannels = (hex: string) => hexToRgb(hex).join(", ");

export const mixRgb = (from: Rgb, to: Rgb, amount: number): Rgb => [0, 1, 2].map((index) => Math.round(from[index] + (to[index] - from[index]) * amount)) as Rgb;

export const rgba = ([red, green, blue]: Rgb, alpha: number) => `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
