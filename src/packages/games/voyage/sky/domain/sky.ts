// Something happening in the real sky on a day, as the voyage marks it: a meteor shower (and whether it is at its
// peak), two planets close together as seen from Earth, or a planet opposite the Sun, at its closest and brightest.
export type SkyEventKind = "shower" | "conjunction" | "opposition";

export interface SkyEvent {
  // "shower:perseids", "conjunction:mars:jupiter", "opposition:saturn".
  id: string;
  kind: SkyEventKind;
  // The shower, or the planets, by id.
  subjects: string[];
  isPeak: boolean;
}

// A meteor shower's yearly window and peak (month and day, UTC).
export interface ShowerSpec {
  id: string;
  start: [number, number];
  end: [number, number];
  peak: [number, number];
}
