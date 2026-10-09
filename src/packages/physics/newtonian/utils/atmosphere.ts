import { Atmosphere } from "../domain/types";

// Density at `altitude` above the surface: falling off exponentially with height, and nothing above the top.
// Below the surface (inside a gas giant) it keeps rising the same way.
export const densityAt = ({ surfaceDensity, scaleHeight, top }: Atmosphere, altitude: number): number => {
  if (surfaceDensity <= 0 || altitude > top) {
    return 0;
  }

  return surfaceDensity * Math.exp(-altitude / scaleHeight);
};

// Drag decelerates against the velocity in proportion to density and speed squared. Returns the size of the
// deceleration; the caller applies it against the direction of travel.
export const dragDeceleration = (density: number, speed: number, coefficient: number): number => coefficient * density * speed * speed;

// Heating from entry rises with density and with the cube of speed, which is why capsules glow and probes burn.
export const entryHeating = (density: number, speed: number, coefficient: number): number => coefficient * density * speed * speed * speed;
