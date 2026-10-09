import { ComponentStore, World } from "@/packages/games/engine";

import { Alien, Body, Health, Hazard, Hole, Impactor, Modules, Pickup, Projectile, Ship, Spin, Traffic, Weapon, Wreck } from "../domain/components";

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
  alien: new ComponentStore<Alien>(),
  weapon: new ComponentStore<Weapon>(),
  projectile: new ComponentStore<Projectile>(),
  impactor: new ComponentStore<Impactor>(),
  traffic: new ComponentStore<Traffic>(),
  wreck: new ComponentStore<Wreck>(),
});

export type VoyageStores = ReturnType<typeof createVoyageStores>;

export type VoyageWorld = World<VoyageStores>;
