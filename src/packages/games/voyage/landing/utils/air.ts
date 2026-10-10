import { LandingAir } from "../domain/landing";

// The gas constant (J/mol/K).
const GAS = 8.314462618;
// Gases heavier than this are mostly carbon dioxide or heavier, whose heat capacity ratio is lower than that of
// the light diatomic gases.
const HEAVY_GAS = 0.04;

// Air near the ground from what is measured there, by the ideal gas law: density from pressure (bar), temperature
// (Celsius) and the gas's mean molar mass (kg/mol); its scale height, how far up it thins by e, at that temperature
// under that gravity; and the speed of sound. Earth: 1.22 kg/m^3, 8.4 km, 340 m/s. Mars: 0.016 kg/m^3, 11 km,
// 230 m/s. Titan: 5.2 kg/m^3, 21 km, 195 m/s. Venus: 65 kg/m^3, 16 km, 430 m/s.
export const airFromSurface = (pressureBar: number, temperatureC: number, molarMass: number, gravity: number): LandingAir => {
  const kelvin = Math.max(20, temperatureC + 273.15);
  const ratio = molarMass > HEAVY_GAS ? 1.3 : 1.4;

  return {
    density: (pressureBar * 1e5 * molarMass) / (GAS * kelvin),
    scaleHeight: (GAS * kelvin) / (molarMass * Math.max(0.01, gravity)),
    soundSpeed: Math.sqrt((ratio * GAS * kelvin) / molarMass),
  };
};

// Density at a height (m) in that air.
export const densityAt = (air: LandingAir | null, altitude: number): number => (air ? air.density * Math.exp(-Math.max(0, altitude) / air.scaleHeight) : 0);

// The speed of a circular orbit at a height (m) over a world of that surface gravity and radius (m).
export const orbitalSpeed = (gravity: number, radius: number, altitude: number): number => Math.sqrt((gravity * radius * radius) / (radius + altitude));

// The speed a craft of that ballistic coefficient falls at when drag holds its weight, at that density.
export const terminalSpeed = (ballistic: number, gravity: number, density: number): number => (density > 0 ? Math.sqrt((2 * ballistic * gravity) / density) : Infinity);

// The ballistic coefficient that falls at `speed` where the air is that dense.
export const ballisticFor = (speed: number, gravity: number, density: number): number => (speed * speed * density) / (2 * gravity);
