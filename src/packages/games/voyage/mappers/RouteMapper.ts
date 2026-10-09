import { Mapper } from "@/packages/core/domain";
import { muForSurfaceGravity } from "@/packages/physics/newtonian";

import { AtmosphereKind, BodyData, Route, RouteBody, SolarSystemData } from "../domain/content";

export interface RouteLayout {
  // World distance from Earth to the last body.
  length: number;
  // World radius of an Earth sized body, and how much real sizes are compressed (1 is true to scale).
  earthRadius: number;
  radiusExponent: number;
  // World acceleration per m/s^2, so every body's surface gravity reads true in telemetry.
  gravityScale: number;
  // How far to the side a body with offset 1 sits.
  spread: number;
}

const EARTH_RADIUS_KM = 6371;

// How high each kind of air reaches, as a share of the body's radius.
const AIR_TOP: Record<AtmosphereKind, number> = { none: 0, thin: 0.14, thick: 0.3, giant: 0.4 };

// Lays the real solar system out as a playable world. Distance along the way grows with the square root of
// the distance from the Sun, so at a steady speed the planets come round at the pace the real ones are spaced,
// inner ones not crowded and outer ones not an age apart. Sizes are compressed so Jupiter is big but Pluto is
// still visible. Gravity is set per body so its surface gravity, read back in real units, is its real one.
export class RouteMapper extends Mapper<SolarSystemData, Route> {
  constructor(private readonly layout: RouteLayout) {
    super();
  }

  public map({ bodies, belts, singularityAu }: SolarSystemData): Route {
    const lastAu = bodies[bodies.length - 1].au;
    const along = (au: number) => this.layout.length * Math.sqrt(Math.max(0, au - 1) / (lastAu - 1));

    return {
      bodies: bodies.map((body) => this.body(body, along(body.au))),
      belts: belts.map((belt) => ({ id: belt.id, inner: along(belt.fromAu), outer: along(belt.toAu), density: belt.density, isIcy: belt.isIcy })),
      origin: { x: 0, y: 0 },
      length: this.layout.length,
      lastAu,
      singularity: { x: 0, y: -along(singularityAu), au: singularityAu },
    };
  }

  private body(data: BodyData, distance: number): RouteBody {
    const { earthRadius, radiusExponent, gravityScale, spread } = this.layout;
    const radius = earthRadius * (data.radiusKm / EARTH_RADIUS_KM) ** radiusExponent;
    const top = AIR_TOP[data.atmosphere] * radius;
    // Close to the start a full step aside would throw the Moon far from Earth; the offset grows with distance.
    const aside = data.offset * spread * Math.min(1, distance / (spread * 2));

    return {
      id: data.id,
      x: aside,
      y: -distance,
      radius,
      mu: muForSurfaceGravity(data.surfaceGravity * gravityScale, radius),
      au: data.au,
      isGiant: data.atmosphere === "giant",
      isLandable: data.atmosphere !== "giant",
      atmosphere: top > 0 ? { surfaceDensity: data.surfacePressureBar, scaleHeight: top / 4, top } : null,
      surfaceGravity: data.surfaceGravity,
      surfacePressureBar: data.surfacePressureBar,
      kmPerUnit: data.radiusKm / radius,
    };
  }
}
