import { FrameScheduler, TimeoutScheduler } from "@/packages/animation/frame-loop";
import { clamp, clamp01 } from "@/packages/math/clamp";
import { RandomSource } from "@/packages/math/random";

import { resolveSynthConfig, SynthConfig, SynthConfigOverrides } from "../config";
import { CUES } from "../config/cues";
import { LOOPS } from "../config/loops";
import { DRUMS, THEMES } from "../config/themes";
import {
  AudioContextFactory, AudioContextLike, CompressorLike, CueRecipe, GainNodeLike, LoopHandle, LoopId, LoopRecipe, MusicTheme, MusicThemeId, PlayOptions, SoundCue,
  VolumeChannel,
} from "../domain/types";
import { browserAudioContext } from "../sources/browserAudioContext";
import { isTooSoon, volumeGain } from "../utils/voices";
import { glideTo } from "./automation";
import { CueShape, playCue, SoundTarget } from "./cue";
import { LoopVoice } from "./LoopVoice";
import { MusicDirector } from "./MusicDirector";
import { NoiseBank } from "./NoiseBank";
import { VoicePool } from "./VoicePool";

export interface SoundEngineOptions {
  // Makes the audio context, called on the first unlock; the browser's when left out.
  createContext?: AudioContextFactory;
  // Draws the score's notes and each cue's small change of pitch; seed it for a score that plays the same twice.
  random?: RandomSource;
  // The timer that tops up the score; a timeout every `tickMs` when left out.
  scheduler?: FrameScheduler;
  config?: SynthConfigOverrides;
  // Recipes that replace the defaults, for a host that wants its own sound.
  cues?: Partial<Record<SoundCue, CueRecipe>>;
  loops?: Partial<Record<LoopId, LoopRecipe>>;
  themes?: Partial<Record<MusicThemeId, MusicTheme>>;
}

export interface MusicOptions {
  intensity?: number;
}

interface Stage {
  context: AudioContextLike;
  compressor: CompressorLike;
  buses: Readonly<Record<VolumeChannel, GainNodeLike>>;
  noise: NoiseBank;
  sfx: SoundTarget;
  // When it was built: a volume set at that same moment is set outright, as there is nothing yet to glide from.
  builtAt: number;
}

// Resuming or suspending a context is tried this many times to reach what the host wants before giving up.
const SETTLE_ATTEMPTS = 3;
// A cue starts this far ahead of the clock, so its first few milliseconds are rendered as written rather than
// skipped by a quantum already under way.
const START_AHEAD_SECONDS = 0.005;
const CHANNELS: readonly VolumeChannel[] = ["master", "sfx", "music"];

// Every sound of a game, made in the browser with the Web Audio API and nothing downloaded: one-shot cues from
// recipes, continuous loops that follow a value, and a generative score per theme that crossfades from one to the
// next. Nothing plays until `unlock` is called from a user gesture, since browsers start audio suspended; until
// then cues are let go, while loops and the music asked for wait and start on the unlock. Built for older phones:
// a handful of voices at once, the score written a moment ahead on the audio clock, nodes let go when done.
export class SoundEngine {
  private readonly createContext: AudioContextFactory;
  private readonly config: SynthConfig;
  private readonly random: RandomSource;
  private readonly cues: Readonly<Record<SoundCue, CueRecipe>>;
  private readonly loops: Readonly<Record<LoopId, LoopRecipe>>;
  private readonly levels: Record<VolumeChannel, number>;
  private readonly pool: VoicePool;
  private readonly director: MusicDirector;
  private readonly loopVoices = new Set<LoopVoice>();
  private readonly lastStarted = new Map<SoundCue, number>();
  private readonly shape: CueShape = { level: 1, pitch: 1, pan: 0 };
  private stage: Stage | null = null;
  private muted = false;
  private unlocked = false;
  private held = false;
  private disposed = false;

  private constructor(createContext: AudioContextFactory, options: SoundEngineOptions) {
    this.createContext = createContext;
    this.config = resolveSynthConfig(options.config);
    this.random = options.random ?? Math.random;
    this.cues = { ...CUES, ...options.cues };
    this.loops = { ...LOOPS, ...options.loops };
    this.levels = { ...this.config.volumes };
    this.pool = new VoicePool(this.config.maxVoices);
    this.director = new MusicDirector({
      scheduler: options.scheduler ?? new TimeoutScheduler(this.config.tickMs),
      random: this.random,
      themes: { ...THEMES, ...options.themes },
      drums: DRUMS,
      lookaheadSeconds: this.config.lookaheadSeconds,
      crossfadeSeconds: this.config.crossfadeSeconds,
    });
  }

  // Whether a gesture has let the sound start.
  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get isMuted(): boolean {
    return this.muted;
  }

  // How many one-shot sounds are in play.
  public get voices(): number {
    return this.pool.size;
  }

  // The theme playing or on its way in; null for silence.
  public get theme(): MusicThemeId | null {
    return this.director.theme;
  }

  // An engine, or null where the browser has no Web Audio at all.
  public static create(options: SoundEngineOptions = {}): SoundEngine | null {
    const createContext = options.createContext ?? browserAudioContext();

    return createContext === null ? null : new SoundEngine(createContext, options);
  }

  public volume(channel: VolumeChannel): number {
    return this.levels[channel];
  }

  // Starts the sound. Call it from a user gesture (a tap, a click, a key): the context is made and resumed before
  // anything waits, as browsers ask, and a silent sound is played for iOS, which wants one before it lets a page
  // be heard. Safe to call on every gesture.
  public async unlock(): Promise<void> {
    // Already unlocked and held still by the host: a tap on a pause menu should not wake the sound.
    if (this.unlocked && this.held) {
      return;
    }

    const stage = this.ensureStage();

    if (stage === null) {
      return;
    }

    if (stage.context.state !== "running") {
      this.prime(stage.context);

      try {
        await stage.context.resume();
      } catch {
        return;
      }
    }

    if (this.disposed || stage.context.state !== "running") {
      return;
    }

    this.unlocked = true;
    await this.settle();
  }

  // Sets a volume (0 to 1), easing there rather than jumping.
  public setVolume(channel: VolumeChannel, value: number): void {
    this.levels[channel] = clamp01(value);
    this.applyVolume(channel);
  }

  public setMuted(isMuted: boolean): void {
    this.muted = isMuted;
    this.applyVolume("master");
  }

  // Plays a cue once; returns whether it sounded. It does not before the unlock, while muted or held, or when the
  // same cue started too recently to be heard apart.
  public play(cue: SoundCue, options: PlayOptions = {}): boolean {
    const stage = this.liveStage();

    if (stage === null || this.muted || this.levels.sfx <= 0 || this.levels.master <= 0) {
      return false;
    }

    const recipe = this.cues[cue];
    const now = stage.context.currentTime;

    if (isTooSoon(this.lastStarted.get(cue), now, recipe.minGap ?? this.config.minGapSeconds)) {
      return false;
    }

    const vary = recipe.vary ?? 0;

    this.lastStarted.set(cue, now);
    this.shape.level = clamp01(options.volume ?? 1);
    this.shape.pitch = clamp(options.pitch ?? 1, 0.25, 4) * (vary > 0 ? 1 + (this.random() * 2 - 1) * vary : 1);
    this.shape.pan = clamp(options.pan ?? 0, -1, 1);
    this.pool.add(playCue(stage.sfx, recipe, now + START_AHEAD_SECONDS, this.shape, this.pool.finish), now);

    return true;
  }

  // Starts a continuous sound and returns its handle. Each call is a sound of its own; stop it when done.
  public loop(id: LoopId): LoopHandle {
    const voice = new LoopVoice(this.loops[id], (stopped) => this.loopVoices.delete(stopped));

    if (this.disposed) {
      voice.stop();

      return voice;
    }

    this.loopVoices.add(voice);

    const stage = this.liveStage();

    if (stage !== null) {
      voice.attach(stage.context, stage.buses.sfx, stage.noise);
    }

    return voice;
  }

  // Crossfades to a theme's score, or fades the music out for null. Asked for before the unlock, it starts then.
  public music(theme: MusicThemeId | null, options: MusicOptions = {}): void {
    if (this.disposed) {
      return;
    }

    if (options.intensity !== undefined) {
      this.director.setIntensity(options.intensity);
    }

    this.director.play(theme);
  }

  // How intense the music is, 0 to 1: a pulse joins for a fight and light percussion for a boss, as each theme says.
  public setMusicIntensity(value: number): void {
    this.director.setIntensity(value);
  }

  // Holds every sound still, as when the tab is hidden or the game paused. The context is suspended, which costs
  // nothing while it waits.
  public suspend(): Promise<void> {
    this.held = true;
    this.director.stop();

    return this.settle();
  }

  public resume(): Promise<void> {
    this.held = false;

    return this.settle();
  }

  // Stops everything and closes the context. The engine is spent after; make a new one to play again.
  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.director.dispose();
    this.pool.clear();
    this.loopVoices.forEach((voice) => voice.detach());
    this.loopVoices.clear();

    const stage = this.stage;

    this.stage = null;

    if (stage !== null) {
      CHANNELS.forEach((channel) => stage.buses[channel].disconnect());
      stage.compressor.disconnect();
      stage.context.close().catch(() => undefined);
    }
  }

  // The context and the mixing desk: each sound into the effects or music bus, both into the master, and the
  // master through a gentle limiter so a pile of explosions cannot clip a phone's speaker. Made once, on the first
  // unlock; tried again on the next if the browser refused.
  private ensureStage(): Stage | null {
    if (this.stage !== null || this.disposed) {
      return this.stage;
    }

    let context: AudioContextLike | null;

    try {
      context = this.createContext();
    } catch {
      context = null;
    }

    if (context === null) {
      return null;
    }

    const compressor = context.createDynamicsCompressor();
    const buses = { master: context.createGain(), sfx: context.createGain(), music: context.createGain() };
    const noise = new NoiseBank(context);

    compressor.threshold.value = -12;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.2;
    compressor.connect(context.destination);
    buses.master.connect(compressor);
    buses.sfx.connect(buses.master);
    buses.music.connect(buses.master);
    CHANNELS.forEach((channel) => {
      buses[channel].gain.value = this.gainOf(channel);
    });

    this.stage = { context, compressor, buses, noise, sfx: { context, destination: buses.sfx, noise, random: this.random }, builtAt: context.currentTime };
    this.director.attach(context, buses.music, noise);

    return this.stage;
  }

  // The stage, when sound may be made on it right now.
  private liveStage(): Stage | null {
    const stage = this.stage;

    return stage !== null && this.unlocked && !this.held && !this.disposed && stage.context.state === "running" ? stage : null;
  }

  // A sample of silence, which iOS needs to hear played inside the gesture before it lets the page make sound.
  private prime(context: AudioContextLike): void {
    const source = context.createBufferSource();

    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start(0);
  }

  // Brings the context to what the host wants (running, or held still), looking again after every wait in case
  // the wish changed meanwhile, then starts or stops what depends on it.
  private async settle(): Promise<void> {
    for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
      const stage = this.stage;

      if (stage === null || !this.unlocked || this.disposed) {
        return;
      }

      const shouldRun = !this.held;

      if (shouldRun === (stage.context.state === "running")) {
        if (shouldRun) {
          this.wake(stage);
        } else {
          this.director.stop();
        }

        return;
      }

      try {
        await (shouldRun ? stage.context.resume() : stage.context.suspend());
      } catch {
        return;
      }
    }
  }

  // The sound is running: loops that were waiting start, and the music catches up with the theme wanted.
  private wake(stage: Stage): void {
    this.loopVoices.forEach((voice) => voice.attach(stage.context, stage.buses.sfx, stage.noise));
    this.director.start();
  }

  private gainOf(channel: VolumeChannel): number {
    return channel === "master" && this.muted ? 0 : volumeGain(this.levels[channel]);
  }

  private applyVolume(channel: VolumeChannel): void {
    const stage = this.stage;

    if (stage === null) {
      return;
    }

    const { gain } = stage.buses[channel];
    const now = stage.context.currentTime;

    if (now <= stage.builtAt) {
      gain.setValueAtTime(this.gainOf(channel), now);
    } else {
      glideTo(gain, this.gainOf(channel), now, this.config.rampSeconds);
    }
  }
}
