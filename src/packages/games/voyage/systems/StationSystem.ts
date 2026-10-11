import { hashText } from "@/packages/encoding/hash";
import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";

import { Body } from "../domain/components";
import { VoyageState } from "../domain/state";
import { DOCKING, HOME_PORTS, PORT_ORBIT } from "../stations/config/market";
import { Port, Station } from "../stations/domain/station";
import { VoyageContext } from "./context";
import { bodyById, shipOf } from "./queries";

// Which system the ship is in, so each has ports of its own: home, or a universe's system by its place in a maze.
export const systemKey = (state: Readonly<VoyageState>): string =>
  (state.phase === "solar" || state.phase === "singularity" ? "solar" : `${state.universe}:${state.node}`);

// A station keeping its orbit round a world, set where its seed puts it on that orbit.
const station = (context: VoyageContext, anchor: string, seed: number, faction: number): Station | null => {
  const body = bodyById(context, anchor);

  if (!body || body.isShattered) {
    return null;
  }

  const placed: Station = {
    id: `station:${anchor}`,
    anchor,
    angle: ((seed % 3600) / 3600) * TAU,
    distance: body.radius * PORT_ORBIT.radii + PORT_ORBIT.margin,
    rate: PORT_ORBIT.rate,
    x: body.x,
    y: body.y,
    vx: body.vx,
    vy: body.vy,
    radius: PORT_ORBIT.radius,
    seed,
    faction,
  };

  moveStation(context, placed, 0);

  return placed;
};

// Each station goes round its world, carried along as its world moves.
const moveStation = (context: VoyageContext, port: Station, dt: number): void => {
  const body = bodyById(context, port.anchor);

  if (!body) {
    return;
  }

  port.angle = (port.angle + port.rate * dt) % TAU;

  const cos = Math.cos(port.angle);
  const sin = Math.sin(port.angle);

  port.x = body.x + cos * port.distance;
  port.y = body.y + sin * port.distance;
  port.vx = body.vx - sin * port.distance * port.rate;
  port.vy = body.vy + cos * port.distance * port.rate;
};

// The ports of a system: at home, round Earth, Mars, Jupiter and Saturn; in a universe's system, one round a world its
// seed picks, kept by the people who live there if they welcome strangers, else a free port.
const placeStations = (context: VoyageContext, key: string): Station[] => {
  const { state } = context;
  const seed = hashText(`${state.runSeed}:${key}`);
  const placed = key === "solar"
    ? HOME_PORTS.map((anchor, index) => station(context, anchor, seed + index * 7919, -1))
    : [universePort(context, seed)];

  return placed.filter((port): port is Station => port !== null);
};

const universePort = (context: VoyageContext, seed: number): Station | null => {
  const { cosmos, system } = context.state;
  const worlds = system.bodies.filter((body) => body.kind === "planet" && !body.isShattered);

  if (!cosmos || worlds.length === 0) {
    return null;
  }

  const welcoming = worlds.filter((body) => {
    const disposition = cosmos.factions[cosmos.inhabitants[body.id] ?? -1]?.disposition;

    return disposition === "peaceful" || disposition === "neutral";
  });
  const pool = welcoming.length > 0 ? welcoming : worlds;
  const anchor = pool[seed % pool.length];

  return station(context, anchor.id, seed, welcoming.length > 0 ? cosmos.inhabitants[anchor.id] ?? -1 : -1);
};

// Whether the ship is close to something and slow against it, as docking needs.
const isAlongside = (ship: Body, other: { x: number; y: number; vx: number; vy: number }, radius: number): boolean =>
  Math.hypot(ship.x - other.x, ship.y - other.y) < radius + ship.radius + DOCKING.reach && Math.hypot(ship.vx - other.vx, ship.vy - other.vy) < DOCKING.speed;

// Ports: each system has its stations (see `placeStations`), which go round their worlds every step. The station or
// peaceful trader the ship is alongside, slowly enough, is offered to dock at (the same offer kept while it holds, so
// nothing is made every step); docking itself is the pilot's to ask for.
export class StationSystem implements System<VoyageContext> {
  public readonly name = "stations";

  public update(context: VoyageContext, dt: number): void {
    const { state } = context;

    if (state.phase === "lost") {
      state.stations = [];
      state.stationsOf = null;
      state.dockable = null;

      return;
    }

    const key = systemKey(state);

    if (state.stationsOf !== key) {
      state.stations = placeStations(context, key);
      state.stationsOf = key;
    }

    for (const port of state.stations) {
      moveStation(context, port, dt);
    }

    state.dockable = this.alongside(context);
  }

  private alongside(context: VoyageContext): Port | null {
    const { state, world } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.capture || state.descent || state.homecoming || parts.ship.landedOn ||
      state.elapsedMs < state.undockedAt + DOCKING.again * 1000) {
      return null;
    }

    const { body } = parts;
    const depth = state.phase === "universe" ? state.universe : -1;
    const kept = (id: string, make: () => Port): Port => (state.dockable?.id === id ? state.dockable : make());

    for (const port of state.stations) {
      if (isAlongside(body, port, port.radius)) {
        return kept(port.id, () => ({ kind: "station", id: port.id, anchor: port.anchor, faction: port.faction, seed: port.seed, depth }));
      }
    }

    const { entities, values } = world.stores.alien;

    for (let index = 0; index < entities.length; index += 1) {
      const alien = values[index];
      const at = alien.role === "trader" && alien.mode !== "flee" ? world.stores.body.get(entities[index]) : undefined;

      if (at && isAlongside(body, at, at.radius)) {
        const id = `trader:${entities[index]}`;

        return kept(id, () => ({ kind: "trader", id, anchor: null, faction: alien.faction, seed: hashText(`${state.runSeed}:${id}`), depth }));
      }
    }

    return null;
  }
}
