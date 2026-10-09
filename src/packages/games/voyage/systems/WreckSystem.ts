import type { System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";

import { WreckKind } from "../domain/components";
import { pickWeighted } from "../utils/weighted";
import { VoyageContext } from "./context";
import { isSolar, shipOf, viewRadius } from "./queries";
import { leaveWreck } from "./salvage";

// Wrecks are let go this far from the ship.
const LET_GO = 40;

// Which derelicts drift by at home (lost probes, spent rockets, old starships) and in the universes (mostly the
// hulks of those who live there, and ships of ours that went before), by weight.
const HOME: ReadonlyArray<[WreckKind, number]> = [["probe", 45], ["rocket", 35], ["starship", 20]];
const AWAY: ReadonlyArray<[WreckKind, number]> = [["alien", 50], ["rocket", 20], ["starship", 20], ["probe", 10]];

// Now and then a derelict drifts into view from somewhere just out of sight, moving with the ship's own frame
// and a slow drift of its own, so it can be caught and stripped; wrecks far behind are let go.
export class WreckSystem implements System<VoyageContext> {
  public readonly name = "wrecks";

  public update(context: VoyageContext): void {
    const { state, world, config, random } = context;
    const parts = shipOf(context);

    world.stores.wreck.entities.forEach((entity) => {
      const wreck = world.stores.body.get(entity);

      if (!wreck || !parts || Math.hypot(wreck.x - parts.body.x, wreck.y - parts.body.y) > LET_GO) {
        world.despawn(entity);
      }
    });

    if (!parts || state.status !== "flying" || state.phase === "lost" || state.capture) {
      return;
    }

    const { every, max } = config.salvage;

    state.nextWreckAt = state.nextWreckAt ?? state.elapsedMs + randomBetween(random, every[0], every[1]) * 500;

    if (state.elapsedMs < state.nextWreckAt) {
      return;
    }

    state.nextWreckAt = state.elapsedMs + randomBetween(random, every[0], every[1]) * 1000;

    const derelicts = world.stores.wreck.values.filter((wreck) => wreck.kind !== "ore" && wreck.kind !== "ice").length;

    if (derelicts >= max) {
      return;
    }

    const kind = pickWeighted(random, isSolar(context) ? HOME : AWAY, ([, weight]) => weight)?.[0] ?? "probe";
    const from = random() * Math.PI * 2;
    const reach = viewRadius(context) + randomBetween(random, 0.5, 2);
    const drift = randomBetween(random, 0.04, 0.16);
    const heading = from + Math.PI + randomBetween(random, -0.8, 0.8);
    const factions = state.cosmos?.factions.length ?? 0;

    leaveWreck(context, kind, {
      x: parts.body.x + Math.cos(from) * reach,
      y: parts.body.y + Math.sin(from) * reach,
      vx: parts.body.vx + Math.cos(heading) * drift,
      vy: parts.body.vy + Math.sin(heading) * drift,
      faction: kind === "alien" && factions > 0 ? Math.floor(random() * factions) : -1,
      level: 1 + Math.max(0, state.universe),
    });
  }
}
