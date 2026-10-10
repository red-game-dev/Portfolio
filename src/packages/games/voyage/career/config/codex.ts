import { GALAXY_KINDS } from "../../config/galaxies";
import { WORLD_CLASS_IDS } from "../../config/worlds";
import { WreckKind } from "../../domain/components";
import { DEEP_STYLES, VoyageStyle } from "../../domain/theme";
import { HullShape, PhenomenonKind, StarKind } from "../../domain/universe";
import { ITEMS } from "../../economy/config/catalog";
import { SOLAR_SYSTEM } from "../../sources/SolarSystemSource";
import { CodexCategory, CodexEntry, CodexFacts } from "../domain/career";

const entry = (category: CodexCategory, subject: string, facts: CodexFacts | null = null): CodexEntry => ({ id: `${category}:${subject}`, category, subject, facts });

const ZONE_STYLES: readonly VoyageStyle[] = ["matrix", "neural", "blocks", "chips", "pixels"];
const STARS: ReadonlyArray<StarKind | "none" | "binary" | "triple"> = [
  "brownDwarf", "red", "orange", "yellow", "white", "blue", "giant", "blueSupergiant", "redSupergiant", "hypergiant", "wolfRayet", "whiteDwarf", "neutron", "none",
  "binary", "triple",
];
const PHENOMENA: ReadonlyArray<PhenomenonKind | "blackHole"> = [
  "blackHole",
  "nebula",
  "pulsar",
  "magnetar",
  "supernova",
  "gammaBurst",
  "darkForest",
  "wormholes",
  "quasar",
  "whales",
];
const LIFE: ReadonlyArray<HullShape | "trader" | "whale"> = ["saucer", "insect", "crystal", "organic", "monolith", "swarm", "trader", "whale"];
const WRECKS: readonly WreckKind[] = ["probe", "rocket", "starship", "alien", "ore", "ice"];

// Everything the codex can hold, in the order it lists them: every world of our own system with its real
// figures, the Sun and the belts, then what the universes hold.
export const CODEX: readonly CodexEntry[] = [
  entry("worlds", SOLAR_SYSTEM.star.id, { radiusKm: SOLAR_SYSTEM.star.radiusKm, gravity: SOLAR_SYSTEM.star.surfaceGravity, dayHours: SOLAR_SYSTEM.star.rotationDays * 24,
    pressureBar: null, dayC: SOLAR_SYSTEM.star.temperatureK - 273, nightC: SOLAR_SYSTEM.star.temperatureK - 273 }),
  ...SOLAR_SYSTEM.bodies.map((body) => entry("worlds", body.id, {
    radiusKm: body.radiusKm,
    gravity: body.surfaceGravity,
    dayHours: body.dayHours,
    pressureBar: body.air?.pressureBar ?? null,
    dayC: body.dayC,
    nightC: body.nightC,
  })),
  ...SOLAR_SYSTEM.belts.map((belt) => entry("worlds", belt.id)),
  ...WORLD_CLASS_IDS.map((kind) => entry("kinds", kind)),
  ...[...ZONE_STYLES, ...DEEP_STYLES].map((style) => entry("universes", style)),
  ...GALAXY_KINDS.map((kind) => entry("galaxies", kind)),
  ...STARS.map((star) => entry("stars", star)),
  ...PHENOMENA.map((kind) => entry("phenomena", kind)),
  ...LIFE.map((shape) => entry("life", shape)),
  ...WRECKS.map((kind) => entry("wrecks", kind)),
  ...Object.keys(ITEMS).map((id) => entry("things", id)),
];

export const codexId = (category: CodexCategory, subject: string): string => `${category}:${subject}`;

export const CODEX_IDS: ReadonlySet<string> = new Set(CODEX.map((item) => item.id));
