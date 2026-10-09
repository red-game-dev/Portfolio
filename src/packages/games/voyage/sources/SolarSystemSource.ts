import type { ContentSource } from "@/packages/core/content";

import { SolarSystemData } from "../domain/content";

// The way out, in real numbers: distance from the Sun (semi-major axis), mean radius, surface gravity (at the
// one bar level for the giants) and surface pressure. Each body sits a little to one side, so the route winds.
export const SOLAR_SYSTEM: SolarSystemData = {
  bodies: [
    { id: "earth", au: 1, radiusKm: 6371, surfaceGravity: 9.81, atmosphere: "thick", surfacePressureBar: 1, offset: 0 },
    { id: "moon", au: 1.00257, radiusKm: 1737, surfaceGravity: 1.62, atmosphere: "none", surfacePressureBar: 0, offset: 0.9 },
    { id: "mars", au: 1.524, radiusKm: 3390, surfaceGravity: 3.72, atmosphere: "thin", surfacePressureBar: 0.006, offset: -0.8 },
    { id: "jupiter", au: 5.204, radiusKm: 69911, surfaceGravity: 24.79, atmosphere: "giant", surfacePressureBar: 1, offset: 0.9 },
    { id: "saturn", au: 9.583, radiusKm: 58232, surfaceGravity: 10.44, atmosphere: "giant", surfacePressureBar: 1, offset: -0.9 },
    { id: "uranus", au: 19.19, radiusKm: 25362, surfaceGravity: 8.69, atmosphere: "giant", surfacePressureBar: 1, offset: 0.7 },
    { id: "neptune", au: 30.07, radiusKm: 24622, surfaceGravity: 11.15, atmosphere: "giant", surfacePressureBar: 1, offset: -0.7 },
    { id: "pluto", au: 39.48, radiusKm: 1188, surfaceGravity: 0.62, atmosphere: "thin", surfacePressureBar: 0.00001, offset: 0.5 },
  ],
  belts: [
    { id: "belt", fromAu: 2.2, toAu: 3.2, density: 1, isIcy: false },
    { id: "kuiper", fromAu: 30.5, toAu: 38.6, density: 0.55, isIcy: true },
  ],
  singularityAu: 46,
};

// Serves the data above, as raw data that the route service guards and validates like any other source.
export class SolarSystemSource implements ContentSource {
  public read(): unknown {
    return SOLAR_SYSTEM;
  }
}
