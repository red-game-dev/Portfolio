import { MODULE_IDS } from "../domain/components";
import { HOME_WORLD } from "../domain/content";
import { planLanding, startDescent } from "../landing";
import { landingWorldOf } from "../utils/landing";
import { auForRadius } from "../utils/scale";
import { VoyageContext } from "./context";
import { missionTime, placeBodies } from "./orbits";
import { bodyById, distanceFromStar, placeBody, ShipParts } from "./queries";

// A day, in ms.
export const DAY_MS = 86400000;

// Days in a year, for a transfer orbit's time.
const DAYS_PER_YEAR = 365.25;

// The ship made sound again: a full tank, a whole hull and shields, every system renewed and every fault gone, as a
// people's welcome or a new rocket on the pad leaves it.
export const restoreShip = ({ state }: VoyageContext, { ship, health, modules }: ShipParts): void => {
  ship.fuel = ship.maxFuel;
  health.hull = health.maxHull;
  health.shields = health.maxShields;
  MODULE_IDS.forEach((id) => {
    modules[id] = 1;
  });
  state.faults = [];
};

// How long a rescue takes to bring a crew home from this far from the Sun (AU), in whole days: half a Hohmann
// transfer orbit between there and Earth's, as Kepler's third law gives it (about 146 days from Venus, 259 from
// Mars), and never less than `fewest` (Apollo took three days to come home from the Moon).
export const transferDays = (au: number, fewest: number): number => Math.max(fewest, Math.round(0.5 * ((au + 1) / 2) ** 1.5 * DAYS_PER_YEAR));

// Stranded in our solar system, the crew is brought home: the mission clock moves on the days the rescue took, with
// every world placed where they took it, and the crew stands at the home pad beside a new rocket, as after any
// homecoming. Returns how many days it took, or null when there is no home to go to.
export const rescueHome = (context: VoyageContext, parts: ShipParts, fewestDays: number): number | null => {
  const { state } = context;
  const home = bodyById(context, HOME_WORLD);

  if (!home) {
    return null;
  }

  // From the world it stands on (a moon's planet), at that world's real distance; adrift, from where it is. From Earth,
  // the Moon or near Earth (where Earth pulls hardest) no transfer orbit is needed, only the fewest days.
  const ground = parts.ship.landedOn ? bodyById(context, parts.ship.landedOn) : undefined;
  const world = ground?.parent ? bodyById(context, ground.parent) : ground;
  const isNearHome = world ? world.id === HOME_WORLD : state.readings.dominant === HOME_WORLD;
  const au = world ? world.au : auForRadius(state.system.scale, distanceFromStar(context, parts.body));
  const days = isNearHome ? fewestDays : transferDays(au, fewestDays);

  state.clock = { ...state.clock, epochMs: state.clock.epochMs + days * DAY_MS };
  placeBodies(state.system, missionTime(state.clock, state.elapsedMs));

  // Set down where morning comes, a quarter of the way round from the Sun, so the pad is lit and its rocket, pointed
  // straight up, is not aimed at the Sun.
  const up = Math.atan2(state.system.star.y - home.y, state.system.star.x - home.x) + Math.PI / 2;
  const contact = home.radius + parts.body.radius;
  const offset = { x: Math.cos(up) * contact, y: Math.sin(up) * contact };
  const homeWorld = landingWorldOf(home, true);
  const plan = planLanding(homeWorld);
  const craft = startDescent(plan);

  Object.assign(craft, { altitude: 0, across: 0, up: 0, phase: "down", isDown: true });
  parts.ship.landedOn = home.id;
  parts.ship.landedOffset = offset;
  parts.ship.angle = up;
  parts.ship.prevAngle = up;
  placeBody(parts.body, home.x + offset.x, home.y + offset.y, home.vx, home.vy);
  state.descent = { body: home.id, world: homeWorld, plan, craft, speedUp: 1, pace: 1, downAt: state.elapsedMs, isSoft: true, isFiredOn: false };
  state.homecoming = { stage: "pad", since: state.elapsedMs, days, isSea: false, isArmed: false };
  restoreShip(context, parts);
  parts.health.decals = [];
  // A new rocket, standing at the temperature of the ground it stands on.
  parts.ship.temperatureC = home.air?.temperatureC ?? parts.ship.temperatureC;

  return days;
};
