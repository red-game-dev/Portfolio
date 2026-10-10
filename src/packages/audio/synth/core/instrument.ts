import { AudioContextLike, AudioNodeLike, Instrument, OscillatorLike, Wave } from "../domain/types";
import { envelopeMarks } from "../utils/envelope";
import { centsToRatio, midiToHz } from "../utils/pitch";
import { scheduleEnvelope } from "./automation";
import { TAIL_SECONDS } from "./cue";

// The shortest a slide into a note takes, however sharp its attack.
const MIN_GLIDE_SECONDS = 0.02;

const oscillator = (context: AudioContextLike, wave: Wave, frequency: number, start: number, glide: number, glideSeconds: number): OscillatorLike => {
  const node = context.createOscillator();

  node.type = wave;

  if (glide === 0) {
    node.frequency.setValueAtTime(frequency, start);
  } else {
    node.frequency.setValueAtTime(frequency * centsToRatio(glide), start);
    node.frequency.exponentialRampToValueAtTime(frequency, start + Math.max(MIN_GLIDE_SECONDS, glideSeconds));
  }

  node.start(start);

  return node;
};

// Plays one note of the score: one oscillator, or two a few cents apart for width, and an overtone where the
// instrument rings, through an optional lowpass and the instrument's envelope held for `seconds`. Its nodes let
// themselves go once it ends. Returns when it falls silent.
export const playNote = (
  context: AudioContextLike,
  instrument: Instrument,
  midi: number,
  start: number,
  seconds: number,
  velocity: number,
  destination: AudioNodeLike,
): number => {
  const nyquist = context.sampleRate / 2;
  const frequency = Math.min(nyquist, midiToHz(midi + 12 * instrument.octave));
  const marks = envelopeMarks(instrument.envelope, 0);
  const voices = instrument.unison ? 2 : 1;
  const envelope = context.createGain();
  const end = scheduleEnvelope(envelope.gain, instrument.envelope, start, (instrument.gain * velocity) / voices, Math.max(0, seconds - marks.decayed));
  const glide = instrument.glide ?? 0;
  const nodes: AudioNodeLike[] = [envelope];
  const sources: OscillatorLike[] = [];
  let input: AudioNodeLike = envelope;

  if (instrument.cutoff !== undefined && instrument.cutoff > 0) {
    const filter = context.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(nyquist, instrument.cutoff), start);

    if (instrument.q !== undefined) {
      filter.Q.setValueAtTime(instrument.q, start);
    }

    filter.connect(envelope);
    nodes.push(filter);
    input = filter;
  }

  sources.push(oscillator(context, instrument.wave, frequency, start, glide, marks.peak));

  if (instrument.unison) {
    const twin = oscillator(context, instrument.wave, frequency, start, glide, marks.peak);

    twin.detune.setValueAtTime(instrument.unison, start);
    sources.push(twin);
  }

  sources.forEach((source) => {
    source.connect(input);
    source.stop(end + TAIL_SECONDS);
    nodes.push(source);
  });

  if (instrument.partial && frequency * instrument.partial.ratio < nyquist) {
    const overtone = oscillator(context, "sine", frequency * instrument.partial.ratio, start, glide, marks.peak);
    const level = context.createGain();

    level.gain.value = instrument.partial.gain;
    overtone.connect(level);
    level.connect(input);
    overtone.stop(end + TAIL_SECONDS);
    nodes.push(overtone, level);
  }

  envelope.connect(destination);
  sources[0].onended = () => nodes.forEach((node) => node.disconnect());

  return end;
};
