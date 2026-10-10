import { muForSurfaceGravity } from "@/packages/physics/newtonian";

import { StarSystem, SystemStar } from "../domain/content";
import type { SystemLayout } from "../mappers/SystemMapper";
import { auForRadius } from "./scale";

// A star's pull grows as its mass to this power, softened so a supergiant's, or a black hole of many Suns, does not
// hold a ship for ever.
const MASS_PULL = 0.6;
const SUN_KM = 695700;
const EARTH_KM = 6371;

// The Sun's pull as the layout draws it: its surface pull at its drawn radius.
const sunPull = (layout: SystemLayout): number =>
  muForSurfaceGravity(layout.starSurfaceAcceleration, layout.earthRadius * (SUN_KM / EARTH_KM) ** layout.radiusExponent);

// The pull (mu, world units) of a mass of that many Suns, a star or a black hole alike: from afar a black hole pulls
// just as a star of its mass would.
export const pullOfMass = (layout: SystemLayout, mass: number): number => sunPull(layout) * mass ** MASS_PULL;

// The mass in Suns that pulls that hard.
export const massOfPull = (layout: SystemLayout, mu: number): number => (mu / sunPull(layout)) ** (1 / MASS_PULL);

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
