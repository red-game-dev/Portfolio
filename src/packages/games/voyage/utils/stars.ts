import { StarSystem, SystemStar } from "../domain/content";
import { auForRadius } from "./scale";

// The light falling at a point from every star of a system, written here so asking makes nothing: the total (in
// Suns at 1 AU), and which star gives the most and how much.
export interface StarLight {
  flux: number;
  brightest: SystemStar;
  brightestFlux: number;
}

const NO_STAR: SystemStar = { id: "", x: 0, y: 0, radius: 0, mu: 0, surfaceGravity: 0, temperatureK: 0, rotationDays: 1, kmPerUnit: 1, luminosity: 0, orbit: null };
const light: StarLight = { flux: 0, brightest: NO_STAR, brightestFlux: 0 };

// How much light a star gives at a world distance from it: its brightness over the square of the distance in AU.
export const fluxFrom = (system: StarSystem, star: SystemStar, distance: number): number => {
  const au = auForRadius(system.scale, Math.max(distance, star.radius));

  return star.luminosity / (au * au);
};

// All the starlight at a point, and the star it mostly comes from (the brightest star when none shines at all).
export const lightAt = (system: StarSystem, x: number, y: number): Readonly<StarLight> => {
  const { star, companions } = system;
  const first = fluxFrom(system, star, Math.hypot(star.x - x, star.y - y));

  light.flux = first;
  light.brightest = star;
  light.brightestFlux = first;

  for (const other of companions) {
    const flux = fluxFrom(system, other, Math.hypot(other.x - x, other.y - y));

    light.flux += flux;

    if (flux > light.brightestFlux) {
      light.brightest = other;
      light.brightestFlux = flux;
    }
  }

  return light;
};

// The star a point lies inside, if any.
export const starAt = (system: StarSystem, x: number, y: number): SystemStar | null => {
  if (Math.hypot(system.star.x - x, system.star.y - y) <= system.star.radius) {
    return system.star;
  }

  return system.companions.find((other) => Math.hypot(other.x - x, other.y - y) <= other.radius) ?? null;
};
