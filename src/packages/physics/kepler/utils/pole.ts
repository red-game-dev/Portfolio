import { Pole, SubsolarPoint, Vec3 } from "../domain/types";
import { DEG, wrapDegrees } from "./angles";
import { centuriesSinceJ2000, daysSinceJ2000 } from "./time";

// The tilt of Earth's equator to the ecliptic at J2000, in degrees.
export const OBLIQUITY = 23.4392911;

// A pole given in equatorial coordinates, as a unit vector in ecliptic ones, so it can be compared with the
// direction to the Sun.
export const poleVector = ({ ra, dec }: Pole): Vec3 => {
  const x = Math.cos(dec * DEG) * Math.cos(ra * DEG);
  const y = Math.cos(dec * DEG) * Math.sin(ra * DEG);
  const z = Math.sin(dec * DEG);
  const cosE = Math.cos(OBLIQUITY * DEG);
  const sinE = Math.sin(OBLIQUITY * DEG);

  return { x, y: y * cosE + z * sinE, z: -y * sinE + z * cosE };
};

// The latitude of the point under the Sun on a body whose pole points along `pole`, seen from `position` (its
// place round the Sun): its season, in degrees. Positive is northern summer.
export const subsolarLatitude = (pole: Vec3, position: Vec3): number => {
  const distance = Math.hypot(position.x, position.y, position.z) || 1;
  const toSun = -(pole.x * position.x + pole.y * position.y + pole.z * position.z) / distance;

  return Math.asin(Math.max(-1, Math.min(1, toSun))) / DEG;
};

// The point on Earth under the Sun at Julian Day `jd`, from Earth's own place round the Sun: the Sun's right
// ascension and declination less Greenwich sidereal time, so day and night fall where they really are.
export const earthSubsolarPoint = (jd: number, earth: Vec3): SubsolarPoint => {
  // The Sun seen from Earth sits opposite Earth seen from the Sun.
  const longitude = Math.atan2(-earth.y, -earth.x);
  const obliquity = (OBLIQUITY - 0.0130042 * centuriesSinceJ2000(jd)) * DEG;
  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude)) / DEG;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude)) / DEG;
  const sidereal = 280.46061837 + 360.98564736629 * daysSinceJ2000(jd);

  return { longitude: wrapDegrees(ra - sidereal), latitude: declination };
};
