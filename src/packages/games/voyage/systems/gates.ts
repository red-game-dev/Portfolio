import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { UniverseNetwork, UniverseSpec } from "../domain/universe";
import { VoyageContext } from "./context";
import { missionTime, placeBodies } from "./orbits";
import { clearSpace } from "./queries";

// How large a gate's mouth is (world units), and how far out towards the system's edge gates stand.
export const GATE_RADIUS = 0.9;
const GATE_SHARE = 0.78;

// Where the gate from one system to another stands in the first, the same each time: a direction of its own for
// each pair of systems, opposite ways round in each of the two, out towards the edge.
export const gatePosition = (spec: UniverseSpec, from: number, to: number): { x: number; y: number } => {
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  const angle = ((low * 137.508 + high * 59.31 + (spec.seed % 360)) / 180) * Math.PI + (from < to ? 0 : Math.PI);
  const out = spec.system.edge * GATE_SHARE;

  return { x: Math.cos(angle) * out, y: Math.sin(angle) * out };
};

// The first step towards somewhere new: through what is known of the web (the links of systems already been to),
// the nearest system not yet reached, or the one with the way on. Null when there is nowhere left to go.
export const nextHop = (network: UniverseNetwork, explored: ReadonlySet<number>, from: number): number | null => {
  const first = new Map<number, number>();
  const queue: number[] = [];

  network.nodes[from].links.forEach((next) => {
    if (!first.has(next)) {
      first.set(next, next);
      queue.push(next);
    }
  });

  while (queue.length > 0) {
    const node = queue.shift() ?? from;

    if (!explored.has(node) || node === network.exit) {
      return first.get(node) ?? null;
    }

    network.nodes[node].links.forEach((next) => {
      if (next !== from && !first.has(next)) {
        first.set(next, first.get(node) ?? next);
        queue.push(next);
      }
    });
  }

  return null;
};

// Into a star system of a universe: its worlds set on their orbits for the moment it is, the last system's ships,
// rocks, holes and gates gone, its strange things wound up, and its own gates open.
export const enterSystem = (context: VoyageContext, spec: UniverseSpec): void => {
  const { state, random, world } = context;
  const supernova = spec.phenomena.some((phenomenon) => phenomenon.kind === "supernova");

  placeBodies(spec.system, missionTime(state.clock, state.elapsedMs));
  clearSpace(context);
  state.cosmos = spec;
  state.system = spec.system;
  state.node = spec.node;
  state.passing = null;
  state.craters = {};
  state.boss = null;
  state.signature = 0;
  state.phenomena = {
    supernova: supernova ? { blowsAt: state.elapsedMs + randomBetween(random, 35, 70) * 1000, shock: 0, hasHit: false, isWarned: false } : null,
    burst: null,
    nextBurstAt: null,
    pulsarAngle: random() * TAU,
    strikeAt: null,
    jumpedAt: -1e9,
  };

  spec.network?.nodes[spec.node].links.forEach((to) => {
    const { x, y } = gatePosition(spec, spec.node, to);
    const gate = world.spawn();

    world.stores.body.set(gate, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: GATE_RADIUS, mass: 0 });
    world.stores.gate.set(gate, { to });
  });
};
