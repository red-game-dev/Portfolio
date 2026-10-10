import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { enterSystem, GATE_RADIUS, gatePosition } from "./gates";
import { placeBody, shipOf } from "./queries";

// Through a gate the ship comes out this many gate radii inside the one leading back, towards the system's centre.
const COME_OUT = 3;

// Gates in a maze universe: flying into one carries the ship to the system it leads to, as that system was left if
// it has been to it before, coming out just inside the gate that leads back. The first visit to a system counts
// as a discovery.
export class GateSystem implements System<VoyageContext> {
  public readonly name = "gates";

  public update(context: VoyageContext): void {
    const { state, world } = context;
    const parts = shipOf(context);

    if (!parts || !state.network || !state.cosmos || state.status !== "flying" || state.capture || parts.ship.landedOn || world.stores.gate.size === 0) {
      return;
    }

    const { body } = parts;
    let to: number | null = null;

    world.stores.gate.entities.forEach((entity, index) => {
      const gate = world.stores.body.get(entity);

      if (to === null && gate && Math.hypot(gate.x - body.x, gate.y - body.y) < gate.radius + body.radius) {
        to = world.stores.gate.values[index].to;
      }
    });

    if (to !== null) {
      this.through(context, to);
    }
  }

  private through(context: VoyageContext, to: number): void {
    const { state, events, universes, themes, config } = context;
    const parts = shipOf(context);
    const { cosmos, network } = state;

    if (!parts || !cosmos || !network) {
      return;
    }

    const from = state.node;
    const spec = state.nodes.get(to) ?? universes.generate(cosmos.index, cosmos.seed, themes[cosmos.index] ?? null, to);
    const isNew = !state.explored.has(to);

    state.nodes.set(from, cosmos);
    state.nodes.set(to, spec);
    state.explored.add(to);
    enterSystem(context, spec);

    const back = gatePosition(spec, to, from);
    const out = Math.hypot(back.x, back.y) || 1;
    const inside = Math.max(0, out - GATE_RADIUS * COME_OUT) / out;

    placeBody(parts.body, back.x * inside, back.y * inside, 0, 0);
    parts.ship.angle = Math.atan2(-back.y, -back.x);
    parts.ship.prevAngle = parts.ship.angle;

    if (isNew) {
      state.score += config.scoring.discovery;
    }

    events.emit("gate", { to, name: network.nodes[to].name, isNew, isExit: to === network.exit, isDeadEnd: network.nodes[to].links.length === 1 });
  }
}
