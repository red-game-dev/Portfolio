// The parts of the Web Audio API the engine uses, and nothing more. A browser's AudioContext and its nodes fit
// these as they are, and so does a fake that records what was asked of it, so the engine can be tested where
// there is no sound at all.
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, startTime: number): unknown;
  linearRampToValueAtTime(value: number, endTime: number): unknown;
  exponentialRampToValueAtTime(value: number, endTime: number): unknown;
  setTargetAtTime(target: number, startTime: number, timeConstant: number): unknown;
  cancelScheduledValues(cancelTime: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike | AudioParamLike): unknown;
  disconnect(): void;
}

export interface GainNodeLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface BiquadFilterLike extends AudioNodeLike {
  type: BiquadFilterType;
  readonly frequency: AudioParamLike;
  readonly Q: AudioParamLike;
}

export interface StereoPannerLike extends AudioNodeLike {
  readonly pan: AudioParamLike;
}

export interface DelayLike extends AudioNodeLike {
  readonly delayTime: AudioParamLike;
}

export interface CompressorLike extends AudioNodeLike {
  readonly threshold: AudioParamLike;
  readonly knee: AudioParamLike;
  readonly ratio: AudioParamLike;
  readonly attack: AudioParamLike;
  readonly release: AudioParamLike;
}

// Something that starts and stops on the context's clock, and says when it has stopped.
export interface ScheduledSourceLike extends AudioNodeLike {
  onended: ((event: Event) => void) | null;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface OscillatorLike extends ScheduledSourceLike {
  type: OscillatorType;
  readonly frequency: AudioParamLike;
  readonly detune: AudioParamLike;
}

export interface AudioBufferLike {
  readonly duration: number;
  getChannelData(channel: number): Float32Array;
}

export interface BufferSourceLike extends ScheduledSourceLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
  readonly playbackRate: AudioParamLike;
  start(when?: number, offset?: number): void;
}

export interface AudioContextLike {
  readonly currentTime: number;
  readonly sampleRate: number;
  // "suspended" until a gesture resumes it, then "running"; "closed" once closed.
  readonly state: string;
  readonly destination: AudioNodeLike;
  createGain(): GainNodeLike;
  createOscillator(): OscillatorLike;
  createBiquadFilter(): BiquadFilterLike;
  createBufferSource(): BufferSourceLike;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBufferLike;
  createDelay(maxDelayTime?: number): DelayLike;
  createDynamicsCompressor(): CompressorLike;
  // Missing from older Safari, where sounds play centred.
  createStereoPanner?(): StereoPannerLike;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
}

// Makes the context the engine plays through, or null where there is none.
export type AudioContextFactory = () => AudioContextLike | null;

// The three volumes a player can set: everything, the sound effects and the music.
export type VolumeChannel = "master" | "sfx" | "music";

export type Wave = "sine" | "square" | "sawtooth" | "triangle";

export type FilterKind = "lowpass" | "highpass" | "bandpass";

// The noise a layer is cut from: white noise for air, blasts and hiss, or sparse clicks for a crackle.
export type NoiseKind = "white" | "crackle";

// The shape of a sound's level over time: a straight rise to the peak, an exponential fall to the sustain level,
// held, then an exponential fall to silence. A percussive sound has no sustain and is over once it decays.
export interface Envelope {
  // Seconds from silence to the peak (a few milliseconds when left out, so nothing clicks).
  attack?: number;
  // Seconds from the peak down to the sustain level, or to silence when there is no sustain.
  decay: number;
  // The level held after the decay, as a share of the peak.
  sustain?: number;
  // Seconds the sustain level is held. A note's own length sets it in the music.
  hold?: number;
  // Seconds from the sustain level to silence.
  release?: number;
}

// A filter whose cutoff sweeps from one frequency to another (exponentially) as the layer sounds.
export interface FilterSweep {
  type: FilterKind;
  from: number;
  to?: number;
  q?: number;
}

interface LayerBase {
  envelope: Envelope;
  // The layer's peak level.
  gain: number;
  // Seconds after the cue starts that this layer starts, for the notes of a jingle or a second blast.
  delay?: number;
  filter?: FilterSweep;
  // Seconds a sweep takes; the whole layer when left out.
  sweep?: number;
}

// An oscillator gliding from one pitch to another.
export interface ToneLayer extends LayerBase {
  kind: "tone";
  wave: Wave;
  // Hz at the start, and where it glides to.
  from: number;
  to?: number;
  // Cents off true, for a second layer that beats against the first.
  detune?: number;
}

// Noise shaped by a filter.
export interface NoiseLayer extends LayerBase {
  kind: "noise";
  source?: NoiseKind;
  // How fast the noise plays: below 1 is darker and slower, above 1 brighter and faster.
  rate?: number;
}

export type CueLayer = ToneLayer | NoiseLayer;

// One sound effect as data: a few layers that start together (or a little apart) and fall silent on their own.
export interface CueRecipe {
  layers: readonly CueLayer[];
  // The whole cue's level.
  gain?: number;
  // How far each play may stray in pitch, as a share either way, so a gun fired again does not sound stamped out.
  vary?: number;
  // Which voice gives way when too many sound at once: the lowest priority first, the oldest among equals.
  priority?: number;
  // The same cue asked for again sooner than this (seconds) is let go, so a burst of fire does not pile up voices.
  // A long gap makes a cue asked for every frame repeat at that pace, as a warning beep does.
  minGap?: number;
}

export type SoundCue =
  | "cannon"
  | "laser"
  | "missile"
  | "mine"
  | "railgun"
  | "emp"
  | "flak"
  | "dryFire"
  | "backupShot"
  | "hit"
  | "shieldHit"
  | "blocked"
  | "explosion"
  | "bigExplosion"
  | "coin"
  | "core"
  | "boost"
  | "pickup"
  | "levelUp"
  | "enhanceSuccess"
  | "enhanceFail"
  | "enhanceFall"
  | "landing"
  | "takeoff"
  | "splash"
  | "warning"
  | "alarm"
  | "click"
  | "chest"
  | "achievement"
  | "dock"
  | "perk"
  | "star"
  | "streak"
  | "gate"
  | "warp";

export interface PlayOptions {
  // A share of the cue's own level, 0 to 1.
  volume?: number;
  // A multiple of the cue's pitch: 2 is an octave up, 0.5 an octave down.
  pitch?: number;
  // Where it sits between the left speaker (-1) and the right (1).
  pan?: number;
}

// A continuous sound: oscillators and noise through one filter, whose cutoff, level and pitch follow how hard the
// thing making it is working.
export interface LoopRecipe {
  tones: ReadonlyArray<{ wave: Wave; frequency: number; gain: number; detune?: number }>;
  noise?: { source: NoiseKind; gain: number; rate?: number };
  // The cutoff (Hz) at no intensity and at full.
  filter: { type: FilterKind; from: number; to: number; q?: number };
  // The level at no intensity and at full.
  level: { from: number; to: number };
  // How far the pitch rises at full intensity, as a multiple.
  rise?: number;
  // A slow wobble of the cutoff: how fast (Hz) and how far (Hz).
  lfo?: { rate: number; depth: number };
}

export type LoopId = "engine" | "ionEngine" | "heat" | "beam";

export interface LoopParams {
  // How hard it works, 0 to 1: an engine's thrust, how close the hull is to melting.
  intensity?: number;
  // A multiple of its pitch.
  pitch?: number;
}

// A continuous sound in play. Setting it every frame is cheap: changes too small to hear are skipped.
export interface LoopHandle {
  readonly isStopped: boolean;
  set(params: LoopParams): void;
  stop(): void;
}

export type ModeName =
  | "major"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "minor"
  | "locrian"
  | "harmonicMinor"
  | "majorPentatonic"
  | "minorPentatonic";

// How one part of the score sounds.
export interface Instrument {
  wave: Wave;
  // Octaves above (or below) the theme's root.
  octave: number;
  envelope: Envelope;
  // The peak level of one note.
  gain: number;
  // A lowpass cutoff (Hz) and its resonance; unfiltered when left out.
  cutoff?: number;
  q?: number;
  // A second oscillator this many cents sharp, for width.
  unison?: number;
  // An overtone at this multiple of the note and this share of its level, for bells and glass.
  partial?: { ratio: number; gain: number };
  // Cents each note slides from as it starts, over its attack: below 0 rises into the note, like a whale's call.
  glide?: number;
}

// A melody that wanders the scale, landing on the chord on the beat.
export interface LeadPart {
  instrument: Instrument;
  // The chance a step starts a note (a little more on the beat, less off it).
  density: number;
  // How many steps a note may last, one picked for each note.
  lengths: readonly number[];
  // The widest move between two notes, in steps of the scale.
  leap: number;
  // The chance a whole bar rests.
  rest: number;
  // The music intensity from which it plays.
  from: number;
}

// The chord's notes one at a time.
export interface ArpPart {
  instrument: Instrument;
  // Steps between notes.
  every: number;
  pattern: "up" | "down" | "bounce" | "random";
  // How many octaves a run climbs.
  octaves: number;
  from: number;
}

// A driving bass line. One character a step: "x" plays the chord's root, "o" its fifth, anything else rests.
export interface PulsePart {
  instrument: Instrument;
  pattern: string;
  from: number;
}

// Light percussion. One character a step for each drum: "x" plays, anything else rests.
export interface DrumPart {
  kick: string;
  snare: string;
  hat: string;
  from: number;
}

export type DrumId = "kick" | "snare" | "hat";

// One theme of the score: its key, pace and character as data. Chords follow the progressions in turn, each
// lasting `barsPerChord` bars, and every part above them is drawn afresh each bar from a seeded random source.
export interface MusicTheme {
  // The tonic as a MIDI note, in the register the chords sit in.
  root: number;
  mode: ModeName;
  // Beats a minute.
  tempo: number;
  // How finely a beat divides: 2 for eighths, 4 for sixteenths.
  stepsPerBeat: number;
  beatsPerBar: number;
  barsPerChord: number;
  // Chords as degrees of the scale, 0 the tonic, played in turn and then round again.
  progressions: ReadonlyArray<readonly number[]>;
  // Whether chords take their seventh.
  sevenths: boolean;
  pad: Instrument | null;
  bass: Instrument | null;
  lead: LeadPart | null;
  arp: ArpPart | null;
  pulse: PulsePart | null;
  drums: DrumPart | null;
  // An echo that repeats every so many beats, fed back by `feedback` and mixed in at `mix`.
  echo: { beats: number; feedback: number; mix: number } | null;
  // The theme's overall level.
  level: number;
}

export type MusicThemeId =
  | "solar"
  | "matrix"
  | "neural"
  | "blocks"
  | "chips"
  | "pixels"
  | "nebula"
  | "void"
  | "crystal"
  | "ember"
  | "abyss"
  | "boss"
  | "menu";

export type ScorePart = "pad" | "bass" | "lead" | "arp" | "pulse" | DrumId;

// One note the score asks for, placed within its bar.
export interface NoteEvent {
  part: ScorePart;
  // The step of the bar it starts on, and how many steps it lasts.
  step: number;
  steps: number;
  // A MIDI note before the instrument's octave (unused by drums).
  midi: number;
  // How hard it is struck, 0 to 1.
  velocity: number;
  // The music intensity from which it sounds: 0 always, higher for the layers a fight adds.
  from: number;
}

// One bar of the score: its chord and every note in it, in the order they start.
export interface BarScore {
  bar: number;
  degree: number;
  chord: readonly number[];
  events: readonly NoteEvent[];
}

// What the voice cap needs to know of a sound in play.
export interface VoiceTiming {
  priority: number;
  startedAt: number;
  endsAt: number;
}
