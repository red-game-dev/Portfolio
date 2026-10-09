import { ComponentStore, World } from "@/packages/games/engine";

import { Body, Health, Hazard, Hole, Modules, Pickup, Ship, Spin } from "../domain/components";

// One store per kind of component the voyage uses.
export const createVoyageStores = () => ({
  body: new ComponentStore<Body>(),
  spin: new ComponentStore<Spin>(),
  ship: new ComponentStore<Ship>(),
  health: new ComponentStore<Health>(),
  modules: new ComponentStore<Modules>(),
  hazard: new ComponentStore<Hazard>(),
  pickup: new ComponentStore<Pickup>(),
  hole: new ComponentStore<Hole>(),
});

export type VoyageStores = ReturnType<typeof createVoyageStores>;

export type VoyageWorld = World<VoyageStores>;
