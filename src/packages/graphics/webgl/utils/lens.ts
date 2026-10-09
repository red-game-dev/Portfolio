import { LensSource } from "../domain/types";

// The point lens: light seen at `p` left its source at p - (thetaE^2 / r^2) * d, where d runs from the lens to
// p. Outside the Einstein radius images are pushed outward; inside it they come from the far side, flipped,
// which is what draws the far side of a disk over the top of the hole. Several lenses add up. This is the same
// sum the shader runs for every pixel, kept here so it can be tested.
export const lensedSource = (x: number, y: number, lenses: readonly LensSource[]): { x: number; y: number } => {
  let sourceX = x;
  let sourceY = y;

  lenses.forEach((lens) => {
    const dx = x - lens.x;
    const dy = y - lens.y;
    const r2 = Math.max(dx * dx + dy * dy, 1);
    const bend = (lens.einstein * lens.einstein) / r2;

    sourceX -= dx * bend;
    sourceY -= dy * bend;
  });

  return { x: sourceX, y: sourceY };
};
