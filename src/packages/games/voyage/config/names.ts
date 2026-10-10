import { UniverseNames } from "../domain/universe";

// Syllables for names when the host gives none of its own.
export const DEFAULT_UNIVERSE_NAMES: UniverseNames = {
  starts: ["Vel", "Ka", "Or", "Thal", "Zir", "Ny", "Eld", "Mor", "Sel", "Vex", "Ar", "Qua", "Ish", "Dro"],
  middles: ["da", "ri", "on", "ae", "ul", "ix", "en", "or", "esh", "ya"],
  places: ["Reach", "Expanse", "Drift", "Veil", "Deep", "Hollow", "Sprawl", "Cradle", "Shoal", "Verge"],
  factions: {
    hostile: ["Swarm", "Horde", "Reavers"],
    territorial: ["Wardens", "Sentinels", "Keepers"],
    neutral: ["Union", "Guild", "Concord"],
    peaceful: ["Choir", "Drifters", "Pilgrims"],
  },
  belt: "the {star} belt",
};
