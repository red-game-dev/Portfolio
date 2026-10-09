import { wrapDegrees } from "@/packages/math/angles";
import {
  centuriesSinceJ2000,
  earthSubsolarPoint,
  heliocentricPosition,
  julianDay,
  KeplerElements,
  OBLIQUITY,
  poleVector,
  solarElevation,
  solveKepler,
  subsolarLatitude,
  sunSubsolarPoint,
} from "@/packages/physics/kepler";

// JPL's elements for the Earth and Moon barycentre and for Mars, valid 1800 to 2050.
const EARTH: KeplerElements = {
  a: { value: 1.00000261, rate: 0.00000562 },
  e: { value: 0.01671123, rate: -0.00004392 },
  inclination: { value: -0.00001531, rate: -0.01294668 },
  meanLongitude: { value: 100.46457166, rate: 35999.37244981 },
  perihelion: { value: 102.93768193, rate: 0.32327364 },
  node: { value: 0, rate: 0 },
};

const MARS: KeplerElements = {
  a: { value: 1.52371034, rate: 0.00001847 },
  e: { value: 0.0933941, rate: 0.00007882 },
  inclination: { value: 1.84969142, rate: -0.00813131 },
  meanLongitude: { value: -4.55343205, rate: 19140.30268499 },
  perihelion: { value: -23.94362959, rate: 0.44441088 },
  node: { value: 49.55953891, rate: -0.29257343 },
};

const longitudeOf = ({ x, y }: { x: number; y: number }) => (Math.atan2(y, x) * 180) / Math.PI;

const at = (iso: string) => centuriesSinceJ2000(julianDay(Date.parse(iso)));

describe("physics/kepler", () => {
  test("solves Kepler's equation even for a long thin orbit", () => {
    [0, 0.2, 0.6, 0.9, 0.97].forEach((e) => {
      [-3, -1, 0.3, 2.5].forEach((meanAnomaly) => {
        const anomaly = solveKepler(meanAnomaly, e);

        expect(anomaly - e * Math.sin(anomaly)).toBeCloseTo(meanAnomaly, 10);
      });
    });
  });

  test("puts Earth just past perihelion at J2000, about 0.983 AU out", () => {
    const earth = heliocentricPosition(EARTH, 0);

    expect(Math.hypot(earth.x, earth.y, earth.z)).toBeCloseTo(0.9833, 3);
    expect(longitudeOf(earth)).toBeCloseTo(100.38, 1);
  });

  test("Mars comes back to the same place after its 687 day year", () => {
    const start = heliocentricPosition(MARS, 0.2);
    const year = heliocentricPosition(MARS, 0.2 + 686.98 / 36525);

    expect(Math.hypot(year.x - start.x, year.y - start.y, year.z - start.z)).toBeLessThan(0.01);
  });

  // JPL's approximate method is good to a few tenths of a degree, which is a few hours of season.
  test("the Sun stands over the tropic at the June solstice and the equator at the March equinox", () => {
    const solstice = Date.parse("2024-06-20T20:51:00Z");
    const equinox = Date.parse("2024-03-20T03:06:00Z");

    expect(earthSubsolarPoint(julianDay(solstice), heliocentricPosition(EARTH, at("2024-06-20T20:51:00Z"))).latitude).toBeCloseTo(23.44, 1);
    expect(Math.abs(earthSubsolarPoint(julianDay(equinox), heliocentricPosition(EARTH, at("2024-03-20T03:06:00Z"))).latitude)).toBeLessThan(0.25);
  });

  test("at noon UTC the Sun is over Greenwich, give or take the equation of time", () => {
    const noon = "2024-06-21T12:00:00Z";
    const point = earthSubsolarPoint(julianDay(Date.parse(noon)), heliocentricPosition(EARTH, at(noon)));
    const evening = "2024-06-21T18:00:00Z";
    const later = earthSubsolarPoint(julianDay(Date.parse(evening)), heliocentricPosition(EARTH, at(evening)));

    expect(Math.abs(point.longitude)).toBeLessThan(1.5);
    // Six hours later it has moved a quarter of the way round, westward.
    expect(wrapDegrees(later.longitude - point.longitude)).toBeCloseTo(-90, 0);
  });

  test("the Sun's place from the almanac agrees with the one from Earth's orbit, and sets the Sun's height anywhere", () => {
    ["2024-06-20T20:51:00Z", "2025-01-03T08:00:00Z", "2026-10-09T12:00:00Z"].forEach((moment) => {
      const fromOrbit = earthSubsolarPoint(julianDay(Date.parse(moment)), heliocentricPosition(EARTH, at(moment)));
      const fromAlmanac = sunSubsolarPoint(julianDay(Date.parse(moment)));

      // Within the precession since 2000 (about 50 arcseconds a year), which the almanac counts and JPL's J2000
      // elements do not.
      expect(Math.abs(wrapDegrees(fromAlmanac.longitude - fromOrbit.longitude))).toBeLessThan(0.5);
      expect(Math.abs(fromAlmanac.latitude - fromOrbit.latitude)).toBeLessThan(0.2);
    });

    const solstice = sunSubsolarPoint(julianDay(Date.parse("2024-06-20T20:51:00Z")));

    // Overhead under the Sun, on the horizon a quarter of the world away, and the midnight sun on the Arctic circle.
    expect(solarElevation(solstice, solstice.latitude, solstice.longitude)).toBeCloseTo(90, 5);
    expect(solarElevation(solstice, 0, wrapDegrees(solstice.longitude + 90))).toBeCloseTo(0, 0);
    expect(solarElevation(solstice, 66.6, wrapDegrees(solstice.longitude + 180))).toBeGreaterThan(-0.5);
    // Florida's launch coast at local midnight in October is in the dark, and in daylight at noon.
    expect(solarElevation(sunSubsolarPoint(julianDay(Date.parse("2026-10-09T04:00:00Z"))), 28.6, -80.6)).toBeLessThan(-30);
    expect(solarElevation(sunSubsolarPoint(julianDay(Date.parse("2026-10-09T17:00:00Z"))), 28.6, -80.6)).toBeGreaterThan(45);
  });

  test("turns a pole into ecliptic coordinates and reads the season from it", () => {
    const pole = poleVector({ ra: 0, dec: 90 });
    const tilt = (OBLIQUITY * Math.PI) / 180;

    expect(pole.y).toBeCloseTo(Math.sin(tilt), 10);
    expect(pole.z).toBeCloseTo(Math.cos(tilt), 10);
    // With the Sun along -y from a body, a pole tipped towards +y has its north in summer.
    expect(subsolarLatitude(pole, { x: 0, y: -1, z: 0 })).toBeCloseTo(OBLIQUITY, 6);
  });
});
