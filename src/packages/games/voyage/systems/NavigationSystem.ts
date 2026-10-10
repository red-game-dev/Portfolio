import type { System } from "@/packages/games/engine";

import { Waypoint } from "../domain/state";
import { auForRadius } from "../utils/scale";
import { VoyageContext } from "./context";
import { nextHop } from "./gates";
import { distanceFromStar, isInSystem, isSolar, shipOf } from "./queries";

// How close to a body counts as visiting it, in its own radii, plus a margin.
const PASS_RADII = 5;
const PASS_MARGIN = 0.5;
// The star counts as visited this many of its radii out: close enough to feel it.
const STAR_RADII = 2.2;
// How far ahead of the ship the singularity wakes, past the edge.
const SINGULARITY_AHEAD = 9;
// Past this distance from the Sun (AU, beyond Saturn) the compass only leads outward, to worlds no closer in than
// this share of the ship's own distance, then to the edge.
const OUTBOUND_AU = 10;
const AHEAD_SHARE = 0.9;

// Knows where the ship is in the system: marks each body and belt it reaches (and scores the discovery), wakes
// the singularity ahead of the ship once it crosses the edge of the system, and points the compass at the
// nearest place it has not been (past Saturn, only those further out), then out to the edge, where the black hole
// waits.
export class NavigationSystem implements System<VoyageContext> {
  public readonly name = "navigation";

  public update(context: VoyageContext): void {
    const { state, world, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying") {
      return;
    }

    const { body } = parts;

    if (isInSystem(context)) {
      const { system } = state;
      const solar = isSolar(context);
      const out = distanceFromStar(context, body);

      // The nearest the ship has come to our Sun this run (AU), measured every step so no fast pass is missed.
      if (solar) {
        state.closestAu = Math.min(state.closestAu, auForRadius(system.scale, Math.max(out, system.star.radius)));
      }

      system.bodies.forEach((place) => {
        if (!place.isShattered && !state.passed.has(place.id) && Math.hypot(place.x - body.x, place.y - body.y) < place.radius * PASS_RADII + PASS_MARGIN) {
          this.pass(context, place.id);
        }
      });

      if (solar && !state.passed.has(system.star.id) && out < system.star.radius * STAR_RADII) {
        this.pass(context, system.star.id);
      }

      system.belts.forEach((belt) => {
        if (!state.passed.has(belt.id) && out >= belt.inner && out <= belt.outer) {
          this.pass(context, belt.id);
        }
      });

      if (solar && out > system.edge && state.singularitySince === null) {
        const speed = Math.hypot(body.vx, body.vy);
        // Ahead of the ship if it is moving, otherwise straight out from the star.
        const dx = speed > 0.2 ? body.vx / speed : (body.x - system.star.x) / out;
        const dy = speed > 0.2 ? body.vy / speed : (body.y - system.star.y) / out;
        const x = body.x + dx * SINGULARITY_AHEAD;
        const y = body.y + dy * SINGULARITY_AHEAD;
        const hole = world.spawn();

        world.stores.body.set(hole, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: config.holes.singularityHorizon, mass: 0 });
        world.stores.hole.set(hole, { mu: config.holes.singularityMu, horizon: config.holes.singularityHorizon, isSingularity: true });
        state.singularitySince = state.elapsedMs;
        state.phase = "singularity";
        state.phaseMs = 0;
        events.emit("phase", { phase: "singularity", universe: state.universe });
      }
    }

    state.waypoint = this.waypoint(context, body.x, body.y);
  }

  private pass(context: VoyageContext, id: string): void {
    const { state, config, events } = context;

    state.passed.add(id);
    state.passing = id;
    state.score += config.scoring.discovery;
    events.emit("passing", { stop: id });
  }

  // In the system: the singularity once it wakes, else the nearest planet, dwarf planet or the star not yet
  // visited, else the edge straight out. In a universe, the nearest black hole.
  private waypoint(context: VoyageContext, x: number, y: number): Waypoint | null {
    const { state, world, config } = context;

    if (state.phase === "lost") {
      return null;
    }

    const candidates: Waypoint[] = [];

    world.stores.hole.entities.forEach((entity, index) => {
      const hole = world.stores.body.get(entity);
      const { isSingularity } = world.stores.hole.values[index];

      if (hole && (state.phase === "universe" || isSingularity)) {
        candidates.push({ id: isSingularity ? "singularity" : "hole", x: hole.x, y: hole.y, radius: isSingularity ? config.holes.singularityHorizon : hole.radius });
      }
    });

    // In a universe, its worlds not yet seen are as much a way to go as its black holes; in a maze, so is the gate
    // that leads, through what is known of it, towards somewhere new or the system with the way on.
    if (state.phase === "universe") {
      state.system.bodies.forEach((body) => {
        if (!body.isShattered && !state.passed.has(body.id)) {
          candidates.push({ id: body.id, x: body.x, y: body.y, radius: body.radius });
        }
      });

      const hop = state.network && state.node !== state.network.exit ? nextHop(state.network, state.explored, state.node) : null;

      world.stores.gate.entities.forEach((entity, index) => {
        const gate = world.stores.body.get(entity);
        const { to } = world.stores.gate.values[index];

        if (gate && to === hop) {
          candidates.push({ id: `gate-${to}`, x: gate.x, y: gate.y, radius: gate.radius });
        }
      });
    }

    if (candidates.length === 0 && state.phase !== "universe") {
      const { system } = state;
      const out = Math.hypot(x - system.star.x, y - system.star.y);
      // Past Saturn the way leads outward: worlds left behind closer in no longer turn the compass back.
      const isOutbound = auForRadius(system.scale, out) > OUTBOUND_AU;
      // Ahead means further out than the ship and on its side of the Sun, never across the system behind it.
      const isAhead = (body: { x: number; y: number }) => !isOutbound || (Math.hypot(body.x - system.star.x, body.y - system.star.y) > out * AHEAD_SHARE &&
        (body.x - system.star.x) * (x - system.star.x) + (body.y - system.star.y) * (y - system.star.y) > 0);

      system.bodies.forEach((body) => {
        if (body.kind !== "moon" && !state.passed.has(body.id) && isAhead(body)) {
          candidates.push({ id: body.id, x: body.x, y: body.y, radius: body.radius });
        }
      });

      if (!state.passed.has(system.star.id) && !isOutbound) {
        candidates.push({ id: system.star.id, x: system.star.x, y: system.star.y, radius: system.star.radius });
      }

      if (candidates.length === 0) {
        const away = out || 1;

        return {
          id: "edge",
          x: system.star.x + ((x - system.star.x) / away) * system.edge,
          y: system.star.y + ((y - system.star.y) / away) * system.edge,
          radius: 0,
        };
      }
    }

    return candidates.reduce<Waypoint | null>((best, candidate) => (
      !best || Math.hypot(candidate.x - x, candidate.y - y) < Math.hypot(best.x - x, best.y - y) ? candidate : best
    ), null);
  }
}
