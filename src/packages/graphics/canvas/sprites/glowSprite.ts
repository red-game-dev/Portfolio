import { createDrawableSurface, DrawableSurface } from "../utils/surface";

// A soft round glow rendered once at device resolution. Drawing it with drawImage is far cheaper than a
// shadowBlur or a fresh radial gradient per particle per frame.
export const createGlowSprite = (color: string, radius: number, pixelRatio: number): DrawableSurface | null => {
  const size = Math.ceil(radius * 2 * pixelRatio);
  const drawable = createDrawableSurface(size, size);

  if (!drawable) {
    return null;
  }

  const { context } = drawable;
  const centre = size / 2;
  const gradient = context.createRadialGradient(centre, centre, 0, centre, centre, centre);

  gradient.addColorStop(0, color);
  gradient.addColorStop(0.25, color);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return drawable;
};
