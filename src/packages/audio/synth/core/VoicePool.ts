import { voiceToDrop } from "../utils/voices";
import { releaseVoice, silenceVoice, Voice } from "./cue";

// The one-shot sounds in play, never more than `max`: a new one past the cap cuts the voice `voiceToDrop` picks,
// and each lets go of its nodes when its last source ends.
export class VoicePool {
  private readonly voices: Voice[] = [];
  private readonly max: number;

  constructor(max: number) {
    this.max = Math.max(1, Math.floor(max));
  }

  public get size(): number {
    return this.voices.length;
  }

  public add(voice: Voice, now: number): void {
    const index = voiceToDrop(this.voices, this.max, now);

    if (index >= 0) {
      silenceVoice(this.voices[index], now);
      this.voices.splice(index, 1);
    }

    this.voices.push(voice);
  }

  // Every voice cut at once, as when the engine is disposed.
  public clear(): void {
    this.voices.forEach(releaseVoice);
    this.voices.length = 0;
  }

  // An arrow property, so each voice can be handed it as the call for when it ends.
  public readonly finish = (voice: Voice): void => {
    const index = this.voices.indexOf(voice);

    if (index >= 0) {
      this.voices.splice(index, 1);
    }

    releaseVoice(voice);
  };
}
