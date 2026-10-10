import { AudioParamLike, Envelope } from "../domain/types";
import { envelopeMarks, SILENCE } from "../utils/envelope";

// How many time constants a glide is given to arrive: after five it is within a hundredth of a percent of the way.
const SETTLE_CONSTANTS = 5;

// Schedules an envelope on a gain from `start`, peaking at `peak`; returns when it falls silent. The shape is the
// one `envelopeLevel` describes, so the maths and the sound agree.
export const scheduleEnvelope = (param: AudioParamLike, envelope: Envelope, start: number, peak: number, hold?: number): number => {
  const marks = envelopeMarks(envelope, hold);
  const top = Math.max(peak, SILENCE);

  param.setValueAtTime(0, start);
  param.linearRampToValueAtTime(top, start + marks.peak);

  if (marks.sustain > 0) {
    param.exponentialRampToValueAtTime(top * marks.sustain, start + marks.decayed);
    param.setValueAtTime(top * marks.sustain, start + marks.released);
  }

  param.exponentialRampToValueAtTime(top * SILENCE, start + marks.silent);
  param.setValueAtTime(0, start + marks.silent);

  return start + marks.silent;
};

// A pitch or cutoff gliding from one frequency to another (exponentially, as the ear hears pitch) over `seconds`;
// held still when there is nowhere to go.
export const sweep = (param: AudioParamLike, from: number, to: number | undefined, start: number, seconds: number): void => {
  param.setValueAtTime(Math.max(1, from), start);

  if (to !== undefined && to !== from) {
    param.exponentialRampToValueAtTime(Math.max(1, to), start + Math.max(0.001, seconds));
  }
};

// A value easing towards a target from wherever it is now, settling in about `seconds`. Anything still scheduled
// from now on is cancelled first, so a value set every frame never piles up ramps. Not for a value first set at
// this same moment: the cancel would take that away too, and the glide would start from the node's default.
export const glideTo = (param: AudioParamLike, target: number, now: number, seconds: number): void => {
  param.cancelScheduledValues(now);
  param.setTargetAtTime(target, now, Math.max(0.001, seconds / SETTLE_CONSTANTS));
};

// A value rising from nothing at `start` to `target`, settling in about `seconds`. An easing rather than a ramp,
// so a fade out begun before it finishes carries on from wherever it had got to instead of jumping.
export const fadeIn = (param: AudioParamLike, target: number, start: number, seconds: number): void => {
  param.setValueAtTime(0, start);
  param.setTargetAtTime(target, start, Math.max(0.001, seconds / SETTLE_CONSTANTS));
};
