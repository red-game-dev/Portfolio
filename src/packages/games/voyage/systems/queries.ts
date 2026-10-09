import { Body, Health, Ship } from "../domain/components";
import { VoyageContext } from "./context";

export interface ShipParts {
  body: Body;
  ship: Ship;
  health: Health;
}

// The player's ship, if it is still in the world.
export const shipOf = ({ world, state }: VoyageContext): ShipParts | null => {
  const body = world.stores.body.get(state.ship);
  const ship = world.stores.ship.get(state.ship);
  const health = world.stores.health.get(state.ship);

  return body && ship && health ? { body, ship, health } : null;
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

export const distanceFromOrigin = ({ state }: VoyageContext, body: Body): number => Math.hypot(body.x - state.route.origin.x, body.y - state.route.origin.y);

// Half the diagonal of the view, in world units: just past it, things are out of sight.
export const viewRadius = ({ state }: VoyageContext): number => Math.hypot(state.view.halfWidth, state.view.halfHeight);

// Takes everything but the ship out of the world, as a black hole does.
export const clearSpace = ({ world, state }: VoyageContext): void => {
  [world.stores.hazard, world.stores.pickup, world.stores.hole].forEach((store) => store.entities.forEach((entity) => world.despawn(entity)));
  state.capture = null;
};
