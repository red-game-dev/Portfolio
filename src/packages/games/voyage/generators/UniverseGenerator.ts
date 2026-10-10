import { hslToHex } from "@/packages/graphics/colour";
import type { GlobeLook, SurfaceKind } from "@/packages/graphics/globe";
import { TAU } from "@/packages/math/angles";
import { createSeededRandom, pick, pickWeighted, RandomSource, randomBetween } from "@/packages/math/random";
import { poleVector } from "@/packages/physics/kepler";
import { muForSurfaceGravity } from "@/packages/physics/newtonian";

import { AirData, StarSystem, SystemBody, SystemScale } from "../domain/content";
import { VoyageStyle, DEEP_STYLES } from "../domain/theme";
import {
  Disposition,
  FactionSpec,
  HullShape,
  PhenomenonKind,
  PhenomenonSpec,
  StarKind,
  UniverseNames,
  UniverseSpec,
  WeaponKind,
} from "../domain/universe";
import { airModel } from "../mappers/air";
import { SystemLayout } from "../mappers/SystemMapper";
import { auForRadius } from "../utils/scale";
import { factionName, nameWord, universeName } from "./names";

// What each kind of star is: surface temperature (K), brightness against the Sun, world radius, the pull at its
// surface (world units, a dead star's far past any engine) and how restless its surface is.
const STARS: Record<StarKind, { temperatureK: number; luminosity: number; radius: number; pull: number; spots: number; corona: number }> = {
  red: { temperatureK: 3200, luminosity: 0.04, radius: 1.2, pull: 1, spots: 0.9, corona: 0.7 },
  orange: { temperatureK: 4500, luminosity: 0.35, radius: 1.6, pull: 1, spots: 0.6, corona: 0.75 },
  yellow: { temperatureK: 5800, luminosity: 1, radius: 2, pull: 1.1, spots: 0.5, corona: 0.85 },
  white: { temperatureK: 8500, luminosity: 6, radius: 2.3, pull: 1.2, spots: 0.2, corona: 0.9 },
  blue: { temperatureK: 18000, luminosity: 60, radius: 3.2, pull: 1.3, spots: 0.1, corona: 1 },
  giant: { temperatureK: 3600, luminosity: 400, radius: 5.5, pull: 0.6, spots: 1, corona: 0.6 },
  whiteDwarf: { temperatureK: 25000, luminosity: 0.02, radius: 0.25, pull: 4, spots: 0, corona: 0.4 },
  neutron: { temperatureK: 40000, luminosity: 0.001, radius: 0.08, pull: 30, spots: 0, corona: 0.25 },
};

const STAR_WEIGHTS: Array<[StarKind, number]> = [
  ["red", 30], ["orange", 20], ["yellow", 15], ["white", 10], ["blue", 8], ["giant", 7], ["whiteDwarf", 5], ["neutron", 5],
];

const SHAPE_WEAPONS: Record<HullShape, WeaponKind> = { saucer: "cannon", insect: "spit", crystal: "laser", organic: "spit", monolith: "laser", swarm: "cannon" };
const SHAPES: readonly HullShape[] = ["saucer", "insect", "crystal", "organic", "monolith", "swarm"];
const WARM_KINDS: readonly SurfaceKind[] = ["desert", "toxic", "volcanic", "haze"];
const COLD_KINDS: readonly SurfaceKind[] = ["rocky", "cratered", "icy"];

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

const ABSOLUTE_ZERO = -273.15;
const WARM_UP = 3;
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export interface UniverseTheme {
  name: string;
  style: VoyageStyle;
  accent: string;
  deep: string;
  hazard: string;
}

// One of `options`, as likely as its weight beside it.
const weighted = <T>(random: RandomSource, options: Array<[T, number]>): T => (pickWeighted(random, options, ([, weight]) => weight) ?? options[0])[0];

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
    const starKind: StarKind | null = isVoid ? null : weighted(random, STAR_WEIGHTS);
    const star = starKind ? STARS[starKind] : null;
    const starRadius = star?.radius ?? 0.5;
    const scale: SystemScale = { unitsPerRootAu: this.layout.unitsPerRootAu, innerAu: 0.3, starRadius, starRadiusAu: (0.0047 * starRadius) / 2 };
    const looks: Record<string, GlobeLook> = {};
    const bodies = this.worlds(random, index, star, scale, looks, isVoid);
    const base = nameWord(random, this.names);
    const names: Record<string, string> = Object.fromEntries([["star", base], ...bodies.map((body, order) => [body.id, `${base} ${NUMERALS[order] ?? order + 1}`])]);
    const edge = Math.max(30, ...bodies.map((body) => (body.orbit.kind === "circle" ? body.orbit.distance : 0))) + 14;
    const system: StarSystem = {
      star: {
        id: "star",
        x: 0,
        y: 0,
        radius: star?.radius ?? 0.5,
        mu: star ? muForSurfaceGravity(star.pull, star.radius) : 0,
        surfaceGravity: star ? star.pull / this.layout.gravityScale : 0,
        temperatureK: star?.temperatureK ?? 3,
        rotationDays: randomBetween(random, 2, 40),
        kmPerUnit: 695700 / 2.9,
        luminosity: star?.luminosity ?? 0,
      },
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
      starLook: star ? { temperatureK: star.temperatureK, granulation: starKind === "neutron" ? 0 : 1, spots: star.spots, corona: star.corona, seed: seed % 997 } : null,
      system,
      looks,
      names,
      factions,
      phenomena,
      danger,
    };
  }

  // Worlds out from the star, each kind decided by the temperature its light would hold it at.
  private worlds(random: RandomSource, index: number, star: (typeof STARS)[StarKind] | null, scale: SystemScale, looks: Record<string, GlobeLook>,
    isVoid: boolean): SystemBody[] {
    const count = isVoid ? 1 + Math.floor(random() * 2) : 2 + Math.floor(random() * 5);
    let distance = (star?.radius ?? 0.5) * 3 + randomBetween(random, 4, 7);

    return Array.from({ length: count }, (_, order) => {
      const id = `u${index}-${order}`;
      const au = auForRadius(scale, distance);
      const equilibriumC = star ? 278.6 * star.luminosity ** 0.25 / Math.sqrt(au) + ABSOLUTE_ZERO : -230;
      // A void's worlds are dark rocks drifting without a star: no giants, which would need air to be entered.
      const isGiant = !isVoid && equilibriumC < 30 && random() < 0.38;
      const kind = this.kindFor(random, equilibriumC, isGiant, isVoid);
      const radius = isGiant ? randomBetween(random, 0.65, 1.2) : randomBetween(random, 0.17, 0.45);
      const gravity = isGiant ? randomBetween(random, 9, 28) : 2 + (radius / 0.45) * randomBetween(random, 4, 12);
      const air = this.air(random, kind, equilibriumC);
      const body: SystemBody = {
        id,
        kind: "planet",
        parent: null,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        real: { x: 0, y: 0, z: 0 },
        au,
        radius,
        mu: muForSurfaceGravity(gravity * this.layout.gravityScale, radius),
        isGiant,
        isLandable: !isGiant,
        air: air ? airModel(air, radius) : null,
        surfaceGravity: gravity,
        dayC: air ? air.temperatureC : equilibriumC + 60,
        nightC: air ? air.temperatureC : equilibriumC - 120,
        kmPerUnit: randomBetween(random, 9000, 22000),
        orbit: { kind: "circle", distance, periodDays: randomBetween(random, 40, 900) * Math.sqrt(au), longitudeAtEpoch: random() * 360 },
        dayHours: (random() < 0.15 ? -1 : 1) * randomBetween(random, 8, 60),
        pole: poleVector({ ra: random() * 360, dec: randomBetween(random, 40, 90) }),
        rings: isGiant && random() < 0.45 ? { inner: randomBetween(random, 1.25, 1.5), outer: randomBetween(random, 1.9, 2.6) } : null,
        subsolarLongitude: 0,
        subsolarLatitude: 0,
        isShattered: false,
      };

      looks[id] = this.look(random, kind, air, body.rings, index * 31 + order);
      distance += randomBetween(random, 6, 11) + (isGiant ? 3 : 0);

      return body;
    });
  }

  private kindFor(random: RandomSource, equilibriumC: number, isGiant: boolean, isVoid: boolean): SurfaceKind {
    if (isVoid) {
      return "rogue";
    }

    if (isGiant) {
      return equilibriumC < -150 || random() < 0.3 ? "iceGiant" : "gas";
    }

    if (equilibriumC > 330) {
      return random() < 0.6 ? "lava" : "volcanic";
    }

    if (equilibriumC > 80) {
      return pick(random, WARM_KINDS);
    }

    if (equilibriumC > -40) {
      return random() < 0.7 ? "terran" : "desert";
    }

    if (equilibriumC > -150) {
      return pick(random, COLD_KINDS);
    }

    return random() < 0.6 ? "icy" : "cratered";
  }

  private air(random: RandomSource, kind: SurfaceKind, equilibriumC: number): AirData | null {
    switch (kind) {
      case "terran":
        return {
          kind: "thick", pressureBar: randomBetween(random, 0.5, 3), temperatureC: equilibriumC + randomBetween(random, 5, 30), topTemperatureC: equilibriumC - 70,
        };
      case "toxic":
      case "haze":
        return {
          kind: "thick", pressureBar: randomBetween(random, 8, 120), temperatureC: equilibriumC + randomBetween(random, 150, 400), topTemperatureC: equilibriumC - 50,
        };
      case "desert":
        return random() < 0.5 ? { kind: "thin", pressureBar: randomBetween(random, 0.005, 0.2), temperatureC: equilibriumC, topTemperatureC: equilibriumC - 60 } : null;
      case "gas":
      case "iceGiant":
        return { kind: "giant", pressureBar: 1, temperatureC: equilibriumC - 20, topTemperatureC: equilibriumC - 60 };
      case "lava":
        return { kind: "thin", pressureBar: randomBetween(random, 0.01, 0.1), temperatureC: equilibriumC + 300, topTemperatureC: equilibriumC };
      default:
        return null;
    }
  }

  // A world's colours, from a hue of its own but true to its kind: seas and land, sand, ice, cloud bands, lava
  // under crust, a rogue's near black.
  private look(random: RandomSource, kind: SurfaceKind, air: AirData | null, rings: SystemBody["rings"], seed: number): GlobeLook {
    const hue = random() * 360;
    const tone = (shift: number, saturation: number, lightness: number) => hslToHex(hue + shift, saturation, lightness);
    const palettes: Record<SurfaceKind, [string, string, string, string]> = {
      terran: [tone(200 - hue % 40, 0.7, 0.18), tone(205 - hue % 40, 0.65, 0.38), tone(110 + (hue % 60), 0.4, 0.32), tone(40, 0.3, 0.62)],
      desert: [tone(0, 0.55, 0.22), tone(10, 0.55, 0.38), tone(20, 0.5, 0.55), tone(30, 0.4, 0.72)],
      toxic: [tone(0, 0.6, 0.2), tone(20, 0.7, 0.38), tone(40, 0.7, 0.55), tone(60, 0.6, 0.72)],
      haze: [tone(0, 0.4, 0.3), tone(10, 0.45, 0.48), tone(20, 0.45, 0.64), tone(30, 0.35, 0.8)],
      volcanic: [tone(0, 0.5, 0.12), tone(40, 0.7, 0.45), tone(50, 0.7, 0.62), "#ff7a2a"],
      lava: ["#1a0f0c", "#3a1c12", "#6a2a14", "#ff6a1a"],
      rocky: [tone(0, 0.12, 0.22), tone(0, 0.12, 0.38), tone(0, 0.1, 0.55), tone(0, 0.08, 0.72)],
      cratered: [tone(0, 0.08, 0.2), tone(0, 0.08, 0.36), tone(0, 0.07, 0.52), tone(0, 0.06, 0.72)],
      icy: [tone(0, 0.35, 0.35), tone(0, 0.25, 0.7), tone(0, 0.15, 0.85), "#f6f8fa"],
      gas: [tone(0, 0.45, 0.28), tone(15, 0.5, 0.48), tone(30, 0.45, 0.68), tone(45, 0.35, 0.86)],
      iceGiant: [tone(0, 0.5, 0.3), tone(5, 0.55, 0.48), tone(10, 0.5, 0.62), tone(15, 0.4, 0.82)],
      rogue: ["#05070a", "#0d1218", "#1a222c", "#2e3a48"],
    };
    const look: GlobeLook = {
      surface: {
        kind,
        palette: palettes[kind],
        seed,
        sea: randomBetween(random, 0.45, 0.72),
        bands: random(),
        turbulence: random(),
        caps: kind === "terran" ? randomBetween(random, 0.05, 0.25) : 0,
        glint: kind === "terran",
      },
    };

    if (air && air.kind !== "thin") {
      look.atmosphere = {
        colour: tone(kind === "terran" ? 210 - hue : 20, 0.6, 0.65),
        thickness: air.kind === "giant" ? 0.03 : 0.07,
        density: Math.min(1, 0.4 + air.pressureBar / 30),
        sunset: tone(180, 0.7, 0.55),
      };
    }

    if (kind === "terran") {
      look.clouds = randomBetween(random, 0.3, 0.75);
      look.cloudDrift = randomBetween(random, 0.002, 0.008);
    }

    if (rings) {
      look.rings = { inner: rings.inner, outer: rings.outer, colour: tone(30, 0.25, 0.7), opacity: randomBetween(random, 0.35, 0.8), seed };
    }

    return look;
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
