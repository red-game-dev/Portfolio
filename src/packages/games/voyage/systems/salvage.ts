import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { WreckKind } from "../domain/components";
import { LootSource } from "../domain/loot";
import { VoyageContext } from "./context";

// How big each kind of wreck is (world units), unless it keeps the size of what it was.
const RADIUS: Record<WreckKind, number> = { probe: 0.07, rocket: 0.08, starship: 0.18, alien: 0.1, ore: 0.04, ice: 0.045 };

// What each kind of wreck is searched as.
const SOURCE: Record<WreckKind, LootSource> = { probe: "wreck", rocket: "wreck", starship: "wreck", alien: "alien", ore: "rock", ice: "comet" };

export interface WreckOrigin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius?: number;
  faction?: number;
  level?: number;
  isBoss?: boolean;
}

// Leaves a wreck drifting where something died or was found: what it holds rolled now from the loot table, for
// where the ship is and how strong the fallen was; tumbling slowly.
export const leaveWreck = (context: VoyageContext, kind: WreckKind, { x, y, vx, vy, radius, faction = -1, level = 1, isBoss = false }: WreckOrigin): number => {
  const { world, state, config, random, loot } = context;
  const wreck = world.spawn();
  const size = radius ?? RADIUS[kind];
  const universe = state.phase === "universe" ? state.universe : -1;

  world.stores.body.set(wreck, { x, y, vx, vy, prevX: x, prevY: y, radius: size, mass: size * size * 60 });
  world.stores.spin.set(wreck, { angle: random() * TAU, rate: randomBetween(random, -0.6, 0.6) });
  world.stores.wreck.set(wreck, {
    kind,
    loot: loot.roll({ source: isBoss ? "boss" : SOURCE[kind], style: state.cosmos?.style ?? null, universe, level }, random),
    progress: 0,
    seconds: config.salvage.seconds[kind] * (isBoss ? 2 : 1),
    isEmpty: false,
    seed: random(),
    faction,
  });

  return wreck;
};
