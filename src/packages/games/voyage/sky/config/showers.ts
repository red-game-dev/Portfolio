import { ShowerSpec } from "../domain/sky";

// The major meteor showers, each active over the same dates every year and peaking on about the same night, from the
// International Meteor Organization's calendar (each the dust of a comet or an asteroid Earth crosses, named in the host's content).
export const METEOR_SHOWERS: readonly ShowerSpec[] = [
  { id: "quadrantids", start: [12, 28], end: [1, 12], peak: [1, 3] },
  { id: "lyrids", start: [4, 14], end: [4, 30], peak: [4, 22] },
  { id: "etaAquariids", start: [4, 19], end: [5, 28], peak: [5, 6] },
  { id: "perseids", start: [7, 17], end: [8, 24], peak: [8, 12] },
  { id: "orionids", start: [10, 2], end: [11, 7], peak: [10, 21] },
  { id: "leonids", start: [11, 6], end: [11, 30], peak: [11, 17] },
  { id: "geminids", start: [12, 4], end: [12, 20], peak: [12, 14] },
];

// The planets an eye can see, the outer ones that come to opposition, how close two must look to be a conjunction
// (degrees), how far from the Sun they must stand to be seen at all, and how near opposite it counts as opposition.
export const NAKED_EYE: readonly string[] = ["mercury", "venus", "mars", "jupiter", "saturn"];
export const OUTER: readonly string[] = ["mars", "jupiter", "saturn"];
export const SKY_LIMITS = { conjunction: 3, sunClearance: 15, opposition: 4 };
