import type { Entity, System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { shipOf } from "./queries";

// Progress falls back this much faster than it builds when the ship drifts off or speeds away.
const DECAY = 0.5;

// Salvage takes patience: bring the ship alongside a wreck, match its speed and hold off the engines, and its
// cargo is cut free bit by bit; drift away, burn hard or let it tumble off and the work slips back. Once done,
// whatever it held (which may be nothing) is announced and the wreck is left stripped. Rocks' ore and comets'
// ice are only a moment's work.
export class SalvageSystem implements System<VoyageContext> {
  public readonly name = "salvage";

  public update(context: VoyageContext, dt: number): void {
    const { world, state, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying" || state.phase === "lost" || state.capture) {
      state.salvage = null;

      return;
    }

    const { body, ship } = parts;
    const { reach, match } = config.salvage;
    const nearest = this.nearest(context, body.x, body.y, body.radius, reach);

    world.stores.wreck.entities.forEach((entity, index) => {
      const wreck = world.stores.wreck.values[index];

      if (entity !== nearest && !wreck.isEmpty) {
        wreck.progress = Math.max(0, wreck.progress - (dt / wreck.seconds) * DECAY);
      }
    });

    if (nearest === null) {
      state.salvage = null;

      return;
    }

    const wreck = world.stores.wreck.get(nearest);
    const at = world.stores.body.get(nearest);

    if (!wreck || !at) {
      state.salvage = null;

      return;
    }

    const isHolding = Math.hypot(at.vx - body.vx, at.vy - body.vy) < match && ship.thrust < 0.35;

    wreck.progress = isHolding ? Math.min(1, wreck.progress + dt / wreck.seconds) : Math.max(0, wreck.progress - (dt / wreck.seconds) * DECAY);
    state.salvage = { wreck: nearest, progress: wreck.progress };

    if (wreck.progress >= 1) {
      wreck.isEmpty = true;
      state.salvage = null;
      events.emit("salvaged", { x: at.x, y: at.y, kind: wreck.kind, loot: wreck.loot });
      wreck.loot = { items: [], blueprints: [] };
    }
  }

  // The unstripped wreck nearest the hull, within reach.
  private nearest({ world }: VoyageContext, x: number, y: number, radius: number, reach: number): Entity | null {
    let nearest: Entity | null = null;
    let best = reach;

    for (let index = 0; index < world.stores.wreck.size; index += 1) {
      const entity = world.stores.wreck.entities[index];
      const at = world.stores.body.get(entity);
      const gap = at ? Math.hypot(at.x - x, at.y - y) - at.radius - radius : Infinity;

      if (!world.stores.wreck.values[index].isEmpty && gap < best) {
        nearest = entity;
        best = gap;
      }
    }

    return nearest;
  }
}
