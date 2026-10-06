import { Lens } from "@/config/lenses";

// A stat on a character select card, out of LENS_STAT_MAX.
export interface LensStat {
  name: string;
  value: number;
}

export interface LensCard {
  lens: Lens;
  // Who the view is for, in plain words.
  name: string;
  // The game class the view plays as.
  characterClass: string;
  tagline: string;
  perks: string[];
  stats: LensStat[];
}

export interface RoadmapStage {
  name: string;
  detail: string;
}

export interface LensContent {
  chooser: {
    title: string;
    description: string;
    select: string;
  };
  cards: LensCard[];
  // The short names the header switch uses.
  names: Record<Lens, string>;
  switchLabel: string;
  entrances: {
    recruiter: { title: string };
    product: { title: string; stages: RoadmapStage[] };
    engineer: { lines: string[]; granted: string };
  };
}
