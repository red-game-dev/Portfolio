import { RandomSource } from "@/packages/math/random";

import { AudioContextLike, AudioNodeLike, BarScore, CueRecipe, DrumId, GainNodeLike, Instrument, MusicTheme, MusicThemeId, NoteEvent, ScorePart } from "../domain/types";
import { composeBar, stepSeconds, stepsPerBar } from "../utils/composer";
import { fadeIn, glideTo } from "./automation";
import { CueShape, playCue, releaseVoice, SoundTarget } from "./cue";
import { playNote } from "./instrument";
import { NoiseBank } from "./NoiseBank";

export interface ScoreOptions {
  context: AudioContextLike;
  id: MusicThemeId;
  theme: MusicTheme;
  drums: Readonly<Record<DrumId, CueRecipe>>;
  destination: AudioNodeLike;
  noise: NoiseBank;
  random: RandomSource;
  // When its first step falls on the context's clock, and how long it takes to fade in.
  start: number;
  fadeSeconds: number;
}

// The longest echo a theme may ask for (s); a delay line holds this much sound.
const MAX_ECHO_SECONDS = 3;

const isDrum = (part: ScorePart): part is DrumId => part === "kick" || part === "snare" || part === "hat";

// One theme playing: composes a bar at a time and schedules each step's notes on the context's clock as the
// lookahead window reaches it, through its own fader (for crossfades) and its theme's echo. It never schedules
// further ahead than it is asked to, so a change of intensity or theme is heard within a step.
export class Score {
  public readonly id: MusicThemeId;
  private readonly context: AudioContextLike;
  private readonly theme: MusicTheme;
  private readonly drums: Readonly<Record<DrumId, CueRecipe>>;
  private readonly random: RandomSource;
  private readonly fader: GainNodeLike;
  private readonly input: GainNodeLike;
  private readonly nodes: AudioNodeLike[];
  private readonly target: SoundTarget;
  private readonly shape: CueShape = { level: 1, pitch: 1, pan: 0 };
  private readonly barSteps: number;
  private readonly secondsPerStep: number;
  private step = 0;
  private nextAt: number;
  private plan: BarScore | null = null;
  private cursor = 0;
  private endsAt: number | null = null;

  constructor({ context, id, theme, drums, destination, noise, random, start, fadeSeconds }: ScoreOptions) {
    this.id = id;
    this.context = context;
    this.theme = theme;
    this.drums = drums;
    this.random = random;
    this.barSteps = stepsPerBar(theme);
    this.secondsPerStep = stepSeconds(theme);
    this.nextAt = start;
    this.fader = context.createGain();
    this.input = context.createGain();
    this.nodes = [this.fader, this.input];
    this.target = { context, destination: this.input, noise, random };

    this.fader.gain.value = 0;
    fadeIn(this.fader.gain, 1, start, fadeSeconds);
    this.input.gain.value = theme.level;
    this.input.connect(this.fader);
    this.fader.connect(destination);

    if (theme.echo) {
      const seconds = Math.min(MAX_ECHO_SECONDS, (theme.echo.beats * 60) / theme.tempo);
      const delay = context.createDelay(Math.max(1, seconds));
      const feedback = context.createGain();
      const wet = context.createGain();

      delay.delayTime.value = seconds;
      feedback.gain.value = Math.min(0.9, theme.echo.feedback);
      wet.gain.value = theme.echo.mix;
      this.input.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(this.fader);
      this.nodes.push(delay, feedback, wet);
    }
  }

  // Still playing, rather than fading out.
  public get isPlaying(): boolean {
    return this.endsAt === null;
  }

  public isOver(now: number): boolean {
    return this.endsAt !== null && now >= this.endsAt;
  }

  // Schedules every step that starts before `until`, playing the notes the intensity allows. Steps the clock has
  // already passed (a timer starved in a background tab) are skipped rather than played late in a heap.
  public schedule(until: number, intensity: number): void {
    const now = this.context.currentTime;
    const limit = this.endsAt === null ? until : Math.min(until, this.endsAt);

    if (this.nextAt < now) {
      const missed = Math.ceil((now - this.nextAt) / this.secondsPerStep);

      this.step += missed;
      this.nextAt += missed * this.secondsPerStep;
      this.plan = null;
    }

    while (this.nextAt < limit) {
      const inBar = this.step % this.barSteps;

      if (inBar === 0 || this.plan === null) {
        this.plan = composeBar(this.theme, this.random, Math.floor(this.step / this.barSteps));
        this.cursor = 0;
      }

      const { events } = this.plan;

      while (this.cursor < events.length && events[this.cursor].step < inBar) {
        this.cursor += 1;
      }

      while (this.cursor < events.length && events[this.cursor].step === inBar) {
        const event = events[this.cursor];

        this.cursor += 1;

        if (intensity >= event.from) {
          this.sound(event, this.nextAt);
        }
      }

      this.step += 1;
      this.nextAt += this.secondsPerStep;
    }
  }

  // Fades out over `seconds` and stops scheduling once silent. Asked again with a shorter fade, it hurries.
  public fadeOut(now: number, seconds: number): void {
    if (this.endsAt !== null && this.endsAt <= now + seconds) {
      return;
    }

    glideTo(this.fader.gain, 0, now, seconds);
    this.endsAt = now + seconds;
  }

  public dispose(): void {
    this.nodes.forEach((node) => node.disconnect());
  }

  private sound(event: NoteEvent, at: number): void {
    if (isDrum(event.part)) {
      this.shape.level = event.velocity;
      playCue(this.target, this.drums[event.part], at, this.shape, releaseVoice);

      return;
    }

    const instrument = this.instrumentOf(event.part);

    if (instrument !== null) {
      playNote(this.context, instrument, event.midi, at, event.steps * this.secondsPerStep, event.velocity, this.input);
    }
  }

  private instrumentOf(part: ScorePart): Instrument | null {
    switch (part) {
      case "pad":
        return this.theme.pad;
      case "bass":
        return this.theme.bass;
      case "lead":
        return this.theme.lead?.instrument ?? null;
      case "arp":
        return this.theme.arp?.instrument ?? null;
      case "pulse":
        return this.theme.pulse?.instrument ?? null;
      default:
        return null;
    }
  }
}
