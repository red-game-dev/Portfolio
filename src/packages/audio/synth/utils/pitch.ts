import { wrap } from "@/packages/math/clamp";

import { ModeName } from "../domain/types";

// Each mode as semitones above its tonic.
export const MODES: Readonly<Record<ModeName, readonly number[]>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
};

// A MIDI note in Hz, equal tempered with A4 (69) at 440.
export const midiToHz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

// A detune in cents as a multiple of frequency.
export const centsToRatio = (cents: number): number => 2 ** (cents / 1200);

// The MIDI note of a degree of the scale, 0 the tonic. Degrees past the top climb into the next octave and those
// below 0 fall into the one beneath, so a melody can walk the scale as far as it likes.
export const degreeToMidi = (root: number, mode: ModeName, degree: number): number => {
  const steps = MODES[mode];

  return root + 12 * Math.floor(degree / steps.length) + steps[wrap(degree, steps.length)];
};

// Every note of the scale from the tonic up through so many octaves.
export const scaleNotes = (root: number, mode: ModeName, octaves: number): number[] => {
  const count = MODES[mode].length * Math.max(0, Math.floor(octaves));
  const notes: number[] = [];

  for (let degree = 0; degree < count; degree += 1) {
    notes.push(degreeToMidi(root, mode, degree));
  }

  return notes;
};

// Whether a MIDI note belongs to the key, in any octave.
export const inScale = (midi: number, root: number, mode: ModeName): boolean => MODES[mode].includes(wrap(Math.round(midi) - root, 12));
