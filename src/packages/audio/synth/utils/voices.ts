import { clamp01 } from "@/packages/math/clamp";

import { VoiceTiming } from "../domain/types";

// Which voice gives way for a new one when `max` already sound: -1 while there is room. A voice whose sound is
// already over goes first; otherwise the lowest priority, and the oldest among equals, so a burst of gunfire
// cuts its own earliest shots rather than a level up's fanfare.
export const voiceToDrop = (voices: readonly VoiceTiming[], max: number, now: number): number => {
  if (voices.length < max) {
    return -1;
  }

  let chosen = -1;

  for (let index = 0; index < voices.length; index += 1) {
    const voice = voices[index];

    if (voice.endsAt <= now) {
      return index;
    }

    const best = chosen === -1 ? null : voices[chosen];

    if (best === null || voice.priority < best.priority || (voice.priority === best.priority && voice.startedAt < best.startedAt)) {
      chosen = index;
    }
  }

  return chosen;
};

// Whether a cue asked for again at `now` comes too soon after it last started to be worth another voice.
export const isTooSoon = (lastStartedAt: number | undefined, now: number, minGap: number): boolean => lastStartedAt !== undefined && now - lastStartedAt < minGap;

// A volume slider's value (0 to 1) as a gain. Squared, so halfway sounds about half as loud rather than barely
// quieter, the way ears hear it.
export const volumeGain = (value: number): number => clamp01(value) ** 2;
