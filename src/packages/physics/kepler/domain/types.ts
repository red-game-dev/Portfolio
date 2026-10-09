// A point or direction in space. For positions round the Sun: ecliptic coordinates of J2000, in AU, x towards
// the March equinox and z towards the north ecliptic pole.
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// One orbital element at J2000 and how it drifts per Julian century.
export interface Element {
  value: number;
  rate: number;
}

// The six classical elements of an orbit round the Sun, in the form JPL publishes them for approximate planet
// positions: semi-major axis (AU), eccentricity, inclination, mean longitude, longitude of perihelion and
// longitude of the ascending node (all angles in degrees).
export interface KeplerElements {
  a: Element;
  e: Element;
  inclination: Element;
  meanLongitude: Element;
  perihelion: Element;
  node: Element;
}

// Where a body's north pole points, as right ascension and declination in degrees (IAU, equatorial J2000).
export interface Pole {
  ra: number;
  dec: number;
}

// The point on a body directly under the Sun: longitude and latitude in degrees.
export interface SubsolarPoint {
  longitude: number;
  latitude: number;
}
