import type { EventBus, SpatialHash } from "@/packages/games/engine";
import type { RandomSource } from "@/packages/math/random";
import type { FieldSample, GravityField, GravitySource } from "@/packages/physics/newtonian";

import { VoyageConfig } from "../config";
import { VoyageWorld } from "../core/world";
import { VoyageEvents } from "../domain/events";
import { VoyageInput } from "../domain/input";
import { VoyageState } from "../domain/state";
import { UniverseGenerator, UniverseTheme } from "../generators/UniverseGenerator";

// What every system is handed each step. Shared scratch (the field sample, the source list, the grid) lives here
// so no system allocates in the hot loop.
export interface VoyageContext {
  world: VoyageWorld;
  state: VoyageState;
  config: VoyageConfig;
  input: VoyageInput;
  events: EventBus<VoyageEvents>;
  random: RandomSource;
  field: GravityField;
  sample: FieldSample;
  sources: GravitySource[];
  sourceIds: string[];
  grid: SpatialHash;
  // Makes each universe the ship reaches, the first ones in the site's zones' looks.
  universes: UniverseGenerator;
  themes: UniverseTheme[];
}
