import { Mapper } from "@/packages/core/domain";
import { poleVector } from "@/packages/physics/kepler";
import { muForSurfaceGravity } from "@/packages/physics/newtonian";

import { BodyData, SolarSystemData, StarSystem, SystemBody, SystemScale } from "../domain/content";
import { radiusForAu } from "../utils/scale";
import { airModel } from "./air";

export interface SystemLayout {
  // World units per square root of an AU: Earth's orbit sits this far from the Sun.
  unitsPerRootAu: number;
  // World radius of an Earth sized body, and how much real sizes are compressed (1 is true to scale).
  earthRadius: number;
  radiusExponent: number;
  // World acceleration per m/s^2, so every body's surface gravity reads true in telemetry.
  gravityScale: number;
  // The star's pull at its surface in world units: under a healthy burn, so a sound ship can always climb out,
  // and over a crippled one, so one that lingers may not.
  starSurfaceAcceleration: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_PER_AU = 149597870.7;

// The share of the room between a planet's orbit and its nearest neighbour's that its moons may take. Sizes are drawn
// far larger than life and distances compressed, so a moon set out by its real distance in its planet's radii can
// reach the next orbit (the Moon, sixty Earth radii out, came within reach of Venus); held to this share, a moon
// always sits by its own planet.
const MOON_ROOM = 0.35;

// Lays the real solar system out as a playable world: the Sun at the centre, every body where it really is on
// the mission clock (placed each step by the orbit system), distances from the Sun compressed by `SystemScale`,
// sizes compressed by a power so Jupiter is big but Pluto still visible, and moons set out from their planets
// by the square root of their real distance in its radii. Gravity is set per body so its surface gravity, read
// back in real units, is its real one; air gets its real pressure and temperatures, and a density that follows
// from them, which is why Titan's air is four times Earth's.
export class SystemMapper extends Mapper<SolarSystemData, StarSystem> {
  constructor(private readonly layout: SystemLayout) {
    super();
  }

  public map({ star, bodies, belts, edgeAu }: SolarSystemData): StarSystem {
    const starRadius = this.radiusFor(star.radiusKm);
    const innerAu = Math.min(...bodies.map((body) => (body.orbit.kind === "sun" ? body.orbit.elements.a.value : Infinity)));
    const scale: SystemScale = { unitsPerRootAu: this.layout.unitsPerRootAu, innerAu, starRadius, starRadiusAu: star.radiusKm / KM_PER_AU };
    const radii = new Map(bodies.map((body) => [body.id, { km: body.radiusKm, world: this.radiusFor(body.radiusKm) }]));

    return {
      star: {
        id: star.id,
        x: 0,
        y: 0,
        radius: starRadius,
        mu: muForSurfaceGravity(this.layout.starSurfaceAcceleration, starRadius),
        surfaceGravity: star.surfaceGravity,
        temperatureK: star.temperatureK,
        rotationDays: star.rotationDays,
        kmPerUnit: star.radiusKm / starRadius,
        luminosity: 1,
        orbit: null,
      },
      companions: [],
      bodies: keepMoonsClose(bodies.map((body) => this.body(body, radii)), scale),
      belts: belts.map((belt) => ({
        id: belt.id,
        inner: radiusForAu(scale, belt.fromAu),
        outer: radiusForAu(scale, belt.toAu),
        density: belt.density,
        isIcy: belt.isIcy,
      })),
      edge: radiusForAu(scale, edgeAu),
      scale,
    };
  }

  private radiusFor(radiusKm: number): number {
    return this.layout.earthRadius * (radiusKm / EARTH_RADIUS_KM) ** this.layout.radiusExponent;
  }

  private body(data: BodyData, radii: Map<string, { km: number; world: number }>): SystemBody {
    const radius = this.radiusFor(data.radiusKm);
    const parent = data.orbit.kind === "moon" ? radii.get(data.orbit.parent) : undefined;

    return {
      id: data.id,
      kind: data.kind,
      parent: data.orbit.kind === "moon" ? data.orbit.parent : null,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      real: { x: 0, y: 0, z: 0 },
      au: 0,
      radius,
      mu: muForSurfaceGravity(data.surfaceGravity * this.layout.gravityScale, radius),
      isGiant: data.air?.kind === "giant",
      isLandable: data.air?.kind !== "giant",
      air: data.air ? airModel(data.air, radius) : null,
      surfaceGravity: data.surfaceGravity,
      dayC: data.dayC,
      nightC: data.nightC,
      kmPerUnit: data.radiusKm / radius,
      orbit: data.orbit.kind === "moon" && parent
        ? {
          kind: "moon",
          parent: data.orbit.parent,
          distance: parent.world * Math.sqrt(data.orbit.distanceKm / parent.km),
          distanceKm: data.orbit.distanceKm,
          periodDays: data.orbit.periodDays,
          longitudeAtEpoch: data.orbit.longitudeAtEpoch,
        }
        : { kind: "sun", elements: data.orbit.kind === "sun" ? data.orbit.elements : MISSING_ELEMENTS },
      dayHours: data.dayHours,
      pole: poleVector(data.pole),
      rings: data.rings ? { inner: data.rings.innerKm / data.radiusKm, outer: data.rings.outerKm / data.radiusKm } : null,
      subsolarLongitude: 0,
      subsolarLatitude: 0,
      isShattered: false,
    };
  }
}

// Each planet's moons drawn in, together, until the farthest is within `MOON_ROOM` of the room to the nearest
// neighbouring orbit: only the height above the planet's surface shrinks, the same share for every moon of it, so
// they keep their order and their spacing against each other. A planet whose moons already fit keeps them as they are.
const keepMoonsClose = (bodies: SystemBody[], scale: SystemScale): SystemBody[] => {
  const orbits = new Map(bodies.flatMap((body) => (body.orbit?.kind === "sun" ? [[body.id, radiusForAu(scale, body.orbit.elements.a.value)] as const] : [])));
  const roomOf = (id: string): number => {
    const own = orbits.get(id) ?? 0;
    const gaps = [...orbits].filter(([other]) => other !== id).map(([, orbit]) => Math.abs(orbit - own));

    return Math.min(own - scale.starRadius, ...gaps) * MOON_ROOM;
  };
  const shrink = new Map<string, number>();

  bodies.forEach((planet) => {
    const moons = bodies.filter((moon) => moon.orbit?.kind === "moon" && moon.orbit.parent === planet.id);
    const farthest = Math.max(0, ...moons.map((moon) => (moon.orbit?.kind === "moon" ? moon.orbit.distance : 0)));
    const room = roomOf(planet.id);

    if (moons.length > 0 && farthest > room && farthest > planet.radius) {
      shrink.set(planet.id, Math.max(0, room - planet.radius) / (farthest - planet.radius));
    }
  });

  return bodies.map((body) => {
    const parent = body.orbit?.kind === "moon" ? bodies.find((planet) => planet.id === body.parent) : undefined;
    const share = body.parent ? shrink.get(body.parent) : undefined;

    return body.orbit?.kind === "moon" && parent && share !== undefined
      ? { ...body, orbit: { ...body.orbit, distance: parent.radius + (body.orbit.distance - parent.radius) * share } }
      : body;
  });
};

// Never used: the validator refuses a body that circles the Sun without elements.
const MISSING_ELEMENTS = {
  a: { value: 1, rate: 0 },
  e: { value: 0, rate: 0 },
  inclination: { value: 0, rate: 0 },
  meanLongitude: { value: 0, rate: 0 },
  perihelion: { value: 0, rate: 0 },
  node: { value: 0, rate: 0 },
};
