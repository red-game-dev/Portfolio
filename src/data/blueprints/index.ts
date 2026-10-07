import type { Blueprint, BlueprintSection, VentureBlueprintId } from "@/types/blueprints";

// Each section's drawings are their own chunk, fetched when the section comes near the screen, so a visit
// only downloads and parses the drawings it reaches. The labels are small and stay in the page.
export const loadSectionBlueprints = (section: BlueprintSection): Promise<Blueprint[]> => {
  switch (section) {
    case "ai":
      return import("@/data/blueprints/ai").then((module) => module.default);
    case "chain":
      return import("@/data/blueprints/chain").then((module) => module.default);
    case "platform":
      return import("@/data/blueprints/platform").then((module) => module.default);
    case "casino":
      return import("@/data/blueprints/casino").then((module) => module.default);
    case "mmo":
      return import("@/data/blueprints/mmo").then((module) => module.default);
  }
};

// A venture's drawing, fetched when its map dialog opens.
export const loadVentureBlueprint = (id: VentureBlueprintId): Promise<Blueprint> =>
  import("@/data/blueprints/ventures").then((module) => module.VENTURE_BLUEPRINTS[id]);
