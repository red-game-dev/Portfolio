import { CueRecipe, SoundCue, ToneLayer, Wave } from "../domain/types";

// One struck note of a jingle, softened by a closing lowpass so square waves chime rather than buzz.
const chime = (hz: number, delay: number, decay: number, wave: Wave = "square", gain = 0.22): ToneLayer => ({
  kind: "tone",
  wave,
  from: hz,
  delay,
  filter: { type: "lowpass", from: 4500, to: 2000 },
  envelope: { attack: 0.004, decay },
  gain,
});

// A held note of a fanfare: struck, settled to a sustain, then let go.
const held = (hz: number, delay: number, hold: number, wave: Wave, gain: number): ToneLayer => ({
  kind: "tone",
  wave,
  from: hz,
  delay,
  filter: { type: "lowpass", from: 4000, to: 1800 },
  envelope: { attack: 0.006, decay: 0.1, sustain: 0.6, hold, release: 0.45 },
  gain,
});

// Every sound effect as a recipe. Each is a few oscillators and filtered noise with envelopes, so nothing is
// downloaded, and tuning a sound is changing a number here. Frequencies are Hz and times seconds; a decay with
// no sustain falls exponentially to silence, so the audible tail is about half of it.
export const CUES: Readonly<Record<SoundCue, CueRecipe>> = {
  cannon: {
    gain: 0.9,
    vary: 0.06,
    layers: [
      { kind: "tone", wave: "sine", from: 160, to: 42, envelope: { attack: 0.002, decay: 0.24 }, gain: 0.8 },
      { kind: "noise", filter: { type: "lowpass", from: 2400, to: 260 }, envelope: { attack: 0.001, decay: 0.16 }, gain: 0.55 },
      { kind: "tone", wave: "triangle", from: 90, to: 38, envelope: { attack: 0.002, decay: 0.12 }, gain: 0.3 },
    ],
  },
  laser: {
    gain: 0.5,
    vary: 0.05,
    layers: [
      {
        kind: "tone",
        wave: "sawtooth",
        from: 1500,
        to: 240,
        sweep: 0.14,
        filter: { type: "lowpass", from: 5000, to: 1200 },
        envelope: { attack: 0.002, decay: 0.16 },
        gain: 0.35,
      },
      {
        kind: "tone",
        wave: "square",
        from: 1510,
        to: 250,
        sweep: 0.14,
        detune: 12,
        filter: { type: "lowpass", from: 3000 },
        envelope: { attack: 0.002, decay: 0.12 },
        gain: 0.15,
      },
    ],
  },
  missile: {
    gain: 0.6,
    vary: 0.05,
    layers: [
      { kind: "noise", filter: { type: "bandpass", from: 500, to: 2600, q: 1.2 }, envelope: { attack: 0.03, decay: 0.55 }, gain: 0.6 },
      { kind: "tone", wave: "sawtooth", from: 110, to: 320, filter: { type: "lowpass", from: 700, to: 1400 }, envelope: { attack: 0.02, decay: 0.45 }, gain: 0.2 },
      { kind: "tone", wave: "sine", from: 140, to: 60, envelope: { attack: 0.002, decay: 0.12 }, gain: 0.4 },
    ],
  },
  mine: {
    gain: 0.6,
    layers: [
      { kind: "tone", wave: "sine", from: 240, to: 90, envelope: { attack: 0.002, decay: 0.14 }, gain: 0.6 },
      { kind: "noise", filter: { type: "bandpass", from: 1800, q: 2 }, envelope: { attack: 0.001, decay: 0.04 }, gain: 0.3 },
      chime(1320, 0.1, 0.07, "square", 0.12),
      chime(1320, 0.22, 0.07, "square", 0.12),
    ],
  },
  railgun: {
    gain: 0.7,
    vary: 0.03,
    priority: 1,
    layers: [
      {
        kind: "tone",
        wave: "sawtooth",
        from: 220,
        to: 3200,
        sweep: 0.07,
        filter: { type: "bandpass", from: 1200, to: 5000, q: 3 },
        envelope: { attack: 0.005, decay: 0.09 },
        gain: 0.3,
      },
      { kind: "noise", delay: 0.06, filter: { type: "highpass", from: 2500, to: 900 }, envelope: { attack: 0.001, decay: 0.22 }, gain: 0.5 },
      { kind: "tone", wave: "sine", delay: 0.06, from: 95, to: 36, envelope: { attack: 0.002, decay: 0.35 }, gain: 0.7 },
    ],
  },
  emp: {
    gain: 0.6,
    priority: 1,
    layers: [
      { kind: "tone", wave: "square", from: 1400, to: 55, filter: { type: "bandpass", from: 2400, to: 300, q: 4 }, envelope: { attack: 0.004, decay: 0.75 }, gain: 0.3 },
      {
        kind: "tone",
        wave: "sawtooth",
        from: 1430,
        to: 58,
        detune: -15,
        filter: { type: "lowpass", from: 2000, to: 200 },
        envelope: { attack: 0.004, decay: 0.6 },
        gain: 0.18,
      },
      { kind: "noise", filter: { type: "bandpass", from: 1200, to: 180, q: 1.5 }, envelope: { attack: 0.01, decay: 0.7 }, gain: 0.4 },
    ],
  },
  flak: {
    gain: 0.6,
    vary: 0.08,
    layers: [
      { kind: "noise", filter: { type: "bandpass", from: 1400, to: 600, q: 1.5 }, envelope: { attack: 0.001, decay: 0.07 }, gain: 0.6 },
      { kind: "noise", delay: 0.05, filter: { type: "bandpass", from: 1100, to: 500, q: 1.5 }, envelope: { attack: 0.001, decay: 0.07 }, gain: 0.45 },
      { kind: "noise", delay: 0.11, filter: { type: "bandpass", from: 1600, to: 700, q: 1.5 }, envelope: { attack: 0.001, decay: 0.08 }, gain: 0.35 },
      { kind: "tone", wave: "sine", from: 130, to: 55, envelope: { attack: 0.002, decay: 0.1 }, gain: 0.4 },
    ],
  },
  dryFire: {
    gain: 0.4,
    minGap: 0.12,
    layers: [
      { kind: "noise", filter: { type: "highpass", from: 3200 }, envelope: { attack: 0.001, decay: 0.018 }, gain: 0.5 },
      { kind: "tone", wave: "square", from: 1900, to: 1500, filter: { type: "lowpass", from: 4000 }, envelope: { attack: 0.001, decay: 0.014 }, gain: 0.15 },
      { kind: "noise", delay: 0.045, filter: { type: "bandpass", from: 2400, q: 3 }, envelope: { attack: 0.001, decay: 0.015 }, gain: 0.3 },
    ],
  },
  backupShot: {
    gain: 0.4,
    vary: 0.06,
    layers: [
      { kind: "tone", wave: "triangle", from: 950, to: 380, envelope: { attack: 0.002, decay: 0.08 }, gain: 0.4 },
      { kind: "noise", filter: { type: "bandpass", from: 2200, q: 1 }, envelope: { attack: 0.001, decay: 0.03 }, gain: 0.15 },
    ],
  },
  hit: {
    gain: 0.6,
    vary: 0.1,
    layers: [
      { kind: "noise", filter: { type: "lowpass", from: 3000, to: 500 }, envelope: { attack: 0.001, decay: 0.09 }, gain: 0.6 },
      { kind: "tone", wave: "sine", from: 220, to: 90, envelope: { attack: 0.001, decay: 0.1 }, gain: 0.45 },
    ],
  },
  shieldHit: {
    gain: 0.5,
    vary: 0.06,
    layers: [
      { kind: "tone", wave: "triangle", from: 1100, to: 1500, envelope: { attack: 0.003, decay: 0.28 }, gain: 0.3 },
      { kind: "tone", wave: "sine", from: 1660, to: 2200, detune: 9, envelope: { attack: 0.003, decay: 0.22 }, gain: 0.2 },
      { kind: "noise", filter: { type: "bandpass", from: 4000, to: 2500, q: 2 }, envelope: { attack: 0.001, decay: 0.12 }, gain: 0.3 },
    ],
  },
  blocked: {
    gain: 0.5,
    vary: 0.04,
    layers: [
      { kind: "tone", wave: "triangle", from: 1560, envelope: { attack: 0.001, decay: 0.18 }, gain: 0.35 },
      // Half again as high and out of tune with it: struck metal rather than a note.
      { kind: "tone", wave: "sine", from: 2350, envelope: { attack: 0.001, decay: 0.12 }, gain: 0.2 },
      { kind: "noise", filter: { type: "highpass", from: 5000 }, envelope: { attack: 0.001, decay: 0.03 }, gain: 0.3 },
    ],
  },
  explosion: {
    gain: 0.9,
    vary: 0.08,
    priority: 1,
    layers: [
      { kind: "noise", filter: { type: "lowpass", from: 3200, to: 160 }, envelope: { attack: 0.004, decay: 0.95 }, gain: 0.8 },
      { kind: "tone", wave: "sine", from: 120, to: 32, envelope: { attack: 0.003, decay: 0.6 }, gain: 0.7 },
      { kind: "noise", source: "crackle", filter: { type: "highpass", from: 1500 }, envelope: { attack: 0.01, decay: 0.5 }, gain: 0.25 },
    ],
  },
  bigExplosion: {
    gain: 1,
    vary: 0.05,
    priority: 2,
    minGap: 0.2,
    layers: [
      { kind: "noise", filter: { type: "lowpass", from: 2400, to: 70 }, envelope: { attack: 0.006, decay: 2.2 }, gain: 0.9 },
      { kind: "tone", wave: "sine", from: 85, to: 24, envelope: { attack: 0.004, decay: 1.6 }, gain: 0.8 },
      { kind: "noise", source: "crackle", filter: { type: "bandpass", from: 2400, to: 900, q: 0.8 }, envelope: { attack: 0.02, decay: 1.2 }, gain: 0.35 },
      { kind: "tone", wave: "triangle", from: 55, to: 28, envelope: { attack: 0.01, decay: 1.2 }, gain: 0.3 },
    ],
  },
  coin: {
    gain: 0.45,
    minGap: 0.05,
    layers: [chime(988, 0, 0.07, "square", 0.25), chime(1319, 0.065, 0.32, "square", 0.25)],
  },
  core: {
    gain: 0.5,
    priority: 1,
    layers: [
      { kind: "tone", wave: "sine", from: 523, to: 1047, sweep: 0.18, envelope: { attack: 0.01, decay: 0.4 }, gain: 0.35 },
      { kind: "tone", wave: "triangle", from: 784, delay: 0.06, envelope: { attack: 0.005, decay: 0.45 }, gain: 0.2 },
      { kind: "tone", wave: "sine", from: 1568, delay: 0.12, detune: 6, envelope: { attack: 0.005, decay: 0.6 }, gain: 0.18 },
      { kind: "noise", filter: { type: "highpass", from: 6000 }, envelope: { attack: 0.05, decay: 0.3 }, gain: 0.08 },
    ],
  },
  boost: {
    gain: 0.55,
    layers: [
      { kind: "tone", wave: "sawtooth", from: 180, to: 1100, filter: { type: "lowpass", from: 800, to: 3500 }, envelope: { attack: 0.02, decay: 0.4 }, gain: 0.25 },
      { kind: "noise", filter: { type: "bandpass", from: 700, to: 4200, q: 1.4 }, envelope: { attack: 0.04, decay: 0.38 }, gain: 0.45 },
    ],
  },
  pickup: {
    gain: 0.45,
    vary: 0.04,
    minGap: 0.05,
    layers: [
      { kind: "tone", wave: "triangle", from: 660, to: 1000, sweep: 0.07, envelope: { attack: 0.002, decay: 0.13 }, gain: 0.4 },
      { kind: "tone", wave: "sine", from: 1320, delay: 0.04, envelope: { attack: 0.002, decay: 0.1 }, gain: 0.15 },
    ],
  },
  levelUp: {
    gain: 0.5,
    priority: 2,
    layers: [
      chime(523, 0, 0.18),
      chime(659, 0.09, 0.18),
      chime(784, 0.18, 0.18),
      chime(1047, 0.27, 0.7),
      { kind: "tone", wave: "sine", from: 2093, delay: 0.27, envelope: { attack: 0.01, decay: 0.8 }, gain: 0.1 },
    ],
  },
  enhanceSuccess: {
    gain: 0.5,
    priority: 2,
    layers: [
      chime(659, 0, 0.5, "triangle", 0.3),
      chime(831, 0.07, 0.5, "triangle", 0.26),
      chime(988, 0.14, 0.7, "triangle", 0.26),
      chime(1319, 0.21, 0.9, "square", 0.14),
      { kind: "noise", delay: 0.2, filter: { type: "highpass", from: 7000 }, envelope: { attack: 0.08, decay: 0.6 }, gain: 0.08 },
    ],
  },
  enhanceFail: {
    gain: 0.5,
    priority: 2,
    layers: [
      { kind: "tone", wave: "sawtooth", from: 392, filter: { type: "lowpass", from: 1400, to: 600 }, envelope: { attack: 0.005, decay: 0.25 }, gain: 0.28 },
      { kind: "tone", wave: "sawtooth", from: 311, delay: 0.2, filter: { type: "lowpass", from: 1200, to: 400 }, envelope: { attack: 0.005, decay: 0.55 }, gain: 0.28 },
      { kind: "noise", filter: { type: "lowpass", from: 600 }, envelope: { attack: 0.002, decay: 0.08 }, gain: 0.2 },
    ],
  },
  enhanceFall: {
    gain: 0.55,
    priority: 2,
    layers: [
      { kind: "tone", wave: "sawtooth", from: 660, to: 70, filter: { type: "lowpass", from: 2200, to: 250 }, envelope: { attack: 0.01, decay: 0.9 }, gain: 0.3 },
      {
        kind: "tone",
        wave: "square",
        from: 670,
        to: 72,
        detune: 14,
        filter: { type: "lowpass", from: 1400, to: 200 },
        envelope: { attack: 0.01, decay: 0.8 },
        gain: 0.14,
      },
      { kind: "noise", delay: 0.7, filter: { type: "lowpass", from: 900, to: 120 }, envelope: { attack: 0.002, decay: 0.3 }, gain: 0.4 },
      { kind: "tone", wave: "sine", delay: 0.7, from: 110, to: 40, envelope: { attack: 0.002, decay: 0.3 }, gain: 0.45 },
    ],
  },
  landing: {
    gain: 0.7,
    priority: 1,
    layers: [
      { kind: "tone", wave: "sine", from: 95, to: 38, envelope: { attack: 0.003, decay: 0.45 }, gain: 0.7 },
      { kind: "noise", filter: { type: "lowpass", from: 900, to: 150 }, envelope: { attack: 0.003, decay: 0.4 }, gain: 0.5 },
      // Dust settling after the thump.
      { kind: "noise", delay: 0.12, filter: { type: "bandpass", from: 500, q: 0.8 }, envelope: { attack: 0.05, decay: 0.6 }, gain: 0.15 },
    ],
  },
  takeoff: {
    gain: 0.7,
    priority: 1,
    layers: [
      { kind: "noise", filter: { type: "lowpass", from: 180, to: 1800 }, envelope: { attack: 0.35, decay: 1.2 }, gain: 0.7 },
      { kind: "tone", wave: "sawtooth", from: 55, to: 150, filter: { type: "lowpass", from: 300, to: 900 }, envelope: { attack: 0.3, decay: 1.1 }, gain: 0.25 },
    ],
  },
  splash: {
    gain: 0.7,
    priority: 1,
    layers: [
      { kind: "noise", filter: { type: "bandpass", from: 1800, to: 400, q: 0.8 }, envelope: { attack: 0.008, decay: 0.7 }, gain: 0.6 },
      { kind: "noise", filter: { type: "highpass", from: 5000, to: 2500 }, envelope: { attack: 0.004, decay: 0.35 }, gain: 0.3 },
      { kind: "tone", wave: "sine", from: 320, to: 80, envelope: { attack: 0.002, decay: 0.2 }, gain: 0.35 },
    ],
  },
  // Asked for every frame while the danger lasts, the long gap turns it into a soft beep every 0.6 s.
  warning: {
    gain: 0.35,
    minGap: 0.6,
    priority: 1,
    layers: [
      { kind: "tone", wave: "sine", from: 880, envelope: { attack: 0.01, decay: 0.12 }, gain: 0.4 },
      { kind: "tone", wave: "sine", from: 880, delay: 0.18, envelope: { attack: 0.01, decay: 0.12 }, gain: 0.3 },
    ],
  },
  alarm: {
    gain: 0.45,
    minGap: 0.8,
    priority: 2,
    layers: [held(880, 0, 0.12, "square", 0.22), held(660, 0.22, 0.12, "square", 0.22), held(880, 0.44, 0.12, "square", 0.22)],
  },
  click: {
    gain: 0.3,
    minGap: 0.02,
    layers: [
      { kind: "tone", wave: "triangle", from: 1400, to: 900, envelope: { attack: 0.001, decay: 0.025 }, gain: 0.4 },
      { kind: "noise", filter: { type: "highpass", from: 4000 }, envelope: { attack: 0.001, decay: 0.012 }, gain: 0.2 },
    ],
  },
  chest: {
    gain: 0.5,
    priority: 1,
    layers: [
      // The lid's creak, then its thump, then what is inside.
      { kind: "tone", wave: "sawtooth", from: 180, to: 320, filter: { type: "bandpass", from: 600, to: 1100, q: 6 }, envelope: { attack: 0.04, decay: 0.3 }, gain: 0.2 },
      { kind: "noise", delay: 0.28, filter: { type: "lowpass", from: 700 }, envelope: { attack: 0.002, decay: 0.08 }, gain: 0.35 },
      chime(1047, 0.32, 0.3, "triangle", 0.2),
      chime(1319, 0.4, 0.3, "triangle", 0.2),
      chime(1568, 0.48, 0.6, "triangle", 0.2),
    ],
  },
  achievement: {
    gain: 0.55,
    priority: 2,
    layers: [chime(392, 0, 0.14), chime(523, 0.1, 0.14), chime(659, 0.2, 0.14), held(784, 0.3, 0.35, "square", 0.22), held(523, 0.3, 0.35, "triangle", 0.2)],
  },
  dock: {
    gain: 0.55,
    priority: 1,
    layers: [
      // Two clamps, then a beep to say the ship is held.
      { kind: "noise", filter: { type: "bandpass", from: 900, q: 2 }, envelope: { attack: 0.001, decay: 0.1 }, gain: 0.5 },
      { kind: "tone", wave: "square", from: 200, to: 140, filter: { type: "lowpass", from: 900 }, envelope: { attack: 0.001, decay: 0.08 }, gain: 0.25 },
      { kind: "noise", delay: 0.14, filter: { type: "bandpass", from: 700, q: 2 }, envelope: { attack: 0.001, decay: 0.12 }, gain: 0.45 },
      { kind: "tone", wave: "sine", from: 880, delay: 0.32, envelope: { attack: 0.005, decay: 0.25 }, gain: 0.2 },
    ],
  },
  perk: {
    gain: 0.5,
    priority: 1,
    layers: [
      chime(1175, 0, 0.25, "sine", 0.3),
      chime(1568, 0.06, 0.35, "sine", 0.25),
      chime(2349, 0.12, 0.5, "sine", 0.15),
      { kind: "tone", wave: "triangle", from: 587, envelope: { attack: 0.02, decay: 0.5 }, gain: 0.15 },
    ],
  },
  star: {
    gain: 0.45,
    vary: 0.03,
    layers: [
      { kind: "tone", wave: "sine", from: 1568, to: 2093, sweep: 0.05, envelope: { attack: 0.002, decay: 0.35 }, gain: 0.3 },
      { kind: "tone", wave: "sine", from: 2637, delay: 0.07, envelope: { attack: 0.002, decay: 0.45 }, gain: 0.2 },
      { kind: "tone", wave: "triangle", from: 3136, delay: 0.14, detune: 8, envelope: { attack: 0.002, decay: 0.3 }, gain: 0.08 },
    ],
  },
  streak: {
    gain: 0.45,
    layers: [chime(660, 0, 0.06), chime(880, 0.05, 0.06), chime(1320, 0.1, 0.2)],
  },
  gate: {
    gain: 0.6,
    priority: 2,
    layers: [
      { kind: "tone", wave: "sine", from: 200, to: 820, envelope: { attack: 0.12, decay: 0.75 }, gain: 0.35 },
      { kind: "tone", wave: "triangle", from: 400, to: 1640, detune: 10, envelope: { attack: 0.12, decay: 0.7 }, gain: 0.15 },
      { kind: "noise", filter: { type: "bandpass", from: 500, to: 3200, q: 1.6 }, envelope: { attack: 0.15, decay: 0.7 }, gain: 0.4 },
    ],
  },
  // The crossing of a black hole: a rising rush of air over a falling sub drone, swelling and dying away over
  // three and a half seconds.
  warp: {
    gain: 0.75,
    priority: 2,
    minGap: 1,
    layers: [
      {
        kind: "noise",
        sweep: 2.4,
        filter: { type: "bandpass", from: 160, to: 2800, q: 1.4 },
        envelope: { attack: 1.1, decay: 0.4, sustain: 0.8, hold: 0.6, release: 1.4 },
        gain: 0.7,
      },
      { kind: "tone", wave: "sine", from: 70, to: 28, envelope: { attack: 0.6, decay: 0.5, sustain: 0.7, hold: 0.9, release: 1.5 }, gain: 0.6 },
      {
        kind: "tone",
        wave: "sawtooth",
        from: 90,
        to: 720,
        sweep: 2.4,
        filter: { type: "lowpass", from: 300, to: 1600 },
        envelope: { attack: 1, decay: 0.4, sustain: 0.6, hold: 0.6, release: 1.3 },
        gain: 0.15,
      },
      {
        kind: "tone",
        wave: "sawtooth",
        from: 91,
        to: 735,
        sweep: 2.4,
        detune: 18,
        filter: { type: "lowpass", from: 300, to: 1600 },
        envelope: { attack: 1, decay: 0.4, sustain: 0.6, hold: 0.6, release: 1.3 },
        gain: 0.12,
      },
    ],
  },
};

// Every cue, for a host or a test that goes through them all.
export const SOUND_CUES: readonly SoundCue[] = Object.keys(CUES).filter((key): key is SoundCue => key in CUES);
