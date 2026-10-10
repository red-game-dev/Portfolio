import { hslToHex } from "@/packages/graphics/colour";
import type { GlobeLook } from "@/packages/graphics/globe";
import { TAU } from "@/packages/math/angles";
import { createSeededRandom, pick, pickWeighted, RandomSource, randomBetween } from "@/packages/math/random";
import { poleVector } from "@/packages/physics/kepler";
import { muForSurfaceGravity } from "@/packages/physics/newtonian";

import { GALAXIES, GALAXY_KINDS } from "../config/galaxies";
import { COMPACT, MULTIPLES, PARTNERS, STAR_CLASSES, STAR_WEIGHTS, StarClass } from "../config/stars";
import { WORLD_CLASSES } from "../config/worlds";
import { StarOrbit, StarSystem, SystemBody, SystemOrbit, SystemScale, SystemStar } from "../domain/content";
import { VoyageStyle, DEEP_STYLES } from "../domain/theme";
import {
  Disposition,
  FactionSpec,
  GalaxyKind,
  GalaxySpec,
  HullShape,
  Multiplicity,
  PhenomenonKind,
  PhenomenonSpec,
  StarKind,
  UniverseNames,
  UniverseSpec,
  WeaponKind,
  WorldClass,
} from "../domain/universe";
import { airModel } from "../mappers/air";
import { SystemLayout } from "../mappers/SystemMapper";
import { auForRadius, radiusForAu } from "../utils/scale";
import { lookFor } from "./looks";
import { factionName, nameWord, universeName } from "./names";
import { airFor, classFor, equilibriumC, gravityFor, moonClassFor, radiusFor } from "./worlds";

const SHAPE_WEAPONS: Record<HullShape, WeaponKind> = { saucer: "cannon", insect: "spit", crystal: "laser", organic: "spit", monolith: "laser", swarm: "cannon" };
const SHAPES: readonly HullShape[] = ["saucer", "insect", "crystal", "organic", "monolith", "swarm"];

// What can be found in a universe, how likely, and from which universe on.
const PHENOMENA: Array<{ kind: PhenomenonKind; weight: number; from: number }> = [
  { kind: "nebula", weight: 5, from: 0 },
  { kind: "whales", weight: 3, from: 0 },
  { kind: "wormholes", weight: 3, from: 1 },
  { kind: "pulsar", weight: 3, from: 1 },
  { kind: "magnetar", weight: 2, from: 2 },
  { kind: "supernova", weight: 2, from: 2 },
  { kind: "gammaBurst", weight: 2, from: 2 },
  { kind: "quasar", weight: 1, from: 3 },
  { kind: "darkForest", weight: 2, from: 3 },
];

const WARM_UP = 3;
// Planets are lettered from b out, as astronomers letter them round other stars; moons numbered.
const LETTERS = ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const MOST_WORLDS = 10;
const SUN_KM = 695700;
const EARTH_KM = 6371;
const KM_PER_AU = 149597870.7;
// The Sun's surface gravity (m/s^2) and the days in a year, for a star's pull and a world's year by Kepler's law.
const SUN_GRAVITY = 274;
const DAYS_PER_YEAR = 365.25;
// A star's pull grows as its mass to this power, softened so a supergiant's does not hold a ship forever.
const MASS_PULL = 0.6;
// The square root distance begins this many of the star's drawn radii out, and never nearer than this (world units).
const INNER_RADII = 3.5;
const NEAREST = 8;
// The first moon lies this many of its planet's drawn radii out (and this many real radii), each next this many
// times further (Io, Europa, Ganymede and Callisto each lie about 1.6 times further out than the last).
const MOON_GAP = 2.6;
const MOON_RADII = 5;
const MOON_SPREAD = 1.55;
// No world circles further out than this (world units), so even a supergiant's system can be crossed.
const FURTHEST = 420;
// Round one star of a wide pair, worlds stay within this fraction of the pair's separation; further, the partner
// would pull them away.
const S_TYPE_LIMIT = 3.5;
// No world circles nearer its star than this many of the star's drawn radii.
const HUGGING = 1.6;

// A star keeping another company, its kind and its body in world units.
interface Partner {
  kind: StarKind;
  body: StarBody;
}

// How a system's stars are to be arranged: the brightest, those keeping it company and how, how far apart the pair
// is, the scale, and the worlds already made.
interface Arrangement {
  star: StarBody;
  partners: Partner[];
  multiplicity: Multiplicity;
  apart: number;
  scale: SystemScale;
  bodies: SystemBody[];
}

// The stars that keep the brightest company are lettered B and C.
const PARTNER_LETTERS = ["b", "c"];

// A star in world units, with the class it is of.
interface StarBody {
  spec: StarClass;
  radius: number;
  radiusKm: number;
  mu: number;
  surfaceGravity: number;
}

// What a system's worlds are made round, and what is collected as they are made: the light and mass they circle
// (both of a close pair's), the star they circle if only one (a wide pair's brighter star), and how far from the
// centre they must keep (clear of a close pair) and how far they can stray (inside a third of a wide pair's
// separation, past which its partner would pull them away).
interface SystemPlan {
  index: number;
  starKind: StarKind | null;
  star: StarBody | null;
  scale: SystemScale;
  metals: number;
  isVoid: boolean;
  luminosity: number;
  mass: number;
  host: string | undefined;
  clearance: number;
  furthest: number;
}

interface Made {
  looks: Record<string, GlobeLook>;
  classes: Record<string, WorldClass>;
  names: Record<string, string>;
  base: string;
}

interface WorldPlan {
  id: string;
  kind: WorldClass;
  temperatureC: number;
  au: number;
  orbit: SystemOrbit;
  parent: string | null;
  starKind: StarKind | null;
  seed: number;
}

interface MadeWorld {
  body: SystemBody;
  radiusKm: number;
  gravity: number;
  kind: WorldClass;
}

export interface UniverseTheme {
  name: string;
  style: VoyageStyle;
  accent: string;
  deep: string;
  hazard: string;
}

// One of `options`, as likely as its weight beside it.
const weighted = <T>(random: RandomSource, options: ReadonlyArray<readonly [T, number]>): T => (pickWeighted(random, options, ([, weight]) => weight) ?? options[0])[0];

// Makes universes. Everything in one comes from its seed, so a run that passes the same way sees the same
// universes, and every one differs from the last: its star (or none), worlds whose kind follows from how much
// light reaches them, the factions that live there, the strange things it holds, and a danger that grows the
// further the ship has come. The first universes take the site's zones for their look and names; past them,
// each makes up its own.
export class UniverseGenerator {
  constructor(private readonly layout: SystemLayout, private readonly names: UniverseNames) {}

  public generate(index: number, seed: number, theme: UniverseTheme | null): UniverseSpec {
    const random = createSeededRandom(seed);

    // A Park-Miller generator's first values follow its seed closely, so near seeds would make near universes;
    // a few draws thrown away scatter them.
    for (let draw = 0; draw < WARM_UP; draw += 1) {
      random();
    }

    const danger = 1 + index * 0.35;
    const style: VoyageStyle = theme?.style ?? pick(random, DEEP_STYLES);
    const hue = random() * 360;
    const isVoid = style === "void";
    const galaxy = this.galaxy(random);
    const metals = GALAXIES[galaxy.kind].metals;
    const starKind: StarKind | null = isVoid ? null : weighted(random, STAR_WEIGHTS[galaxy.kind]);
    const star = starKind ? this.starOf(starKind) : null;
    const multiplicity = starKind ? this.multiplicity(random, starKind) : "single";
    const partners = this.partners(random, star, multiplicity, galaxy.kind);
    const pair = multiplicity === "close" || multiplicity === "triple" ? partners[0] : null;
    const luminosity = (star?.spec.luminosity ?? 0) + (pair?.body.spec.luminosity ?? 0);
    const mass = (star?.spec.mass ?? 1) + (pair?.body.spec.mass ?? 0);
    const scale = this.scaleFor(star, luminosity);
    // A close pair's two stars a few of their own radii apart, its worlds no nearer than three times that.
    const separation = pair && star ? (star.radius + pair.body.radius) * randomBetween(random, 2.5, 4) : 0;
    const looks: Record<string, GlobeLook> = {};
    const classes: Record<string, WorldClass> = {};
    const word = nameWord(random, this.names);
    const isMultiple = multiplicity !== "single";
    const names: Record<string, string> = { star: isMultiple ? `${word} A` : word };
    const base = pair ? `${word} AB` : isMultiple ? `${word} A` : word;
    const host = multiplicity === "wide" ? "star" : undefined;
    // A wide pair's two stars far apart, its worlds within a third of that of the brighter.
    const apart = multiplicity === "wide" ? FURTHEST * randomBetween(random, 0.6, 1) : separation;
    const furthest = multiplicity === "wide" ? apart / S_TYPE_LIMIT : FURTHEST;
    const plan = { index, starKind, star, scale, metals, isVoid, luminosity, mass, host, clearance: separation * 3, furthest };
    const bodies = this.worlds(random, plan, { looks, classes, names, base });
    const companions = star ? this.arrange(random, { star, partners, multiplicity, apart, scale, bodies }) : { primary: null, others: [] };

    partners.forEach((_, order) => {
      names[`star-${PARTNER_LETTERS[order]}`] = `${word} ${PARTNER_LETTERS[order].toUpperCase()}`;
    });
    // How far out each world's moons reach.
    const moonReach = (body: SystemBody) =>
      Math.max(body.radius, ...bodies.map((moon) => (moon.orbit.kind === "moon" && moon.parent === body.id ? moon.orbit.distance : 0)));
    // A wide pair's worlds ride round with their star, as far from the centre as it is.
    const hostReach = companions.primary && host ? companions.primary.distance : 0;
    const reach = (body: SystemBody) => (body.orbit.kind === "circle" ? hostReach + body.orbit.distance + moonReach(body) : 0);
    const edge = Math.max(30, ...bodies.map(reach), ...companions.others.map((other) => (other.orbit?.distance ?? 0) + other.radius)) + 14;
    const system: StarSystem = {
      star: {
        id: "star",
        x: 0,
        y: 0,
        radius: star?.radius ?? 0.5,
        mu: star?.mu ?? 0,
        surfaceGravity: star?.surfaceGravity ?? 0,
        temperatureK: star?.spec.temperatureK ?? 3,
        rotationDays: randomBetween(random, 2, 40),
        kmPerUnit: star ? star.radiusKm / star.radius : SUN_KM / 2.9,
        luminosity: star?.spec.luminosity ?? 0,
        orbit: companions.primary,
      },
      companions: companions.others,
      bodies,
      belts: random() < 0.5 ? [this.belt(random, bodies, scale)] : [],
      edge,
      scale,
    };
    const disposition = (): Disposition => weighted(random, [["hostile", 3 + index * 0.6], ["territorial", 2.5], ["neutral", 2], ["peaceful", 2]]);
    const phenomena = this.phenomena(random, index, edge);
    const isDark = phenomena.some((phenomenon) => phenomenon.kind === "darkForest");
    // In a dark forest every civilisation hides: no ship is ever seen until one strikes.
    const factions = isDark ? [] : Array.from({ length: isVoid ? 1 : 1 + Math.floor(random() * 3) }, (_, id) => this.faction(random, id, disposition(), danger, hue));

    return {
      index,
      seed,
      name: theme?.name ?? universeName(random, this.names),
      style,
      accent: theme?.accent ?? hslToHex(hue, 0.9, 0.66),
      deep: theme?.deep ?? hslToHex(hue, 0.55, 0.035),
      hazard: theme?.hazard ?? hslToHex(hue + 180, 0.85, 0.62),
      starKind,
      starLook: star
        ? { temperatureK: star.spec.temperatureK, granulation: starKind === "neutron" ? 0 : 1, spots: star.spec.spots, corona: star.spec.corona, seed: seed % 997 }
        : null,
      multiplicity,
      companionKinds: partners.map((partner) => partner.kind),
      companionLooks: partners.map((partner, order) => ({
        temperatureK: partner.body.spec.temperatureK,
        granulation: partner.kind === "whiteDwarf" ? 0 : 1,
        spots: partner.body.spec.spots,
        corona: partner.body.spec.corona,
        seed: (seed + order * 131) % 997,
      })),
      galaxy,
      system,
      looks,
      classes,
      names,
      factions,
      phenomena,
      danger,
    };
  }

  // The galaxy a universe sits in: a kind as common as galaxies of that kind are, in its own colours.
  private galaxy(random: RandomSource): GalaxySpec {
    const kind = weighted(random, GALAXY_KINDS.map((option): [GalaxyKind, number] => [option, GALAXIES[option].weight]));
    const spec = GALAXIES[kind];
    const [fewest, most] = spec.armCount;

    return {
      kind, core: spec.core, arms: spec.arms, tilt: random() * TAU, armCount: fewest + Math.floor(random() * (most - fewest + 1)), seed: Math.floor(random() * 1e6),
    };
  }

  // A star of a kind in world units: as large on screen as the same rule that sizes the worlds makes it (the dead
  // stars a little larger, to be seen), its pull from its mass (softened, so a giant's thin outer layers barely pull
  // at all and a ship can always climb away), and its real surface gravity, for the readings.
  private starOf(kind: StarKind): StarBody {
    const spec = STAR_CLASSES[kind];
    const radiusKm = spec.radius * SUN_KM;
    const compact = COMPACT[kind];
    const radius = compact?.radius ?? this.layout.earthRadius * (radiusKm / EARTH_KM) ** this.layout.radiusExponent;
    const sunRadius = this.layout.earthRadius * (SUN_KM / EARTH_KM) ** this.layout.radiusExponent;
    const sunMu = muForSurfaceGravity(this.layout.starSurfaceAcceleration, sunRadius);

    return {
      spec,
      radius,
      radiusKm,
      mu: compact ? muForSurfaceGravity(compact.pull, compact.radius) : sunMu * spec.mass ** MASS_PULL,
      surfaceGravity: (SUN_GRAVITY * spec.mass) / spec.radius ** 2,
    };
  }

  // Whether a star of this kind shares its system, and how.
  private multiplicity(random: RandomSource, kind: StarKind): Multiplicity {
    const [close, wide, triple] = MULTIPLES[kind] ?? [0, 0, 0];
    const roll = random();

    return roll < close ? "close" : roll < close + wide ? "wide" : roll < close + wide + triple ? "triple" : "single";
  }

  // The stars that keep a star company: each no heavier than it, as common as the galaxy makes such stars.
  private partners(random: RandomSource, star: StarBody | null, multiplicity: Multiplicity, galaxy: GalaxyKind): Partner[] {
    if (!star || multiplicity === "single") {
      return [];
    }

    const options = STAR_WEIGHTS[galaxy].filter(([kind]) => PARTNERS.includes(kind) && STAR_CLASSES[kind].mass <= star.spec.mass);

    return Array.from({ length: multiplicity === "triple" ? 2 : 1 }, () => {
      const kind = options.length > 0 ? weighted(random, options) : "red";

      return { kind, body: this.starOf(kind) };
    });
  }

  // Where the stars go. A close pair circles the centre in days, the heavier nearer, its worlds circling round both;
  // a wide pair's partner keeps well beyond the brighter star's worlds, the two circling the centre over centuries
  // with those worlds carried round with their star; a triple's third keeps far out round the close pair.
  private arrange(random: RandomSource, plan: Arrangement): { primary: StarOrbit | null; others: SystemStar[] } {
    const { star, partners, apart, scale, bodies } = plan;
    const outer = Math.max(30, ...bodies.map((body) => (body.orbit.kind === "circle" ? body.orbit.distance + body.radius * 4 : 0)));
    const phase = random() * 360;
    const periodFor = (distance: number, mass: number) => DAYS_PER_YEAR * Math.sqrt(auForRadius(scale, distance) ** 3 / mass);
    const others: SystemStar[] = [];
    let primary: StarOrbit | null = null;

    if (partners.length === 0) {
      return { primary, others };
    }

    const [first, second] = partners;
    const total = star.spec.mass + first.body.spec.mass;
    const periodDays = periodFor(apart, total);

    primary = { distance: (apart * first.body.spec.mass) / total, periodDays, longitudeAtEpoch: phase };
    others.push(this.systemStar(random, `star-${PARTNER_LETTERS[0]}`, first.body, {
      distance: (apart * star.spec.mass) / total, periodDays, longitudeAtEpoch: phase + 180,
    }));

    if (second) {
      const far = Math.min(FURTHEST, Math.max(outer * 1.8, outer + 40));

      others.push(this.systemStar(random, `star-${PARTNER_LETTERS[1]}`, second.body, {
        distance: far, periodDays: periodFor(far, total + second.body.spec.mass), longitudeAtEpoch: random() * 360,
      }));
    }

    return { primary, others };
  }

  private systemStar(random: RandomSource, id: string, body: StarBody, orbit: StarOrbit): SystemStar {
    return {
      id,
      x: 0,
      y: 0,
      radius: body.radius,
      mu: body.mu,
      surfaceGravity: body.surfaceGravity,
      temperatureK: body.spec.temperatureK,
      rotationDays: randomBetween(random, 2, 40),
      kmPerUnit: body.radiusKm / body.radius,
      luminosity: body.spec.luminosity,
      orbit,
    };
  }

  // How world distance maps to AU round a star. The star's real radius is where its surface is drawn; the square
  // root of the distance begins a little way out (ten of its radii, or nearer than its warm zone, whichever is
  // further: Mercury's 0.3 AU for the Sun), drawn a few of its own radii out. So its light falls on its worlds as it
  // really would: round a red dwarf its warm zone is a few hundredths of an AU out and its worlds crowd close; round
  // a supergiant it lies hundreds of AU out and the system is vast.
  private scaleFor(star: StarBody | null, luminosity: number): SystemScale {
    if (!star) {
      return { unitsPerRootAu: this.layout.unitsPerRootAu, innerAu: 0.3, starRadius: 0.5, starRadiusAu: 0.0023 };
    }

    const radiusAu = star.radiusKm / KM_PER_AU;
    const innerAu = Math.max(radiusAu * 10, 0.3 * Math.sqrt(luminosity));
    const inner = Math.max(star.radius * INNER_RADII, NEAREST);

    return { unitsPerRootAu: inner / Math.sqrt(innerAu), innerAu, starRadius: star.radius, starRadiusAu: radiusAu };
  }

  // Worlds out from the star, spread as real systems spread theirs, evenly in the logarithm of distance: round a
  // Sun-like star from inside Mercury's orbit (where hot Jupiters and lava worlds circle in days) out to Neptune's
  // and beyond; round a dwarf crowded close, as TRAPPIST-1's seven are. Each kind is decided by the temperature its
  // light holds it at and how rich the galaxy is in metals, and each keeps its moons. More metals, more worlds. A
  // void's worlds are rogues lit by nothing.
  private worlds(random: RandomSource, system: SystemPlan, made: Made): SystemBody[] {
    const { index, starKind, star, scale, metals, isVoid, luminosity, mass, host, clearance, furthest } = system;
    const count = isVoid ? 1 + Math.floor(random() * 3) : Math.max(1, Math.min(MOST_WORLDS, Math.round(randomBetween(random, 1.5, 8.5) * (0.55 + 0.45 * metals))));
    const isCompact = starKind === "red" || starKind === "brownDwarf";
    const bodies: SystemBody[] = [];
    // The innermost often lies well inside the inner zone, but never nearer the star's surface than `HUGGING` of its
    // radius; the outermost tens or hundreds of times further.
    const nearest = Math.max(this.nearestAu(scale), clearance > 0 ? auForRadius(scale, clearance) : 0);
    const first = Math.log(Math.max(nearest, scale.innerAu * 10 ** randomBetween(random, -1.3, 0.2)));
    const last = Math.log(Math.min(auForRadius(scale, furthest), scale.innerAu * (isCompact ? randomBetween(random, 2, 12) : randomBetween(random, 40, 180))));
    const step = count > 1 ? Math.max(0, last - first) / (count - 1) : 0;

    for (let order = 0; order < count; order += 1) {
      const au = Math.exp(first + step * (order + (order > 0 && order < count - 1 ? randomBetween(random, -0.3, 0.3) : 0)));
      const id = `u${index}-${order}`;
      const temperatureC = equilibriumC(luminosity, au);
      const kind = classFor(random, temperatureC, starKind, metals);
      const distance = radiusForAu(scale, au);
      const periodDays = star ? DAYS_PER_YEAR * Math.sqrt(au ** 3 / mass) : randomBetween(random, 400, 4000);
      const orbit: SystemOrbit = { kind: "circle", distance, periodDays, longitudeAtEpoch: random() * 360, ...(host ? { host } : {}) };
      const planet = this.world(random, { id, kind, temperatureC, au, orbit, parent: null, starKind, seed: index * 31 + order }, made);

      made.names[id] = `${made.base} ${LETTERS[order] ?? order + 2}`;
      bodies.push(planet.body, ...this.moons(random, planet, { starKind, metals, temperatureC, au, index }, made));
    }

    return bodies;
  }

  // The nearest a world can circle: just clear of the star's surface as it is drawn.
  private nearestAu(scale: SystemScale): number {
    return auForRadius(scale, scale.starRadius * HUGGING);
  }

  // One world of a kind: its size, pull and air from its kind, its days (none for a world locked with a face to its
  // star, or a moon to its planet), its pole, rings for some giants, and its look.
  private world(random: RandomSource, plan: WorldPlan, made: Made): MadeWorld {
    const { id, kind, temperatureC, au, orbit, parent, starKind, seed } = plan;
    const spec = WORLD_CLASSES[kind];
    const radiusEarths = radiusFor(random, kind, parent !== null);
    const gravity = gravityFor(random, kind, radiusEarths);
    const radiusKm = radiusEarths * EARTH_KM;
    const radius = this.layout.earthRadius * radiusEarths ** this.layout.radiusExponent;
    const air = airFor(random, spec.air, temperatureC);
    const isLocked = parent !== null || spec.isLocked === true;
    const body: SystemBody = {
      id,
      kind: parent ? "moon" : "planet",
      parent,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      real: { x: 0, y: 0, z: 0 },
      au,
      radius,
      mu: muForSurfaceGravity(gravity * this.layout.gravityScale, radius),
      isGiant: spec.isGiant,
      isLandable: !spec.isGiant,
      air: air ? airModel(air, radius) : null,
      surfaceGravity: gravity,
      dayC: air ? air.temperatureC : temperatureC + 60,
      nightC: air ? air.temperatureC : temperatureC - 120,
      kmPerUnit: radiusKm / radius,
      orbit,
      dayHours: isLocked ? null : (random() < 0.15 ? -1 : 1) * randomBetween(random, 8, 60),
      pole: poleVector({ ra: random() * 360, dec: randomBetween(random, 40, 90) }),
      rings: random() < spec.rings ? { inner: randomBetween(random, 1.25, 1.5), outer: randomBetween(random, 1.9, 2.6) } : null,
      subsolarLongitude: 0,
      subsolarLatitude: 0,
      isShattered: false,
    };

    made.looks[id] = lookFor(random, kind, air, body.rings, seed, starKind, temperatureC);
    made.classes[id] = kind;

    return { body, radiusKm, gravity, kind };
  }

  // A world's moons, as many as its kind keeps: each further out than the last by about the same ratio (Io, Europa,
  // Ganymede and Callisto lie at about 6, 9, 15 and 26 of Jupiter's radii), on the period Kepler's law gives for its
  // planet's mass, its kind from how warm that part of the system is.
  private moons(random: RandomSource, planet: MadeWorld, around: { starKind: StarKind | null; metals: number; temperatureC: number; au: number; index: number },
    made: Made): SystemBody[] {
    const [fewest, most] = WORLD_CLASSES[planet.kind].moons;
    const count = fewest + Math.floor(random() * (most - fewest + 1));
    const { body } = planet;
    // GM from the surface pull and radius (m^3/s^2).
    const pull = planet.gravity * (planet.radiusKm * 1000) ** 2;

    return Array.from({ length: count }, (_, order) => {
      const id = `${body.id}-${order}`;
      const kind = moonClassFor(random, around.temperatureC, around.starKind, around.metals, order, body.isGiant);
      const spread = MOON_SPREAD ** order * randomBetween(random, 0.95, 1.05);
      const distanceKm = planet.radiusKm * MOON_RADII * spread;
      const periodDays = (TAU * Math.sqrt((distanceKm * 1000) ** 3 / pull)) / 86400;
      const orbit: SystemOrbit = {
        kind: "moon",
        parent: body.id,
        distance: body.radius * MOON_GAP * spread,
        distanceKm,
        periodDays,
        longitudeAtEpoch: random() * 360,
      };
      const moon = this.world(random, { id, kind, temperatureC: around.temperatureC, au: around.au, orbit, parent: body.id, starKind: around.starKind,
        seed: around.index * 97 + order * 13 + body.id.length }, made);

      made.names[id] = `${made.names[body.id] ?? made.base} ${NUMERALS[order] ?? order + 1}`;

      return moon.body;
    });
  }

  private belt(random: RandomSource, bodies: SystemBody[], scale: SystemScale) {
    const distances = bodies.map((body) => (body.orbit.kind === "circle" ? body.orbit.distance : 0)).sort((first, second) => first - second);
    const after = pick(random, distances) ?? 10;
    const inner = after + 2.5;

    return { id: "belt", inner, outer: inner + randomBetween(random, 2.5, 5), density: randomBetween(random, 0.5, 1.2), isIcy: auForRadius(scale, inner) > 4 };
  }

  private faction(random: RandomSource, id: number, disposition: Disposition, danger: number, hue: number): FactionSpec {
    const shape = pick(random, SHAPES);
    const tint = hue + 120 + id * 70 + random() * 40;
    const isSwarm = shape === "swarm";

    return {
      id,
      name: factionName(random, this.names, disposition),
      disposition,
      shape,
      colours: [hslToHex(tint, 0.35, 0.42), hslToHex(tint + 30, 0.8, 0.6), hslToHex(tint + 10, 1, 0.68)],
      weapon: disposition === "hostile" && random() < 0.25 ? "missile" : SHAPE_WEAPONS[shape],
      level: Math.max(1, Math.round(danger * 2 + random() * 3)),
      pack: isSwarm ? 3 + Math.floor(random() * 4) : 1 + Math.floor(random() * 3),
      speed: randomBetween(random, 1.2, 2.3),
      aggroRadius: randomBetween(random, 4, 7),
      leashRadius: randomBetween(random, 13, 20),
      hull: Math.round((isSwarm ? 60 : 160) * danger * randomBetween(random, 0.8, 1.3)),
      shields: Math.round(random() < 0.5 ? 0 : 80 * danger),
    };
  }

  private phenomena(random: RandomSource, index: number, edge: number): PhenomenonSpec[] {
    const available = PHENOMENA.filter((phenomenon) => index >= phenomenon.from);
    const count = 1 + Math.floor(random() * Math.min(3, 1 + index / 2));
    const chosen = new Set<PhenomenonKind>();

    while (chosen.size < Math.min(count, available.length)) {
      chosen.add(weighted(random, available.map((phenomenon) => [phenomenon.kind, phenomenon.weight])));
    }

    return [...chosen].map((kind) => {
      const angle = random() * TAU;
      const out = randomBetween(random, edge * 0.35, edge * 0.85);
      const toAngle = angle + randomBetween(random, 1.5, 4);
      const toOut = randomBetween(random, edge * 0.35, edge * 0.9);

      return {
        kind,
        x: Math.cos(angle) * out,
        y: Math.sin(angle) * out,
        toX: Math.cos(toAngle) * toOut,
        toY: Math.sin(toAngle) * toOut,
        radius: kind === "nebula" ? randomBetween(random, 6, 12) : kind === "magnetar" ? randomBetween(random, 4, 7) : randomBetween(random, 0.3, 0.6),
        strength: randomBetween(random, 0.6, 1) * (1 + index * 0.1),
        seed: Math.floor(random() * 1e6),
      };
    });
  }
}
