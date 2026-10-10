import type { ContentSource } from "@/packages/core/content";
import type { KeplerElements } from "@/packages/physics/kepler";

import { SolarSystemData } from "../domain/content";

// JPL's Keplerian elements for approximate planet positions (E. M. Standish, valid 1800 to 2050): each value at
// J2000 and its drift per Julian century, as a, e, inclination, mean longitude, longitude of perihelion, node.
const elements = (values: number[], rates: number[]): KeplerElements => ({
  a: { value: values[0], rate: rates[0] },
  e: { value: values[1], rate: rates[1] },
  inclination: { value: values[2], rate: rates[2] },
  meanLongitude: { value: values[3], rate: rates[3] },
  perihelion: { value: values[4], rate: rates[4] },
  node: { value: values[5], rate: rates[5] },
});

const MERCURY = elements([0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
  [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]);
const VENUS = elements([0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
  [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]);
const EARTH = elements([1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
  [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]);
const MARS = elements([1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
  [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]);
const JUPITER = elements([5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
  [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]);
const SATURN = elements([9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
  [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]);
const URANUS = elements([19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
  [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]);
const NEPTUNE = elements([30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
  [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]);
const PLUTO = elements([39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
  [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482]);

// The real solar system: the Sun; every planet and Pluto with their orbits, sizes, gravity, air (with the mean
// molecular weight of its gas from NASA's planetary fact sheets) and ground temperatures, the length of their day
// and where their poles point (IAU); the major moons on circles round
// their planets (mean longitudes from Meeus where known, approximate elsewhere); and the two belts of rocks.
export const SOLAR_SYSTEM: SolarSystemData = {
  star: { id: "sun", radiusKm: 695700, surfaceGravity: 274, temperatureK: 5772, rotationDays: 25.38 },
  bodies: [
    {
      id: "mercury", kind: "planet", orbit: { kind: "sun", elements: MERCURY }, radiusKm: 2439.7, surfaceGravity: 3.7, air: null, dayC: 430, nightC: -180,
      dayHours: 4222.6, pole: { ra: 281.0103, dec: 61.4155 }, rings: null,
    },
    {
      id: "venus", kind: "planet", orbit: { kind: "sun", elements: VENUS }, radiusKm: 6051.8, surfaceGravity: 8.87,
      air: { kind: "thick", pressureBar: 92, temperatureC: 464, topTemperatureC: -43, molarMass: 0.04345 },
      dayC: 464, nightC: 464, dayHours: -2802, pole: { ra: 272.76, dec: 67.16 },
      rings: null,
    },
    {
      id: "earth", kind: "planet", orbit: { kind: "sun", elements: EARTH }, radiusKm: 6371, surfaceGravity: 9.81,
      air: { kind: "thick", pressureBar: 1, temperatureC: 15, topTemperatureC: -60, molarMass: 0.02897 },
      dayC: 15, nightC: 15, dayHours: 24, pole: { ra: 0, dec: 90 }, rings: null,
    },
    {
      id: "moon", kind: "moon", orbit: { kind: "moon", parent: "earth", distanceKm: 384400, periodDays: 27.321661, longitudeAtEpoch: 218.316 },
      radiusKm: 1737.4, surfaceGravity: 1.62, air: null, dayC: 120, nightC: -170, dayHours: null, pole: { ra: 269.9949, dec: 66.5392 }, rings: null,
    },
    {
      id: "mars", kind: "planet", orbit: { kind: "sun", elements: MARS }, radiusKm: 3389.5, surfaceGravity: 3.72,
      air: { kind: "thin", pressureBar: 0.006, temperatureC: -63, topTemperatureC: -120, molarMass: 0.04334 }, dayC: -20, nightC: -90, dayHours: 24.6597,
      pole: { ra: 317.269202, dec: 54.432516 }, rings: null,
    },
    {
      id: "jupiter", kind: "planet", orbit: { kind: "sun", elements: JUPITER }, radiusKm: 69911, surfaceGravity: 24.79,
      air: { kind: "giant", pressureBar: 1, temperatureC: -108, topTemperatureC: -160, molarMass: 0.00222 }, dayC: -108, nightC: -108, dayHours: 9.925,
      pole: { ra: 268.056595, dec: 64.495303 }, rings: { innerKm: 92000, outerKm: 226000 },
    },
    {
      id: "io", kind: "moon", orbit: { kind: "moon", parent: "jupiter", distanceKm: 421700, periodDays: 1.769138, longitudeAtEpoch: 106.07719 },
      radiusKm: 1821.6, surfaceGravity: 1.796, air: null, dayC: -130, nightC: -180, dayHours: null, pole: { ra: 268.05, dec: 64.5 }, rings: null,
    },
    {
      id: "europa", kind: "moon", orbit: { kind: "moon", parent: "jupiter", distanceKm: 671034, periodDays: 3.551181, longitudeAtEpoch: 175.73161 },
      radiusKm: 1560.8, surfaceGravity: 1.314, air: null, dayC: -160, nightC: -220, dayHours: null, pole: { ra: 268.08, dec: 64.51 }, rings: null,
    },
    {
      id: "ganymede", kind: "moon", orbit: { kind: "moon", parent: "jupiter", distanceKm: 1070412, periodDays: 7.154553, longitudeAtEpoch: 120.55883 },
      radiusKm: 2634.1, surfaceGravity: 1.428, air: null, dayC: -160, nightC: -200, dayHours: null, pole: { ra: 268.2, dec: 64.57 }, rings: null,
    },
    {
      id: "callisto", kind: "moon", orbit: { kind: "moon", parent: "jupiter", distanceKm: 1882709, periodDays: 16.689018, longitudeAtEpoch: 84.44459 },
      radiusKm: 2410.3, surfaceGravity: 1.235, air: null, dayC: -140, nightC: -190, dayHours: null, pole: { ra: 268.72, dec: 64.83 }, rings: null,
    },
    {
      id: "saturn", kind: "planet", orbit: { kind: "sun", elements: SATURN }, radiusKm: 58232, surfaceGravity: 10.44,
      air: { kind: "giant", pressureBar: 1, temperatureC: -139, topTemperatureC: -180, molarMass: 0.00207 }, dayC: -139, nightC: -139, dayHours: 10.656,
      pole: { ra: 40.589, dec: 83.537 }, rings: { innerKm: 74658, outerKm: 136775 },
    },
    {
      id: "titan", kind: "moon", orbit: { kind: "moon", parent: "saturn", distanceKm: 1221870, periodDays: 15.945, longitudeAtEpoch: 15 },
      radiusKm: 2574.7, surfaceGravity: 1.352, air: { kind: "thick", pressureBar: 1.45, temperatureC: -179, topTemperatureC: -200, molarMass: 0.0276 },
      dayC: -179, nightC: -179,
      dayHours: null, pole: { ra: 39.48, dec: 83.43 }, rings: null,
    },
    {
      id: "uranus", kind: "planet", orbit: { kind: "sun", elements: URANUS }, radiusKm: 25362, surfaceGravity: 8.69,
      air: { kind: "giant", pressureBar: 1, temperatureC: -197, topTemperatureC: -220, molarMass: 0.00264 }, dayC: -197, nightC: -197, dayHours: -17.24,
      pole: { ra: 257.311, dec: -15.175 }, rings: { innerKm: 41837, outerKm: 51149 },
    },
    {
      id: "neptune", kind: "planet", orbit: { kind: "sun", elements: NEPTUNE }, radiusKm: 24622, surfaceGravity: 11.15,
      air: { kind: "giant", pressureBar: 1, temperatureC: -201, topTemperatureC: -220, molarMass: 0.00261 }, dayC: -201, nightC: -201, dayHours: 16.11,
      pole: { ra: 299.36, dec: 43.46 }, rings: { innerKm: 41900, outerKm: 62930 },
    },
    {
      id: "triton", kind: "moon", orbit: { kind: "moon", parent: "neptune", distanceKm: 354759, periodDays: -5.876854, longitudeAtEpoch: 200 },
      radiusKm: 1353.4, surfaceGravity: 0.779, air: { kind: "thin", pressureBar: 0.000014, temperatureC: -235, topTemperatureC: -235, molarMass: 0.028 },
      dayC: -235, nightC: -235,
      dayHours: null, pole: { ra: 299.36, dec: 41.17 }, rings: null,
    },
    {
      id: "pluto", kind: "dwarf", orbit: { kind: "sun", elements: PLUTO }, radiusKm: 1188.3, surfaceGravity: 0.62,
      air: { kind: "thin", pressureBar: 0.00001, temperatureC: -229, topTemperatureC: -229, molarMass: 0.028 }, dayC: -229, nightC: -229, dayHours: 153.29,
      pole: { ra: 132.993, dec: -6.163 }, rings: null,
    },
    {
      id: "charon", kind: "moon", orbit: { kind: "moon", parent: "pluto", distanceKm: 19591, periodDays: 6.387221, longitudeAtEpoch: 120 },
      radiusKm: 606, surfaceGravity: 0.288, air: null, dayC: -220, nightC: -230, dayHours: null, pole: { ra: 132.993, dec: -6.163 }, rings: null,
    },
  ],
  belts: [
    { id: "belt", fromAu: 2.2, toAu: 3.2, density: 1, isIcy: false },
    { id: "kuiper", fromAu: 30, toAu: 50, density: 0.55, isIcy: true },
  ],
  edgeAu: 52,
};

// Serves the data above, as raw data that the system service guards and validates like any other source.
export class SolarSystemSource implements ContentSource {
  public read(): unknown {
    return SOLAR_SYSTEM;
  }
}
