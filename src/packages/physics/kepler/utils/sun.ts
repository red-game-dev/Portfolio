import { DEG, wrapDegrees } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { SubsolarPoint } from "../domain/types";
import { daysSinceJ2000 } from "./time";

// The point on Earth under the Sun at Julian Day `jd`, from the Astronomical Almanac's low precision formulae for
// the Sun's place (good to about a hundredth of a degree from 1950 to 2050): its ecliptic longitude, then its
// right ascension and declination, less Greenwich sidereal time. For when Earth's own orbit is not to hand.
export const sunSubsolarPoint = (jd: number): SubsolarPoint => {
  const days = daysSinceJ2000(jd);
  const meanLongitude = 280.46 + 0.9856474 * days;
  const anomaly = (357.528 + 0.9856003 * days) * DEG;
  const longitude = (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * DEG;
  const obliquity = (23.439 - 0.0000004 * days) * DEG;
  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude)) / DEG;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude)) / DEG;
  const sidereal = 280.46061837 + 360.98564736629 * days;

  return { longitude: wrapDegrees(ra - sidereal), latitude: declination };
};

// How high the Sun stands over the horizon at a place (degrees, negative below it), given the point under the
// Sun: the angle between the place's zenith and the Sun, taken from a right angle.
export const solarElevation = (subsolar: SubsolarPoint, latitude: number, longitude: number): number => {
  const sine = Math.sin(latitude * DEG) * Math.sin(subsolar.latitude * DEG) +
    Math.cos(latitude * DEG) * Math.cos(subsolar.latitude * DEG) * Math.cos((longitude - subsolar.longitude) * DEG);

  return Math.asin(clamp(sine, -1, 1)) / DEG;
};
