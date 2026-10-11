import { clamp, clamp01 } from "@/packages/math/clamp";
import { lerp } from "@/packages/math/easing";

import {
  AudioContextLike, AudioNodeLike, AudioParamLike, BiquadFilterLike, BufferSourceLike, GainNodeLike, LoopHandle, LoopParams, LoopRecipe, OscillatorLike,
  ScheduledSourceLike,
} from "../domain/types";
import { fadeIn, glideTo } from "./automation";
import { TAIL_SECONDS } from "./cue";
import { NoiseBank } from "./NoiseBank";

interface LoopGraph {
  context: AudioContextLike;
  output: GainNodeLike;
  filter: BiquadFilterLike;
  tones: OscillatorLike[];
  noise: BufferSourceLike | null;
  sources: ScheduledSourceLike[];
  nodes: AudioNodeLike[];
}

// How long a change of intensity takes to settle, and how long a loop takes to fade in or out.
const SETTLE_SECONDS = 0.08;
const FADE_SECONDS = 0.15;
// Changes smaller than this are not worth an automation event, so a value set every frame costs nothing at rest.
const STILL = 0.004;

// Sets a value outright while the loop is just starting, so it does not swoop in from a node's default, and glides
// it after.
const move = (param: AudioParamLike, value: number, now: number, isFresh: boolean): void => {
  if (isFresh) {
    param.setValueAtTime(value, now);
  } else {
    glideTo(param, value, now, SETTLE_SECONDS);
  }
};

// A continuous sound: oscillators and a loop of noise through one filter and one gain, all following the
// intensity it is set to. It can be asked for before the sound is unlocked; it then waits, keeping whatever it
// was set to, and starts once the engine attaches it.
export class LoopVoice implements LoopHandle {
  private readonly recipe: LoopRecipe;
  private readonly onStop: (voice: LoopVoice) => void;
  private intensity = 0;
  private pitch = 1;
  private appliedIntensity = -1;
  private appliedPitch = -1;
  private startedAt = 0;
  private graph: LoopGraph | null = null;
  private stopped = false;

  constructor(recipe: LoopRecipe, onStop: (voice: LoopVoice) => void) {
    this.recipe = recipe;
    this.onStop = onStop;
  }

  public get isStopped(): boolean {
    return this.stopped;
  }

  // Builds the sound into `destination` and fades it in at the intensity last set. Once is enough.
  public attach(context: AudioContextLike, destination: AudioNodeLike, noise: NoiseBank): void {
    if (this.graph !== null || this.stopped) {
      return;
    }

    const { recipe } = this;
    const now = context.currentTime;
    const output = context.createGain();
    const filter = context.createBiquadFilter();
    const graph: LoopGraph = { context, output, filter, tones: [], noise: null, sources: [], nodes: [output, filter] };

    filter.type = recipe.filter.type;

    if (recipe.filter.q !== undefined) {
      filter.Q.setValueAtTime(recipe.filter.q, now);
    }

    filter.connect(output);
    output.connect(destination);

    for (const tone of recipe.tones) {
      const oscillator = context.createOscillator();
      const level = context.createGain();

      oscillator.type = tone.wave;
      oscillator.detune.setValueAtTime(tone.detune ?? 0, now);
      level.gain.value = tone.gain;
      oscillator.connect(level);
      level.connect(filter);
      oscillator.start(now);
      graph.tones.push(oscillator);
      graph.sources.push(oscillator);
      graph.nodes.push(oscillator, level);
    }

    if (recipe.noise) {
      const source = context.createBufferSource();
      const level = context.createGain();

      source.buffer = noise.get(recipe.noise.source);
      source.loop = true;
      level.gain.value = recipe.noise.gain;
      source.connect(level);
      level.connect(filter);
      source.start(now);
      graph.noise = source;
      graph.sources.push(source);
      graph.nodes.push(source, level);
    }

    if (recipe.lfo) {
      const lfo = context.createOscillator();
      const depth = context.createGain();

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(recipe.lfo.rate, now);
      depth.gain.value = recipe.lfo.depth;
      lfo.connect(depth);
      depth.connect(filter.frequency);
      lfo.start(now);
      graph.sources.push(lfo);
      graph.nodes.push(lfo, depth);
    }

    this.graph = graph;
    this.startedAt = now;
    this.apply(now, true);
  }

  public set({ intensity, pitch }: LoopParams): void {
    if (this.stopped) {
      return;
    }

    this.intensity = intensity === undefined ? this.intensity : clamp01(intensity);
    this.pitch = pitch === undefined ? this.pitch : clamp(pitch, 0.25, 4);

    if (this.graph !== null) {
      this.apply(this.graph.context.currentTime, false);
    }
  }

  // Fades out and stops; its nodes let go once the sources have ended. The handle does nothing after.
  public stop(): void {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    this.onStop(this);

    const graph = this.graph;

    if (graph === null) {
      return;
    }

    const now = graph.context.currentTime;

    // Stopped the moment it started, nothing has been heard yet.
    if (now <= this.startedAt || graph.sources.length === 0) {
      this.detach();

      return;
    }

    glideTo(graph.output.gain, 0, now, FADE_SECONDS);

    graph.sources[0].onended = () => this.release();
    graph.sources.forEach((source) => source.stop(now + FADE_SECONDS + TAIL_SECONDS));
  }

  // Stops at once, as when the engine is disposed.
  public detach(): void {
    this.stopped = true;

    const graph = this.graph;

    if (graph === null) {
      return;
    }

    graph.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    });
    this.release();
  }

  private release(): void {
    const graph = this.graph;

    if (graph === null) {
      return;
    }

    graph.sources.forEach((source) => {
      source.onended = null;
    });
    graph.nodes.forEach((node) => node.disconnect());
    this.graph = null;
  }

  // Sets level, cutoff and pitch from the intensity. While the loop is just starting (set the same moment it was
  // built) it fades in to the level and takes its pitches outright; after that every change glides.
  private apply(now: number, isForced: boolean): void {
    const graph = this.graph;
    const isFresh = now <= this.startedAt;
    const isStill = Math.abs(this.intensity - this.appliedIntensity) < STILL && Math.abs(this.pitch - this.appliedPitch) < STILL;

    if (graph === null || (!isForced && !isFresh && isStill)) {
      return;
    }

    const { recipe, intensity } = this;
    const rate = this.pitch * lerp(1, recipe.rise ?? 1, intensity);
    const level = lerp(recipe.level.from, recipe.level.to, intensity);

    if (isFresh) {
      fadeIn(graph.output.gain, level, now, FADE_SECONDS);
    } else {
      glideTo(graph.output.gain, level, now, SETTLE_SECONDS);
    }

    move(graph.filter.frequency, Math.min(graph.context.sampleRate / 2, recipe.filter.from * (recipe.filter.to / recipe.filter.from) ** intensity), now, isFresh);

    for (let index = 0; index < graph.tones.length; index += 1) {
      move(graph.tones[index].frequency, recipe.tones[index].frequency * rate, now, isFresh);
    }

    if (graph.noise !== null) {
      move(graph.noise.playbackRate, (recipe.noise?.rate ?? 1) * rate, now, isFresh);
    }

    this.appliedIntensity = intensity;
    this.appliedPitch = this.pitch;
  }
}
