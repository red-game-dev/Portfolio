import { Element, KeplerElements, Vec3 } from "../domain/types";
import { DEG, wrapDegrees } from "./angles";

const at = (element: Element, centuries: number) => element.value + element.rate * centuries;

// Solves Kepler's equation, M = E - e sin E, for the eccentric anomaly E (radians), by Newton's method from a
// start that converges for every eccentricity below 1.
export const solveKepler = (meanAnomaly: number, eccentricity: number): number => {
  let anomaly = eccentricity < 0.8 ? meanAnomaly : Math.PI * Math.sign(meanAnomaly || 1);

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const delta = (anomaly - eccentricity * Math.sin(anomaly) - meanAnomaly) / (1 - eccentricity * Math.cos(anomaly));

    anomaly -= delta;

    if (Math.abs(delta) < 1e-12) {
      break;
    }
  }

  return anomaly;
};

// Where a body is round the Sun `centuries` after J2000, from its elements: ecliptic J2000 coordinates in AU,
// written into `out` so a step that places every planet allocates nothing. This is JPL's method for approximate
// positions, good to a fraction of a degree from 1800 to 2050.
export const heliocentricPosition = (elements: KeplerElements, centuries: number, out: Vec3 = { x: 0, y: 0, z: 0 }): Vec3 => {
  const a = at(elements.a, centuries);
  const e = at(elements.e, centuries);
  const inclination = at(elements.inclination, centuries) * DEG;
  const meanLongitude = at(elements.meanLongitude, centuries);
  const perihelion = at(elements.perihelion, centuries);
  const node = at(elements.node, centuries);
  const argument = (perihelion - node) * DEG;
  const meanAnomaly = wrapDegrees(meanLongitude - perihelion) * DEG;
  const anomaly = solveKepler(meanAnomaly, e);
  // Position in the plane of the orbit, perihelion along x.
  const px = a * (Math.cos(anomaly) - e);
  const py = a * Math.sqrt(1 - e * e) * Math.sin(anomaly);
  const cosW = Math.cos(argument);
  const sinW = Math.sin(argument);
  const cosO = Math.cos(node * DEG);
  const sinO = Math.sin(node * DEG);
  const cosI = Math.cos(inclination);
  const sinI = Math.sin(inclination);

  out.x = (cosW * cosO - sinW * sinO * cosI) * px + (-sinW * cosO - cosW * sinO * cosI) * py;
  out.y = (cosW * sinO + sinW * cosO * cosI) * px + (-sinW * sinO + cosW * cosO * cosI) * py;
  out.z = sinW * sinI * px + cosW * sinI * py;

  return out;
};

// The orbital period in days of an orbit with semi-major axis `a` AU round the Sun (Kepler's third law).
export const periodDays = (a: number): number => 365.256898 * a ** 1.5;
