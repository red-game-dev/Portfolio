// The part of a square of half side `reach` round x, y that lies on a `width` by `height` target (CSS pixels),
// and the device pixels to draw it with: the target's pixel ratio, or less if the region would not fit the
// drawing canvas. Null when none of it is on the target.
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  pixelRatio: number;
}

export const visibleRegion = (x: number, y: number, reach: number, width: number, height: number, pixelRatio: number, canvasWidth: number,
  canvasHeight: number): Region | null => {
  const left = Math.max(0, x - reach);
  const top = Math.max(0, y - reach);
  const right = Math.min(width, x + reach);
  const bottom = Math.min(height, y + reach);

  if (right - left < 1 || bottom - top < 1) {
    return null;
  }

  const regionWidth = right - left;
  const regionHeight = bottom - top;
  const ratio = Math.min(pixelRatio, canvasWidth / regionWidth, canvasHeight / regionHeight);

  return {
    x: left,
    y: top,
    width: regionWidth,
    height: regionHeight,
    pixelWidth: Math.max(1, Math.min(canvasWidth, Math.round(regionWidth * ratio))),
    pixelHeight: Math.max(1, Math.min(canvasHeight, Math.round(regionHeight * ratio))),
    pixelRatio: ratio,
  };
};
