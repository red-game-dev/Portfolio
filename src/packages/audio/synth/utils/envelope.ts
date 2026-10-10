import { Envelope } from "../domain/types";

// The quietest level an exponential fall reaches before it is cut to nothing, as a share of the peak (-80 dB).
// An exponential ramp can never reach 0 itself.
export const SILENCE = 0.0001;

// A rise this short is heard as an attack, not a click.
export const DEFAULT_ATTACK = 0.005;

// A held note with no release of its own still lets go over this long, so it does not click off.
export const DEFAULT_RELEASE = 0.05;

const attackOf = (envelope: Envelope) => Math.max(0.001, envelope.attack ?? DEFAULT_ATTACK);

const sustainOf = (envelope: Envelope) => Math.max(0, Math.min(1, envelope.sustain ?? 0));

const releaseOf = (envelope: Envelope) => Math.max(0.001, envelope.release ?? DEFAULT_RELEASE);

// An exponential fall from `from` to `to` (both above 0), `progress` of the way through.
const fall = (from: number, to: number, progress: number) => from * (to / from) ** progress;

// How long a sound with this envelope lasts, from the start of its attack to silence. `hold` stands in for the
// envelope's own, as a note's length does in the music.
export const envelopeLength = (envelope: Envelope, hold = envelope.hold ?? 0): number => {
  const rise = attackOf(envelope) + Math.max(0, envelope.decay);

  return sustainOf(envelope) > 0 ? rise + Math.max(0, hold) + releaseOf(envelope) : rise;
};

// The level `time` seconds into the envelope, as a share of its peak: exactly what the engine schedules on the
// gain (a linear rise, exponential falls), so a test can say what is heard when.
export const envelopeLevel = (envelope: Envelope, time: number, hold = envelope.hold ?? 0): number => {
  const attack = attackOf(envelope);
  const decay = Math.max(0, envelope.decay);
  const sustain = sustainOf(envelope);

  if (time < 0 || time >= envelopeLength(envelope, hold)) {
    return 0;
  }

  if (time < attack) {
    return time / attack;
  }

  const floor = sustain > 0 ? sustain : SILENCE;

  if (time < attack + decay) {
    return fall(1, floor, (time - attack) / decay);
  }

  const releaseAt = attack + decay + Math.max(0, hold);

  return time < releaseAt ? sustain : fall(sustain, SILENCE, (time - releaseAt) / releaseOf(envelope));
};

// The times an envelope's segments end, from its start: the peak, the end of the decay, the start of the release
// and silence. The engine schedules its ramps at these.
export const envelopeMarks = (envelope: Envelope, hold = envelope.hold ?? 0) => {
  const peak = attackOf(envelope);
  const decayed = peak + Math.max(0, envelope.decay);
  const released = sustainOf(envelope) > 0 ? decayed + Math.max(0, hold) : decayed;

  return { peak, decayed, released, silent: envelopeLength(envelope, hold), sustain: sustainOf(envelope) };
};
