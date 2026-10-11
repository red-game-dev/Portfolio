import { FrameScheduler } from "@/packages/animation/frame-loop";
import { clamp01 } from "@/packages/math/clamp";
import { RandomSource } from "@/packages/math/random";

import { AudioContextLike, AudioNodeLike, CueRecipe, DrumId, MusicTheme, MusicThemeId } from "../domain/types";
import { NoiseBank } from "./NoiseBank";
import { Score } from "./Score";

export interface MusicDirectorOptions {
  // The timer that tops up the score. Its callbacks may come late; the notes never do.
  scheduler: FrameScheduler;
  random: RandomSource;
  themes: Readonly<Record<MusicThemeId, MusicTheme>>;
  drums: Readonly<Record<DrumId, CueRecipe>>;
  lookaheadSeconds: number;
  crossfadeSeconds: number;
}

interface MusicStage {
  context: AudioContextLike;
  destination: AudioNodeLike;
  noise: NoiseBank;
}

// A new theme's first step comes this long after it is asked for, so its first notes are never already late.
const START_DELAY_SECONDS = 0.05;
// A third theme asked for while two already sound hurries the oldest out over this long.
const HURRY_SECONDS = 0.15;

// Keeps the music playing: one score per theme that sounds, crossfading from the old to the new, and a timer
// that every `tickMs` schedules the next notes up to `lookaheadSeconds` ahead on the audio clock (the timer may
// be late; the notes are placed on a clock that never is). The timer runs only while a score sounds and the
// host lets it.
export class MusicDirector {
  private readonly options: MusicDirectorOptions;
  private readonly scores: Score[] = [];
  private stage: MusicStage | null = null;
  private wanted: MusicThemeId | null = null;
  private intensity = 0;
  private isRunning = false;
  private handle: number | null = null;

  constructor(options: MusicDirectorOptions) {
    this.options = options;
  }

  // The theme playing or on its way in; null for silence.
  public get theme(): MusicThemeId | null {
    return this.wanted;
  }

  public attach(context: AudioContextLike, destination: AudioNodeLike, noise: NoiseBank): void {
    this.stage = { context, destination, noise };
  }

  public play(theme: MusicThemeId | null): void {
    this.wanted = theme;

    if (this.isRunning) {
      this.follow();
    }
  }

  public setIntensity(value: number): void {
    this.intensity = clamp01(value);
  }

  // The context is running: catch up with the theme wanted and keep the score topped up.
  public start(): void {
    this.isRunning = true;
    this.follow();
  }

  // The host holds the sound still: the timer stops, and the scores wait where they are.
  public stop(): void {
    this.isRunning = false;
    this.cancel();
  }

  public dispose(): void {
    this.stop();
    this.scores.forEach((score) => score.dispose());
    this.scores.length = 0;
    this.stage = null;
  }

  // Brings what sounds into line with what is wanted: the score playing fades out unless it is the one wanted,
  // and the one wanted fades in.
  private follow(): void {
    const stage = this.stage;

    if (stage === null) {
      return;
    }

    const now = stage.context.currentTime;
    const playing = this.scores.find((score) => score.isPlaying) ?? null;
    const { crossfadeSeconds } = this.options;

    if (playing !== null && playing.id === this.wanted) {
      this.wake();

      return;
    }

    playing?.fadeOut(now, crossfadeSeconds);

    if (this.wanted !== null) {
      const fading = this.scores.filter((score) => score !== playing);

      fading.forEach((score) => score.fadeOut(now, HURRY_SECONDS));
      this.scores.push(
        new Score({
          context: stage.context,
          id: this.wanted,
          theme: this.options.themes[this.wanted],
          drums: this.options.drums,
          destination: stage.destination,
          noise: stage.noise,
          random: this.options.random,
          start: now + START_DELAY_SECONDS,
          fadeSeconds: crossfadeSeconds,
        }),
      );
    }

    this.wake();
  }

  private wake(): void {
    if (this.handle !== null || !this.isRunning || this.scores.length === 0) {
      return;
    }

    this.handle = this.options.scheduler.request(this.onTick);
    this.tick();
  }

  private cancel(): void {
    if (this.handle !== null) {
      this.options.scheduler.cancel(this.handle);
      this.handle = null;
    }
  }

  // An arrow property, so it can be handed to the scheduler without losing `this`.
  private readonly onTick = () => {
    this.handle = this.options.scheduler.request(this.onTick);
    this.tick();
  };

  private tick(): void {
    const stage = this.stage;

    if (stage === null) {
      this.cancel();

      return;
    }

    const now = stage.context.currentTime;
    const until = now + this.options.lookaheadSeconds;

    for (let index = this.scores.length - 1; index >= 0; index -= 1) {
      const score = this.scores[index];

      if (score.isOver(now)) {
        score.dispose();
        this.scores.splice(index, 1);
      } else {
        score.schedule(until, this.intensity);
      }
    }

    if (this.scores.length === 0) {
      this.cancel();
    }
  }
}
