import { LoopId, LoopRecipe } from "../domain/types";

// The continuous sounds as recipes. Intensity runs each from its `from` values to its `to` values: an engine's
// filter opens and its pitch climbs with thrust, a crackle thickens as the hull nears melting.
export const LOOPS: Readonly<Record<LoopId, LoopRecipe>> = {
  // A chemical rocket: low sawtooth and noise through a lowpass that opens with the throttle.
  engine: {
    tones: [
      { wave: "sawtooth", frequency: 42, gain: 0.35 },
      { wave: "triangle", frequency: 63, gain: 0.2, detune: 7 },
    ],
    noise: { source: "white", gain: 0.6 },
    filter: { type: "lowpass", from: 90, to: 1100, q: 0.7 },
    level: { from: 0.04, to: 0.5 },
    rise: 1.6,
  },
  // An ion drive: higher, thinner and brighter, with a shimmer in its filter.
  ionEngine: {
    tones: [
      { wave: "triangle", frequency: 110, gain: 0.25 },
      { wave: "sine", frequency: 220, gain: 0.15, detune: 5 },
    ],
    noise: { source: "white", gain: 0.35 },
    filter: { type: "bandpass", from: 500, to: 3200, q: 1.2 },
    level: { from: 0.03, to: 0.4 },
    rise: 1.8,
    lfo: { rate: 6, depth: 80 },
  },
  // The hull heating: sparse clicks that come faster and louder as it nears melting.
  heat: {
    tones: [],
    noise: { source: "crackle", gain: 1, rate: 0.6 },
    filter: { type: "highpass", from: 900, to: 2200, q: 0.5 },
    level: { from: 0, to: 0.45 },
    rise: 3,
  },
  // A tractor or salvage beam: a hum of near unisons with a slow wobble.
  beam: {
    tones: [
      { wave: "sine", frequency: 110, gain: 0.3 },
      { wave: "triangle", frequency: 165, gain: 0.15, detune: 8 },
      { wave: "sine", frequency: 220.7, gain: 0.1 },
    ],
    filter: { type: "lowpass", from: 600, to: 1800, q: 3 },
    level: { from: 0.08, to: 0.3 },
    rise: 1.15,
    lfo: { rate: 3, depth: 300 },
  },
};

export const LOOP_IDS: readonly LoopId[] = Object.keys(LOOPS).filter((key): key is LoopId => key in LOOPS);
