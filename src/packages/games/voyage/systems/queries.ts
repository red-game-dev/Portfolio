import { Body, Health, Modules, Ship } from "../domain/components";
import { SystemBody } from "../domain/content";
import { VoyageContext } from "./context";

export interface ShipParts {
  body: Body;
  ship: Ship;
  health: Health;
  modules: Modules;
}

// The player's ship, if it is still in the world.
export const shipOf = ({ world, state }: VoyageContext): ShipParts | null => {
  const body = world.stores.body.get(state.ship);
  const ship = world.stores.ship.get(state.ship);
  const health = world.stores.health.get(state.ship);
  const modules = world.stores.modules.get(state.ship);

  return body && ship && health && modules ? { body, ship, health, modules } : null;
};

// Puts a body somewhere new at a new velocity, as a jump: nothing drawn between the old place and the new one.
export const placeBody = (body: Body, x: number, y: number, vx: number, vy: number): void => {
  body.x = x;
  body.y = y;
  body.prevX = x;
  body.prevY = y;
  body.vx = vx;
  body.vy = vy;
};

// How far something is from the star, in world units.
export const distanceFromStar = ({ state }: VoyageContext, body: Body): number => Math.hypot(body.x - state.system.star.x, body.y - state.system.star.y);

export const bodyById = ({ state }: VoyageContext, id: string): SystemBody | undefined => state.system.bodies.find((body) => body.id === id);

// Whether the ship is among worlds (ours or a universe's), where their bodies, air and the star are part of the
// world: everywhere but lost between universes.
export const isInSystem = ({ state }: VoyageContext): boolean => state.phase !== "lost";

// Whether the ship is in our own solar system.
export const isSolar = ({ state }: VoyageContext): boolean => state.phase === "solar" || state.phase === "singularity";

// Half the diagonal of the view, in world units: just past it, things are out of sight.
export const viewRadius = ({ state }: VoyageContext): number => Math.hypot(state.view.halfWidth, state.view.halfHeight);

// Takes everything but the ship out of the world, as a black hole does: rocks, pickups, holes, who lived there,
// shots in flight, rocks headed for worlds and passing ships.
export const clearSpace = ({ world, state }: VoyageContext): void => {
  [world.stores.hazard, world.stores.pickup, world.stores.hole, world.stores.alien, world.stores.projectile, world.stores.impactor, world.stores.traffic]
    .forEach((store) => store.entities.forEach((entity) => world.despawn(entity)));
  state.lockedTarget = null;
  state.capture = null;
  state.storms = [];
};
