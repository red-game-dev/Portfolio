import { clamp, wrap } from "@/packages/math/clamp";
import { pick, RandomSource } from "@/packages/math/random";

import { ArpPart, BarScore, LeadPart, MusicTheme, NoteEvent } from "../domain/types";
import { degreeToMidi, MODES } from "./pitch";

export const stepsPerBar = (theme: MusicTheme): number => theme.stepsPerBeat * theme.beatsPerBar;

export const stepSeconds = (theme: MusicTheme): number => 60 / theme.tempo / theme.stepsPerBeat;

// The degree of the chord under a bar: the progressions in turn, each chord held for `barsPerChord` bars, then
// round again from the first.
export const chordDegreeAt = (theme: MusicTheme, bar: number): number => {
  let total = 0;

  for (const progression of theme.progressions) {
    total += progression.length * theme.barsPerChord;
  }

  let position = wrap(Math.floor(bar), Math.max(1, total));

  for (const progression of theme.progressions) {
    const span = progression.length * theme.barsPerChord;

    if (position < span) {
      return progression[Math.floor(position / theme.barsPerChord)];
    }

    position -= span;
  }

  return 0;
};

// The notes of the chord on a degree, stacked in thirds of the scale and kept near the root: a chord from the
// upper half of the scale is built an octave down, so the progression moves by small steps rather than leaps.
export const chordOf = (theme: MusicTheme, degree: number): number[] => {
  const length = MODES[theme.mode].length;
  const base = wrap(degree, length) >= Math.ceil(length / 2) ? wrap(degree, length) - length : wrap(degree, length);
  const notes: number[] = [];

  for (let tone = 0; tone < (theme.sevenths ? 4 : 3); tone += 1) {
    notes.push(degreeToMidi(theme.root, theme.mode, base + tone * 2));
  }

  return notes;
};

// A run through the chord's notes over so many octaves, as an arpeggio climbs it.
const arpNote = (arp: ArpPart, chord: readonly number[], index: number, random: RandomSource): number => {
  const count = chord.length * Math.max(1, arp.octaves);
  const noteAt = (position: number) => chord[position % chord.length] + 12 * Math.floor(position / chord.length);

  if (arp.pattern === "random") {
    return noteAt(Math.min(count - 1, Math.floor(random() * count)));
  }

  if (arp.pattern === "down") {
    return noteAt(count - 1 - (index % count));
  }

  if (arp.pattern === "bounce" && count > 1) {
    const period = 2 * count - 2;
    const position = index % period;

    return noteAt(position < count ? position : period - position);
  }

  return noteAt(index % count);
};

// The degree nearest `position` that belongs to the chord on `degree`, in any octave.
const nearestChordTone = (position: number, degree: number, length: number): number => {
  let nearest = position;
  let distance = Infinity;

  for (let tone = 0; tone < 3; tone += 1) {
    const base = degree + tone * 2;
    const candidate = base + length * Math.round((position - base) / length);

    if (Math.abs(candidate - position) < distance) {
      distance = Math.abs(candidate - position);
      nearest = candidate;
    }
  }

  return nearest;
};

// A value kept within a range by bouncing off its ends, as a melody turns back at the top of its register.
const reflect = (value: number, min: number, max: number): number => {
  if (value < min) {
    return clamp(min + (min - value), min, max);
  }

  return value > max ? clamp(max - (value - max), min, max) : value;
};

// A melody that wanders the scale by steps no wider than `leap`, landing on a chord tone on each beat. Two
// octaves of room above the root, which the instrument's octave then places.
const composeLead = (theme: MusicTheme, lead: LeadPart, degree: number, random: RandomSource, events: NoteEvent[]) => {
  const length = MODES[theme.mode].length;
  const steps = stepsPerBar(theme);
  let position = nearestChordTone(degree + 2 * Math.floor(random() * 3), degree, length);
  let step = 0;

  while (step < steps) {
    const isOnBeat = step % theme.stepsPerBeat === 0;
    const chance = isOnBeat ? Math.min(1, lead.density * 1.5) : lead.density * 0.6;

    if (random() < chance) {
      const move = Math.round((random() * 2 - 1) * lead.leap);

      position = reflect(position + move, 0, length * 2);
      position = isOnBeat ? reflect(nearestChordTone(position, degree, length), 0, length * 2) : position;

      const lasts = pick(random, lead.lengths);

      events.push({ part: "lead", step, steps: lasts, midi: degreeToMidi(theme.root, theme.mode, position), velocity: 0.6 + random() * 0.4, from: lead.from });
      step += Math.max(1, lasts);
    } else {
      step += 1;
    }
  }
};

const marks = (pattern: string, step: number): string => (pattern.length === 0 ? "." : pattern[step % pattern.length]);

// Every note of one bar of a theme. The chords follow the theme's progressions; the voicing, the melody, a random
// arpeggio and the drums' accents are drawn from `random`, so a seeded source plays the same score every time
// and any other plays one never heard before, always in key. Every part is composed whatever the intensity, each
// note marked with the intensity it needs, so a fight starting mid bar adds its layers without changing the tune.
export const composeBar = (theme: MusicTheme, random: RandomSource, bar: number): BarScore => {
  const steps = stepsPerBar(theme);
  const degree = chordDegreeAt(theme, bar);
  const chord = chordOf(theme, degree);
  const events: NoteEvent[] = [];

  if (theme.pad && bar % theme.barsPerChord === 0) {
    // Raises the lowest few notes an octave, so the same chord comes back voiced differently.
    const lifted = Math.floor(random() * chord.length);

    chord.forEach((midi, index) => {
      events.push({ part: "pad", step: 0, steps: steps * theme.barsPerChord, midi: index < lifted ? midi + 12 : midi, velocity: 0.85 + random() * 0.15, from: 0 });
    });
  }

  if (theme.bass) {
    events.push({ part: "bass", step: 0, steps, midi: chord[0], velocity: 1, from: 0 });
  }

  if (theme.pulse) {
    for (let step = 0; step < steps; step += 1) {
      const mark = marks(theme.pulse.pattern, step);

      if (mark === "x" || mark === "o") {
        events.push({ part: "pulse", step, steps: 1, midi: mark === "x" ? chord[0] : chord[2], velocity: step === 0 ? 1 : 0.75, from: theme.pulse.from });
      }
    }
  }

  if (theme.arp) {
    const every = Math.max(1, theme.arp.every);

    for (let step = 0; step < steps; step += every) {
      events.push({ part: "arp", step, steps: every, midi: arpNote(theme.arp, chord, step / every, random), velocity: 0.7 + random() * 0.3, from: theme.arp.from });
    }
  }

  if (theme.lead && random() >= theme.lead.rest) {
    composeLead(theme, theme.lead, degree, random, events);
  }

  if (theme.drums) {
    const { kick, snare, hat, from } = theme.drums;

    for (let step = 0; step < steps; step += 1) {
      const accent = random();

      if (marks(kick, step) === "x") {
        events.push({ part: "kick", step, steps: 1, midi: 0, velocity: 1, from });
      }

      if (marks(snare, step) === "x") {
        events.push({ part: "snare", step, steps: 1, midi: 0, velocity: 0.8, from });
      }

      if (marks(hat, step) === "x") {
        events.push({ part: "hat", step, steps: 1, midi: 0, velocity: 0.35 + accent * 0.35, from });
      }
    }
  }

  events.sort((first, second) => first.step - second.step);

  return { bar, degree, chord, events };
};
