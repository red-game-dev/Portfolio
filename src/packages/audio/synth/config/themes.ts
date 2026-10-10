import { CueRecipe, DrumId, Instrument, MusicTheme, MusicThemeId, Wave } from "../domain/types";

// A sustained chord voice: slow to swell and slow to let go, with a second oscillator `unison` cents sharp.
const pad = (wave: Wave, cutoff: number, attack: number, release: number, gain: number, unison: number): Instrument => ({
  wave,
  octave: 0,
  cutoff,
  unison,
  gain,
  envelope: { attack, decay: 0.8, sustain: 0.75, release },
});

// A held bass note.
const bass = (wave: Wave, cutoff: number, gain: number, octave: number): Instrument => ({
  wave,
  octave,
  cutoff,
  gain,
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 0.4 },
});

// A struck note that dies away by itself; unfiltered when `cutoff` is 0.
const pluck = (wave: Wave, octave: number, cutoff: number, decay: number, gain: number): Instrument => ({
  wave,
  octave,
  cutoff,
  gain,
  envelope: { attack: 0.004, decay },
});

// A struck sine with an overtone over it: a ratio of 3 rings like glass, an inharmonic one like a bell.
const ring = (octave: number, decay: number, gain: number, ratio: number): Instrument => ({
  wave: "sine",
  octave,
  gain,
  envelope: { attack: 0.003, decay },
  partial: { ratio, gain: 0.3 },
});

// The light percussion every theme shares, as cue recipes.
export const DRUMS: Readonly<Record<DrumId, CueRecipe>> = {
  kick: {
    layers: [
      { kind: "tone", wave: "sine", from: 150, to: 45, sweep: 0.12, envelope: { attack: 0.002, decay: 0.24 }, gain: 0.9 },
      { kind: "noise", filter: { type: "lowpass", from: 1200 }, envelope: { attack: 0.001, decay: 0.02 }, gain: 0.2 },
    ],
  },
  snare: {
    layers: [
      { kind: "noise", filter: { type: "bandpass", from: 1800, q: 0.8 }, envelope: { attack: 0.001, decay: 0.14 }, gain: 0.5 },
      { kind: "tone", wave: "triangle", from: 190, to: 150, envelope: { attack: 0.001, decay: 0.08 }, gain: 0.3 },
    ],
  },
  hat: {
    layers: [{ kind: "noise", filter: { type: "highpass", from: 7000 }, envelope: { attack: 0.001, decay: 0.04 }, gain: 0.35 }],
  },
};

// Every theme of the score. Pulse and drum patterns are one character a step ("x" plays, "o" plays the fifth in
// a pulse); a part's `from` is the music intensity it joins at, so calm flight hears the pad and the melody, and
// a fight or a boss adds the pulse and the drums.
export const THEMES: Readonly<Record<MusicThemeId, MusicTheme>> = {
  // Our solar system: calm, wide and hopeful, in D major with a slow echo.
  solar: {
    root: 50,
    mode: "major",
    tempo: 72,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 2,
    progressions: [
      [0, 4, 5, 3],
      [0, 3, 5, 4],
    ],
    sevenths: false,
    pad: pad("sawtooth", 1300, 1.4, 2.4, 0.06, 9),
    bass: bass("sine", 400, 0.2, -1),
    lead: { instrument: pluck("triangle", 1, 3000, 1.2, 0.12), density: 0.22, lengths: [2, 3, 4], leap: 2, rest: 0.25, from: 0 },
    arp: null,
    pulse: { instrument: pluck("triangle", -1, 900, 0.25, 0.14), pattern: "x.x.x.x.", from: 0.35 },
    drums: { kick: "x...x...", snare: "..x...x.", hat: ".x.x.x.x", from: 0.6 },
    echo: { beats: 0.75, feedback: 0.35, mix: 0.3 },
    level: 0.7,
  },
  // The matrix: A minor, sevenths and a square arpeggio running up two octaves in sixteenths.
  matrix: {
    root: 45,
    mode: "minor",
    tempo: 108,
    stepsPerBeat: 4,
    beatsPerBar: 4,
    barsPerChord: 2,
    progressions: [
      [0, 5, 3, 4],
      [0, 6, 5, 4],
    ],
    sevenths: true,
    pad: pad("sawtooth", 700, 0.8, 1.6, 0.045, 6),
    bass: bass("sawtooth", 320, 0.16, -1),
    lead: { instrument: pluck("sine", 2, 0, 0.25, 0.08), density: 0.07, lengths: [1, 2], leap: 3, rest: 0.4, from: 0 },
    arp: { instrument: pluck("square", 1, 2200, 0.16, 0.06), every: 1, pattern: "up", octaves: 2, from: 0 },
    pulse: { instrument: pluck("sawtooth", -1, 600, 0.12, 0.13), pattern: "x.x.x.x.x.x.x.x.", from: 0.35 },
    drums: { kick: "x...x...x...x...", snare: "....x.......x...", hat: "..x...x...x...x.", from: 0.6 },
    echo: { beats: 0.75, feedback: 0.3, mix: 0.2 },
    level: 0.6,
  },
  // The neural zone: dreamy and glassy, E lydian, notes ringing with an overtone a twelfth up.
  neural: {
    root: 52,
    mode: "lydian",
    tempo: 66,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 2,
    progressions: [
      [0, 1, 0, 4],
      [5, 1, 3, 0],
    ],
    sevenths: true,
    pad: pad("triangle", 2200, 2, 2.8, 0.06, 5),
    bass: bass("sine", 300, 0.15, -1),
    lead: { instrument: ring(2, 1.6, 0.08, 3), density: 0.2, lengths: [2, 3], leap: 3, rest: 0.2, from: 0 },
    arp: { instrument: ring(1, 0.9, 0.05, 3), every: 2, pattern: "bounce", octaves: 2, from: 0.2 },
    pulse: { instrument: pluck("sine", -1, 0, 0.4, 0.16), pattern: "x...x...", from: 0.4 },
    drums: { kick: "x.......", snare: "....x...", hat: "..x...x.", from: 0.65 },
    echo: { beats: 1.5, feedback: 0.45, mix: 0.38 },
    level: 0.65,
  },
  // The blocks: steady square pulses in G dorian, a chain confirming beat after beat.
  blocks: {
    root: 43,
    mode: "dorian",
    tempo: 100,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 2,
    progressions: [
      [0, 3, 6, 4],
      [0, 6, 3, 4],
    ],
    sevenths: false,
    pad: pad("square", 900, 0.5, 1.2, 0.04, 0),
    bass: null,
    lead: { instrument: pluck("square", 1, 1800, 0.3, 0.07), density: 0.16, lengths: [1, 2], leap: 2, rest: 0.35, from: 0 },
    arp: { instrument: pluck("square", 1, 1400, 0.2, 0.05), every: 2, pattern: "up", octaves: 1, from: 0.25 },
    pulse: { instrument: pluck("square", -1, 700, 0.18, 0.14), pattern: "xxxoxxxo", from: 0 },
    drums: { kick: "x...x...", snare: "..x...x.", hat: "xxxxxxxx", from: 0.55 },
    echo: null,
    level: 0.6,
  },
  // The casino: playful, F major with sevenths, an oom-pah bass and a bouncing arpeggio.
  chips: {
    root: 53,
    mode: "major",
    tempo: 116,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 1,
    progressions: [
      [0, 5, 1, 4],
      [0, 3, 4, 0],
      [2, 5, 1, 4],
    ],
    sevenths: true,
    pad: { wave: "triangle", octave: 0, cutoff: 1800, unison: 4, gain: 0.04, envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.4 } },
    bass: null,
    lead: { instrument: pluck("square", 1, 3000, 0.22, 0.07), density: 0.3, lengths: [1, 1, 2], leap: 3, rest: 0.15, from: 0 },
    arp: { instrument: pluck("triangle", 1, 0, 0.25, 0.06), every: 1, pattern: "bounce", octaves: 1, from: 0.2 },
    pulse: { instrument: pluck("triangle", -1, 800, 0.25, 0.16), pattern: "x.o.x.o.", from: 0 },
    drums: { kick: "x...x...", snare: "..x...x.", hat: ".x.x.x.x", from: 0.5 },
    echo: { beats: 0.5, feedback: 0.2, mix: 0.15 },
    level: 0.6,
  },
  // The game world: chiptune, bare square and triangle waves at 132, the arpeggio in sixteenths.
  pixels: {
    root: 48,
    mode: "major",
    tempo: 132,
    stepsPerBeat: 4,
    beatsPerBar: 4,
    barsPerChord: 1,
    progressions: [
      [0, 3, 4, 0],
      [5, 3, 4, 4],
    ],
    sevenths: false,
    pad: null,
    bass: null,
    lead: {
      instrument: { wave: "square", octave: 1, gain: 0.07, envelope: { attack: 0.002, decay: 0.05, sustain: 0.6, release: 0.03 } },
      density: 0.3,
      lengths: [1, 2, 2, 4],
      leap: 2,
      rest: 0.1,
      from: 0,
    },
    arp: { instrument: pluck("square", 1, 0, 0.07, 0.035), every: 1, pattern: "up", octaves: 1, from: 0 },
    pulse: {
      instrument: { wave: "triangle", octave: -1, gain: 0.2, envelope: { attack: 0.002, decay: 0.05, sustain: 0.8, release: 0.02 } },
      pattern: "x.x.o.x.x.x.o.x.",
      from: 0,
    },
    drums: { kick: "x.......x.......", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", from: 0.5 },
    echo: null,
    level: 0.55,
  },
  // A nebula universe: warm, wide sawtooth pads in B flat that change only every four bars.
  nebula: {
    root: 46,
    mode: "major",
    tempo: 60,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 4,
    progressions: [
      [0, 3],
      [0, 5, 3, 4],
    ],
    sevenths: true,
    pad: pad("sawtooth", 850, 2.8, 3.5, 0.055, 12),
    bass: bass("sine", 250, 0.16, -1),
    lead: { instrument: pluck("triangle", 1, 2000, 1.6, 0.08), density: 0.1, lengths: [3, 4, 6], leap: 2, rest: 0.35, from: 0 },
    arp: null,
    pulse: { instrument: pluck("sine", -1, 0, 0.4, 0.16), pattern: "x...o...", from: 0.4 },
    drums: { kick: "x.......", snare: "....x...", hat: "..x...x.", from: 0.65 },
    echo: { beats: 1.5, feedback: 0.5, mix: 0.35 },
    level: 0.7,
  },
  // A void universe: sparse, low and eerie, D phrygian, a lone note now and then sliding into place.
  void: {
    root: 38,
    mode: "phrygian",
    tempo: 50,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 4,
    progressions: [
      [0, 1],
      [0, 6, 1, 0],
    ],
    sevenths: false,
    pad: pad("sine", 500, 3.5, 4, 0.08, 4),
    bass: bass("sine", 200, 0.16, -1),
    lead: {
      instrument: { wave: "sine", octave: 1, gain: 0.06, glide: -150, envelope: { attack: 0.6, decay: 2.4 } },
      density: 0.05,
      lengths: [6, 8],
      leap: 4,
      rest: 0.5,
      from: 0,
    },
    arp: null,
    pulse: { instrument: pluck("sine", -1, 0, 0.6, 0.18), pattern: "x.......", from: 0.4 },
    drums: { kick: "x.......", snare: "........", hat: "....x...", from: 0.7 },
    echo: { beats: 2, feedback: 0.55, mix: 0.45 },
    level: 0.75,
  },
  // A crystal universe: bright bells in A lydian over a clear triangle pad.
  crystal: {
    root: 57,
    mode: "lydian",
    tempo: 84,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 2,
    progressions: [
      [0, 4, 1, 5],
      [0, 1, 4, 0],
    ],
    sevenths: true,
    pad: pad("triangle", 2600, 1.6, 2.4, 0.04, 3),
    bass: bass("sine", 400, 0.12, -2),
    lead: { instrument: ring(1, 2.2, 0.09, 2.76), density: 0.24, lengths: [1, 2, 3], leap: 3, rest: 0.15, from: 0 },
    arp: { instrument: ring(2, 1.2, 0.04, 2.76), every: 2, pattern: "bounce", octaves: 2, from: 0.15 },
    pulse: { instrument: pluck("triangle", -1, 1200, 0.3, 0.12), pattern: "x.x.o.x.", from: 0.4 },
    drums: { kick: "x...x...", snare: "..x...x.", hat: ".x.x.x.x", from: 0.65 },
    echo: { beats: 0.75, feedback: 0.4, mix: 0.35 },
    level: 0.6,
  },
  // An ember universe: dark and warm, E dorian, slow and low with a dull sawtooth.
  ember: {
    root: 40,
    mode: "dorian",
    tempo: 56,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 4,
    progressions: [
      [0, 6, 5, 6],
      [0, 3, 6, 0],
    ],
    sevenths: true,
    pad: pad("sawtooth", 600, 2.4, 3, 0.06, 10),
    bass: bass("sawtooth", 240, 0.14, -1),
    lead: { instrument: pluck("triangle", 0, 1200, 1.4, 0.09), density: 0.09, lengths: [3, 4], leap: 2, rest: 0.4, from: 0 },
    arp: null,
    pulse: { instrument: pluck("sawtooth", -1, 400, 0.35, 0.13), pattern: "x...x.o.", from: 0.4 },
    drums: { kick: "x.....x.", snare: "....x...", hat: "..x...x.", from: 0.65 },
    echo: { beats: 1, feedback: 0.4, mix: 0.3 },
    level: 0.7,
  },
  // An abyss universe: deep swells in A minor, and now and then a whale's call sliding up into its note.
  abyss: {
    root: 33,
    mode: "minor",
    tempo: 46,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 4,
    progressions: [
      [0, 5],
      [0, 3, 5, 0],
    ],
    sevenths: false,
    pad: { wave: "sine", octave: 1, gain: 0.08, unison: 5, cutoff: 600, glide: -60, envelope: { attack: 4, decay: 1.5, sustain: 0.7, release: 4 } },
    bass: bass("sine", 180, 0.16, 0),
    lead: {
      instrument: { wave: "sawtooth", octave: 2, gain: 0.05, cutoff: 700, q: 4, glide: -500, envelope: { attack: 0.9, decay: 0.8, sustain: 0.6, release: 1.8 } },
      density: 0.05,
      lengths: [6, 8],
      leap: 4,
      rest: 0.45,
      from: 0,
    },
    arp: null,
    pulse: { instrument: pluck("sine", 0, 0, 0.8, 0.16), pattern: "x.......", from: 0.4 },
    drums: { kick: "x.......", snare: "........", hat: "......x.", from: 0.7 },
    echo: { beats: 2, feedback: 0.55, mix: 0.45 },
    level: 0.8,
  },
  // A boss: tense and driving, E harmonic minor at 140, the pulse and arpeggio in sixteenths from the start.
  boss: {
    root: 40,
    mode: "harmonicMinor",
    tempo: 140,
    stepsPerBeat: 4,
    beatsPerBar: 4,
    barsPerChord: 1,
    progressions: [
      [0, 5, 3, 4],
      [0, 0, 5, 4],
    ],
    sevenths: false,
    pad: pad("sawtooth", 1000, 0.3, 0.8, 0.045, 14),
    bass: null,
    lead: {
      instrument: { wave: "sawtooth", octave: 1, gain: 0.06, cutoff: 2400, envelope: { attack: 0.005, decay: 0.12, sustain: 0.6, release: 0.1 } },
      density: 0.14,
      lengths: [2, 4],
      leap: 2,
      rest: 0.3,
      from: 0.5,
    },
    arp: { instrument: pluck("square", 1, 2000, 0.1, 0.045), every: 1, pattern: "bounce", octaves: 2, from: 0 },
    pulse: { instrument: pluck("sawtooth", -1, 500, 0.1, 0.16), pattern: "xxoxxxoxxxoxxxox", from: 0 },
    drums: { kick: "x...x...x...x...", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", from: 0.2 },
    echo: null,
    level: 0.6,
  },
  // Menus and the hangar: soft, C major, a pad and a few notes and nothing that asks for attention.
  menu: {
    root: 48,
    mode: "major",
    tempo: 68,
    stepsPerBeat: 2,
    beatsPerBar: 4,
    barsPerChord: 2,
    progressions: [
      [0, 5, 3, 4],
      [0, 3, 0, 4],
    ],
    sevenths: true,
    pad: pad("triangle", 1200, 1.6, 2.4, 0.06, 6),
    bass: bass("sine", 300, 0.13, -1),
    lead: { instrument: pluck("sine", 1, 0, 1.2, 0.1), density: 0.16, lengths: [2, 4], leap: 2, rest: 0.3, from: 0 },
    arp: null,
    pulse: null,
    drums: null,
    echo: { beats: 0.75, feedback: 0.3, mix: 0.25 },
    level: 0.6,
  },
};

export const MUSIC_THEMES: readonly MusicThemeId[] = Object.keys(THEMES).filter((key): key is MusicThemeId => key in THEMES);
