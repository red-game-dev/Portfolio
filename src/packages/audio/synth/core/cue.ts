import { clamp } from "@/packages/math/clamp";
import { RandomSource } from "@/packages/math/random";

import { AudioContextLike, AudioNodeLike, CueLayer, CueRecipe, GainNodeLike, ScheduledSourceLike, VoiceTiming } from "../domain/types";
import { scheduleEnvelope, sweep } from "./automation";
import { NoiseBank } from "./NoiseBank";

// Where a sound plays and what it is cut from.
export interface SoundTarget {
  context: AudioContextLike;
  destination: AudioNodeLike;
  noise: NoiseBank;
  random: RandomSource;
}

// How loud a cue plays (a share of its own level), at what multiple of its pitch, and where between the speakers.
export interface CueShape {
  level: number;
  pitch: number;
  pan: number;
}

// A cue in play: what the voice cap weighs it by, and the nodes to let go of once it is over.
export interface Voice extends VoiceTiming {
  output: GainNodeLike;
  nodes: AudioNodeLike[];
  sources: ScheduledSourceLike[];
  // The latest any of its layers starts, so stopping it early never asks a source to stop before it began.
  lastStart: number;
  isDone: boolean;
}

// Sources stop a moment after their envelopes reach silence, so nothing is cut while it can still be heard.
export const TAIL_SECONDS = 0.02;
// A voice let go early fades over this long rather than clicking off.
const DROP_SECONDS = 0.04;

// One layer of a cue: its source (an oscillator or a loop of noise), an optional filter and its envelope, joined
// to `output` and started at `start`. Returns when it falls silent.
const playLayer = (target: SoundTarget, layer: CueLayer, start: number, pitch: number, output: AudioNodeLike, voice: Voice): number => {
  const { context } = target;
  const nyquist = context.sampleRate / 2;
  const envelope = context.createGain();
  const end = scheduleEnvelope(envelope.gain, layer.envelope, start, layer.gain);
  const seconds = layer.sweep ?? end - start;
  let source: ScheduledSourceLike;

  if (layer.kind === "tone") {
    const oscillator = context.createOscillator();

    oscillator.type = layer.wave;
    sweep(oscillator.frequency, Math.min(nyquist, layer.from * pitch), layer.to === undefined ? undefined : Math.min(nyquist, layer.to * pitch), start, seconds);

    if (layer.detune) {
      oscillator.detune.setValueAtTime(layer.detune, start);
    }

    oscillator.start(start);
    source = oscillator;
  } else {
    const noise = context.createBufferSource();
    const buffer = target.noise.get(layer.source ?? "white");

    noise.buffer = buffer;
    noise.loop = true;
    noise.playbackRate.setValueAtTime((layer.rate ?? 1) * pitch, start);
    noise.start(start, target.random() * buffer.duration);
    source = noise;
  }

  source.stop(end + TAIL_SECONDS);

  if (layer.filter) {
    const filter = context.createBiquadFilter();
    const { type, from, to, q } = layer.filter;

    filter.type = type;

    if (q !== undefined) {
      filter.Q.setValueAtTime(q, start);
    }

    sweep(filter.frequency, Math.min(nyquist, from * pitch), to === undefined ? undefined : Math.min(nyquist, to * pitch), start, seconds);
    source.connect(filter);
    filter.connect(envelope);
    voice.nodes.push(filter);
  } else {
    source.connect(envelope);
  }

  envelope.connect(output);
  voice.nodes.push(source, envelope);
  voice.sources.push(source);
  voice.lastStart = Math.max(voice.lastStart, start);

  return end;
};

// Plays a cue's layers through one output gain (and a panner where the browser has one) into the target, from
// `start`. Every source is told when to stop before it starts, so the cue ends by itself; `onDone` hears when the
// last of them has.
export const playCue = (target: SoundTarget, recipe: CueRecipe, start: number, shape: CueShape, onDone: (voice: Voice) => void): Voice => {
  const { context } = target;
  const output = context.createGain();
  const voice: Voice = { priority: recipe.priority ?? 1, startedAt: start, endsAt: start, output, nodes: [output], sources: [], lastStart: start, isDone: false };
  const panner = shape.pan !== 0 && context.createStereoPanner ? context.createStereoPanner() : null;
  let last: ScheduledSourceLike | null = null;

  output.gain.value = Math.max(0, shape.level) * (recipe.gain ?? 1);

  if (panner) {
    panner.pan.value = clamp(shape.pan, -1, 1);
    output.connect(panner);
    panner.connect(target.destination);
    voice.nodes.push(panner);
  } else {
    output.connect(target.destination);
  }

  for (const layer of recipe.layers) {
    const end = playLayer(target, layer, start + (layer.delay ?? 0), shape.pitch, output, voice);

    if (end >= voice.endsAt) {
      voice.endsAt = end;
      last = voice.sources[voice.sources.length - 1];
    }
  }

  if (last === null) {
    onDone(voice);
  } else {
    last.onended = () => onDone(voice);
  }

  return voice;
};

// Lets go of a finished voice's nodes, once.
export const releaseVoice = (voice: Voice): void => {
  if (voice.isDone) {
    return;
  }

  voice.isDone = true;
  voice.sources.forEach((source) => {
    source.onended = null;
  });
  voice.nodes.forEach((node) => node.disconnect());
};

// Cuts a voice short: a quick fade, then every source stops, and its own ending lets the nodes go.
export const silenceVoice = (voice: Voice, now: number): void => {
  const stopAt = Math.max(now + DROP_SECONDS, voice.lastStart + 0.001);

  voice.output.gain.cancelScheduledValues(now);
  voice.output.gain.setTargetAtTime(0, now, DROP_SECONDS / 5);
  voice.endsAt = stopAt;
  voice.sources.forEach((source) => {
    try {
      source.stop(stopAt);
    } catch {
      // An older browser refuses a second stop; the first still ends the source.
    }
  });
};
