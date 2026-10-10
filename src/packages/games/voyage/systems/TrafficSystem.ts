import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { VoyageContext } from "./context";
import { isSolar, shipOf, viewRadius } from "./queries";

// Ships are let go this far from the ship once they have passed.
const LET_GO = 30;

// Now and then, someone else is out here: a rocket or a great starship of ours crosses the view on its own way,
// trailing its exhaust. Hit one and both are hurt; it does not stop.
export class TrafficSystem implements System<VoyageContext> {
  public readonly name = "traffic";

  public update(context: VoyageContext): void {
    const { state, world, config, random } = context;
    const parts = shipOf(context);

    world.stores.traffic.entities.forEach((entity) => {
      const craft = world.stores.body.get(entity);

      if (!craft || !parts || Math.hypot(craft.x - parts.body.x, craft.y - parts.body.y) > LET_GO) {
        world.despawn(entity);
      }
    });

    if (!parts || state.status !== "flying" || !isSolar(context)) {
      return;
    }

    state.nextTrafficAt = state.nextTrafficAt ?? state.elapsedMs + randomBetween(random, config.traffic[0], config.traffic[1]) * 1000;

    if (state.elapsedMs < state.nextTrafficAt) {
      return;
    }

    state.nextTrafficAt = state.elapsedMs + randomBetween(random, config.traffic[0], config.traffic[1]) * 1000;

    const isStarship = random() < 0.4;
    const from = random() * TAU;
    const reach = viewRadius(context) + 2;
    const x = parts.body.x + Math.cos(from) * reach;
    const y = parts.body.y + Math.sin(from) * reach;
    // Across the view, passing the ship to one side.
    const heading = from + Math.PI + randomBetween(random, -0.5, 0.5);
    const speed = isStarship ? randomBetween(random, 0.4, 0.7) : randomBetween(random, 0.9, 1.6);
    const craft = world.spawn();
    const radius = isStarship ? 0.16 : 0.06;

    world.stores.body.set(craft, { x, y, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed, prevX: x, prevY: y, radius, mass: radius * radius * 80 });
    world.stores.traffic.set(craft, { kind: isStarship ? "starship" : "rocket", faction: -1 });
  }
}
