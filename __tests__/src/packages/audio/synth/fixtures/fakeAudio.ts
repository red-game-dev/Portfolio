import {
  AudioBufferLike, AudioContextLike, AudioNodeLike, AudioParamLike, BiquadFilterLike, BufferSourceLike, CompressorLike, DelayLike, GainNodeLike, OscillatorLike,
  ScheduledSourceLike, StereoPannerLike,
} from "@/packages/audio/synth";

export interface ParamEvent {
  kind: "set" | "linear" | "exponential" | "target" | "cancel";
  value: number;
  time: number;
}

// A parameter that remembers every change asked of it; `value` is the last value scheduled.
export interface FakeParam extends AudioParamLike {
  readonly events: ParamEvent[];
}

export interface FakeNode extends AudioNodeLike {
  readonly kind: string;
  // Where it leads now, and everywhere it ever led (kept after a disconnect).
  readonly connections: Array<AudioNodeLike | AudioParamLike>;
  readonly history: Array<AudioNodeLike | AudioParamLike>;
  isDisconnected: boolean;
}

export interface FakeSource extends FakeNode, ScheduledSourceLike {
  startAt: number | null;
  stopAt: number | null;
  hasEnded: boolean;
}

export interface FakeGain extends FakeNode, GainNodeLike {
  readonly gain: FakeParam;
}

export interface FakeFilter extends FakeNode, BiquadFilterLike {
  readonly frequency: FakeParam;
  readonly Q: FakeParam;
}

export interface FakeOscillator extends FakeSource, OscillatorLike {
  readonly frequency: FakeParam;
  readonly detune: FakeParam;
}

export interface FakeBufferSource extends FakeSource, BufferSourceLike {
  readonly playbackRate: FakeParam;
  start(when?: number, offset?: number): void;
}

export const fakeParam = (initial: number): FakeParam => {
  const param: FakeParam = {
    value: initial,
    events: [],
    setValueAtTime(value: number, time: number) {
      param.events.push({ kind: "set", value, time });
      param.value = value;
    },
    linearRampToValueAtTime(value: number, time: number) {
      param.events.push({ kind: "linear", value, time });
      param.value = value;
    },
    exponentialRampToValueAtTime(value: number, time: number) {
      param.events.push({ kind: "exponential", value, time });
      param.value = value;
    },
    setTargetAtTime(value: number, time: number) {
      param.events.push({ kind: "target", value, time });
      param.value = value;
    },
    cancelScheduledValues(time: number) {
      param.events.push({ kind: "cancel", value: param.value, time });
    },
  };

  return param;
};

// The last change asked of a parameter, of a kind.
export const lastEvent = (param: FakeParam, kind: ParamEvent["kind"]): ParamEvent | undefined => [...param.events].reverse().find((event) => event.kind === kind);

// An AudioContext that makes no sound: it records every node made, every connection, every scheduled start and
// stop and every parameter change, and moves its clock only when told, firing `onended` for what has stopped.
export class FakeAudioContext implements AudioContextLike {
  public currentTime = 0;
  public state = "suspended";
  public readonly sampleRate: number;
  public readonly destination: FakeNode;
  public readonly nodes: FakeNode[] = [];
  public readonly sources: FakeSource[] = [];
  public readonly gains: FakeGain[] = [];
  public readonly filters: FakeFilter[] = [];
  public readonly oscillators: FakeOscillator[] = [];
  public readonly bufferSources: FakeBufferSource[] = [];
  public readonly buffers: AudioBufferLike[] = [];
  public calls = { resume: 0, suspend: 0, close: 0 };

  constructor(sampleRate = 8000) {
    this.sampleRate = sampleRate;
    this.destination = this.node("destination");
  }

  public createGain(): FakeGain {
    const node = Object.assign(this.node("gain"), { gain: fakeParam(1) });

    this.gains.push(node);

    return node;
  }

  public createOscillator(): FakeOscillator {
    const parts: Pick<FakeOscillator, "type" | "frequency" | "detune"> = { type: "sine", frequency: fakeParam(440), detune: fakeParam(0) };
    const node = Object.assign(this.source("oscillator"), parts);

    this.oscillators.push(node);

    return node;
  }

  public createBiquadFilter(): FakeFilter {
    const parts: Pick<FakeFilter, "type" | "frequency" | "Q"> = { type: "lowpass", frequency: fakeParam(350), Q: fakeParam(1) };
    const node = Object.assign(this.node("filter"), parts);

    this.filters.push(node);

    return node;
  }

  public createBufferSource(): FakeBufferSource {
    const parts: Pick<FakeBufferSource, "buffer" | "loop" | "playbackRate"> = { buffer: null, loop: false, playbackRate: fakeParam(1) };
    const node = Object.assign(this.source("bufferSource"), parts);

    this.bufferSources.push(node);

    return node;
  }

  public createBuffer(_channels: number, length: number, sampleRate: number): AudioBufferLike {
    const data = new Float32Array(length);
    const buffer = { duration: length / sampleRate, getChannelData: () => data };

    this.buffers.push(buffer);

    return buffer;
  }

  public createDelay(): FakeNode & DelayLike {
    return Object.assign(this.node("delay"), { delayTime: fakeParam(0) });
  }

  public createDynamicsCompressor(): FakeNode & CompressorLike {
    const parts: Pick<CompressorLike, "threshold" | "knee" | "ratio" | "attack" | "release"> = {
      threshold: fakeParam(-24),
      knee: fakeParam(30),
      ratio: fakeParam(12),
      attack: fakeParam(0.003),
      release: fakeParam(0.25),
    };

    return Object.assign(this.node("compressor"), parts);
  }

  public createStereoPanner(): FakeNode & StereoPannerLike {
    return Object.assign(this.node("panner"), { pan: fakeParam(0) });
  }

  public resume(): Promise<void> {
    this.calls.resume += 1;
    this.state = this.state === "closed" ? "closed" : "running";

    return Promise.resolve();
  }

  public suspend(): Promise<void> {
    this.calls.suspend += 1;
    this.state = this.state === "closed" ? "closed" : "suspended";

    return Promise.resolve();
  }

  public close(): Promise<void> {
    this.calls.close += 1;
    this.state = "closed";

    return Promise.resolve();
  }

  // Moves the clock on and ends every source whose stop (or whose buffer, if it does not loop) has come.
  public advance(seconds: number): void {
    this.currentTime += seconds;

    const count = this.sources.length;

    for (let index = 0; index < count; index += 1) {
      const source = this.sources[index];

      if (!source.hasEnded && source.startAt !== null && this.endOf(source) <= this.currentTime) {
        source.hasEnded = true;
        source.onended?.(new Event("ended"));
      }
    }
  }

  // Whether `from` led to `to` through any connections it ever had.
  public reaches(from: AudioNodeLike | AudioParamLike, to: AudioNodeLike | AudioParamLike): boolean {
    const seen = new Set<AudioNodeLike | AudioParamLike>();
    const visit = (item: AudioNodeLike | AudioParamLike): boolean => {
      if (item === to) {
        return true;
      }

      if (seen.has(item)) {
        return false;
      }

      seen.add(item);

      const node = this.nodes.find((candidate) => candidate === item);

      return node !== undefined && node.history.some(visit);
    };

    return visit(from);
  }

  private endOf(source: FakeSource): number {
    const stop = source.stopAt ?? Infinity;
    const buffered = this.bufferSources.find((candidate) => candidate === source);

    if (buffered !== undefined && !buffered.loop && buffered.buffer !== null) {
      return Math.min(stop, (source.startAt ?? 0) + buffered.buffer.duration);
    }

    return stop;
  }

  private node(kind: string): FakeNode {
    const node: FakeNode = {
      kind,
      connections: [],
      history: [],
      isDisconnected: false,
      connect(destination: AudioNodeLike | AudioParamLike) {
        node.connections.push(destination);
        node.history.push(destination);
      },
      disconnect() {
        node.connections.length = 0;
        node.isDisconnected = true;
      },
    };

    this.nodes.push(node);

    return node;
  }

  private source(kind: string): FakeSource {
    const source: FakeSource = Object.assign(this.node(kind), {
      startAt: null,
      stopAt: null,
      hasEnded: false,
      onended: null,
      start(when = 0) {
        if (source.startAt !== null) {
          throw new Error("A source can start only once");
        }

        source.startAt = when;
      },
      stop(when = 0) {
        if (source.startAt === null) {
          throw new Error("A source cannot stop before it starts");
        }

        source.stopAt = when;
      },
    });

    this.sources.push(source);

    return source;
  }
}
