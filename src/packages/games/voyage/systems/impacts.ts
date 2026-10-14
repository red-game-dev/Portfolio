import type { Entity } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { SystemBody } from "../domain/content";
import { ImpactOutcome } from "../domain/events";
import { VoyageContext } from "./context";

const G = 6.674e-11;
const ROCK_DENSITY = 2600;
// Rocks smaller than this (km) burst high in thick air instead of reaching the ground.
const AIRBURST_KM = 0.12;
// The game mass of a rock per cubic world unit of radius, and the push a shot gives per point of damage.
const MASS_PER_VOLUME = 400;
const IMPULSE_PER_DAMAGE = 0.004;
// The most scars one world keeps.
const MAX_CRATERS = 8;

// The kinetic energy (J) of a rock `diameterKm` across arriving at `speedKmS`.
export const impactEnergy = (diameterKm: number, speedKmS: number): number => {
  const radius = (diameterKm * 1000) / 2;
  const mass = ROCK_DENSITY * (4 / 3) * Math.PI * radius ** 3;

  return 0.5 * mass * (speedKmS * 1000) ** 2;
};

// What holds a world together (J): its gravitational binding energy, 3/5 G M^2 / R, with the mass from its
// surface gravity, M = g R^2 / G.
export const bindingEnergy = (gravity: number, radiusKm: number): number => (0.6 * gravity * gravity * (radiusKm * 1000) ** 3) / G;

// The final crater (km) a rock leaves, from Collins, Melosh and Marcus's scaling of the transient crater
// (1.161 L^0.78 v^0.44 g^-0.22 in SI units, equal densities), a quarter wider once it has slumped.
export const craterKm = (diameterKm: number, speedKmS: number, gravity: number): number => (
  1.25 * 1.161 * (diameterKm * 1000) ** 0.78 * (speedKmS * 1000) ** 0.44 * gravity ** -0.22
) / 1000;

// What an impact does: break the world if it carries more than what holds the world together, melt and scar a
// hemisphere if a hundredth of that, burst in the air if small and the air is thick, else leave a crater.
export const impactOutcome = (ratio: number, diameterKm: number, hasThickAir: boolean): ImpactOutcome => {
  if (ratio >= 1) {
    return "shattered";
  }

  if (ratio >= 0.01) {
    return "catastrophe";
  }

  return hasThickAir && diameterKm < AIRBURST_KM ? "airburst" : "crater";
};

// A rock's game mass, from its radius.
export const impactorMass = (radius: number): number => radius ** 3 * MASS_PER_VOLUME;

// The speed a rock truly arrives at (km/s): its approach, and the world's own escape speed it falls through.
export const arrivalSpeed = (approachKmS: number, body: SystemBody): number => {
  const escape = Math.sqrt(2 * body.surfaceGravity * body.radius * body.kmPerUnit * 1000) / 1000;

  return Math.hypot(approachKmS, escape);
};

// How long ahead (seconds) a rock's course is followed, and the step it is followed in.
const COURSE_SECONDS = 30;
const COURSE_STEP = 0.08;

export interface Approach {
  dx: number;
  dy: number;
  distance: number;
}

// How a body moves over a rock's flight: round the centre it circles (a moon's planet, a made world's star) at its rate
// on the mission clock, the centre carried on in a line; a planet on its elements carried on in a line, as it nearly
// is over a few seconds. With the clock running fast a moon goes round in seconds, so a line would miss it.
interface Track {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  rate: number;
}

// Reused, so following a course allocates nothing.
const TRACK: Track = { x: 0, y: 0, vx: 0, vy: 0, radius: 0, angle: 0, rate: 0 };
const AHEAD = { x: 0, y: 0 };

const ORIGIN = { x: 0, y: 0 };

// What a body circles: a moon its planet, a made world its star (or the system's centre), a planet on its elements
// nothing.
const centreOf = ({ state }: VoyageContext, body: SystemBody): { x: number; y: number; vx?: number; vy?: number } | undefined => {
  const { orbit } = body;
  const { star, companions, bodies } = state.system;

  if (orbit.kind === "moon") {
    return bodies.find((other) => other.id === orbit.parent);
  }

  if (orbit.kind === "circle") {
    return !orbit.host ? ORIGIN : star.id === orbit.host ? star : companions.find((other) => other.id === orbit.host);
  }

  return undefined;
};

const trackOf = (context: VoyageContext, body: SystemBody): Track => {
  const { orbit } = body;
  const centre = centreOf(context, body);

  if (orbit.kind === "sun" || !centre) {
    TRACK.x = body.x;
    TRACK.y = body.y;
    TRACK.vx = body.vx;
    TRACK.vy = body.vy;
    TRACK.radius = 0;
    TRACK.angle = 0;
    TRACK.rate = 0;

    return TRACK;
  }

  // Screen y runs down, so a circle's angle is read with y turned over, as `placeBodies` places it.
  TRACK.x = centre.x;
  TRACK.y = centre.y;
  TRACK.vx = centre.vx ?? 0;
  TRACK.vy = centre.vy ?? 0;
  TRACK.radius = Math.hypot(body.x - centre.x, body.y - centre.y);
  TRACK.angle = Math.atan2(-(body.y - centre.y), body.x - centre.x);
  TRACK.rate = (TAU / orbit.periodDays) * (context.state.clock.hoursPerSecond / 24);

  return TRACK;
};

// Where a body on its track is `time` seconds on.
const aheadOn = (track: Track, time: number): { x: number; y: number } => {
  const angle = track.angle + track.rate * time;

  AHEAD.x = track.x + track.vx * time + Math.cos(angle) * track.radius;
  AHEAD.y = track.y + track.vy * time - Math.sin(angle) * track.radius;

  return AHEAD;
};

// Where a body will be `seconds` from now: round its planet or star for a moon or a made world, else in a line.
export const bodyAhead = (context: VoyageContext, body: SystemBody, seconds: number): { x: number; y: number } => {
  const at = aheadOn(trackOf(context, body), seconds);

  return { x: at.x, y: at.y };
};

// Where a rock will pass nearest its target: its path followed through the same gravity the world moves it by
// (every body and star pulling, its target included), the target moving on as it does (round its planet, for a
// moon), until the rock arrives, or has clearly passed. The offset from the target's centre at that moment, and how
// far.
export const predictApproach = (context: VoyageContext, rock: { x: number; y: number; vx: number; vy: number }, body: SystemBody): Approach => {
  const { field, sample } = context;
  const track = trackOf(context, body);
  let { x, y, vx, vy } = rock;
  let best: Approach = { dx: x - body.x, dy: y - body.y, distance: Math.hypot(x - body.x, y - body.y) };

  for (let time = COURSE_STEP; time <= COURSE_SECONDS; time += COURSE_STEP) {
    field.sample(x, y, sample);
    vx += sample.ax * COURSE_STEP;
    vy += sample.ay * COURSE_STEP;
    x += vx * COURSE_STEP;
    y += vy * COURSE_STEP;

    const target = aheadOn(track, time);
    const dx = x - target.x;
    const dy = y - target.y;
    const distance = Math.hypot(dx, dy);

    if (distance < best.distance) {
      best = { dx, dy, distance };
    } else if (distance > best.distance + body.radius * 4) {
      break;
    }

    if (distance < body.radius) {
      break;
    }
  }

  return best;
};

// Whether a rock is on course for its target.
export const isOnCourseNow = (context: VoyageContext, rock: { x: number; y: number; vx: number; vy: number }, body: SystemBody): boolean => (
  predictApproach(context, rock, body).distance < body.radius * 1.02
);

// A shot strikes a rock headed for a world: it loses strength, and the shot's momentum pushes it, a small rock
// far more than a planetoid. Pushed off course, it will miss; at no strength left, it breaks apart.
export const damageImpactor = (context: VoyageContext, entity: Entity, damage: number, shotVx: number, shotVy: number): void => {
  const { world, state, events } = context;
  const rock = world.stores.body.get(entity);
  const impactor = world.stores.impactor.get(entity);
  const target = impactor ? state.system.bodies.find((body) => body.id === impactor.target) : undefined;

  if (!rock || !impactor) {
    return;
  }

  const speed = Math.hypot(shotVx, shotVy) || 1;
  const push = (damage * IMPULSE_PER_DAMAGE) / impactorMass(rock.radius);

  impactor.hp -= damage;
  rock.vx += (shotVx / speed) * push;
  rock.vy += (shotVy / speed) * push;

  if (target && impactor.isOnCourse && !isOnCourseNow(context, rock, target)) {
    impactor.isOnCourse = false;
    events.emit("deflected", { rock: entity, target: impactor.target, isFragment: impactor.isFragment });
  }

  if (impactor.hp <= 0) {
    breakUp(context, entity);
  }
};

// A rock broken apart: its pieces fly on with its momentum, spread apart, smaller and weaker; some may still hit.
export const breakUp = (context: VoyageContext, entity: Entity): void => {
  const { world, state, events, random, config } = context;
  const rock = world.stores.body.get(entity);
  const impactor = world.stores.impactor.get(entity);

  if (!rock || !impactor) {
    return;
  }

  const target = state.system.bodies.find((body) => body.id === impactor.target);
  const pieces = impactor.isFragment ? 0 : 3 + Math.floor(random() * 3);
  const share = pieces > 0 ? pieces ** (-1 / 3) : 0;

  for (let index = 0; index < pieces; index += 1) {
    const angle = (index / pieces) * TAU + random();
    const spread = randomBetween(random, 0.25, 0.55);
    const piece = world.spawn();
    const x = rock.x + Math.cos(angle) * rock.radius * 0.5;
    const y = rock.y + Math.sin(angle) * rock.radius * 0.5;
    const radius = rock.radius * share;

    const vx = rock.vx + Math.cos(angle) * spread;
    const vy = rock.vy + Math.sin(angle) * spread;

    world.stores.body.set(piece, { x, y, vx, vy, prevX: x, prevY: y, radius, mass: impactorMass(radius) });
    world.stores.spin.set(piece, { angle: random() * TAU, rate: randomBetween(random, -2, 2) });
    world.stores.impactor.set(piece, {
      target: impactor.target,
      hp: impactor.maxHp * 0.15,
      maxHp: impactor.maxHp * 0.15,
      diameterKm: impactor.diameterKm * share * 0.85,
      isFragment: true,
      isOnCourse: target ? isOnCourseNow(context, { x, y, vx, vy }, target) : false,
    });
  }

  state.score += config.scoring.discovery * 2;
  events.emit("impactorBroken", { rock: entity, x: rock.x, y: rock.y, target: impactor.target, isFragment: impactor.isFragment });
  world.despawn(entity);
};

// A scar on a world, merging into the smallest old one once the world has as many as it can show.
export const addCrater = (context: VoyageContext, target: string, crater: { longitude: number; latitude: number; size: number; heat: number }): void => {
  const { state } = context;
  const scars = state.craters[target] ?? [];

  if (scars.length >= MAX_CRATERS) {
    scars.sort((first, second) => first.size - second.size).shift();
  }

  scars.push(crater);
  state.craters[target] = scars;
};
