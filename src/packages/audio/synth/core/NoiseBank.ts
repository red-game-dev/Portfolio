import { createWarmedRandom, RandomSource } from "@/packages/math/random";

import { AudioBufferLike, AudioContextLike, NoiseKind } from "../domain/types";

// Long enough that a loop of it is never heard repeating, short enough to make in a moment on a phone.
const NOISE_SECONDS = 1;
const CRACKLE_SECONDS = 2;
// The chance a sample starts a new click, and how fast each click dies (a share kept per sample).
const CRACKLE_DENSITY = 0.0016;
const CRACKLE_FADE = 0.82;
// Noise needs no surprises between visits, so it is seeded rather than drawn from the engine's random source.
const NOISE_SEED = 7919;

// The noise every layer is cut from, made once per context and each kind only when first asked for: one second
// of white noise for air, blasts and hiss, and two of sparse decaying clicks for a crackle. Sources loop them
// from a random point, so many sounds share one buffer.
export class NoiseBank {
  private readonly context: AudioContextLike;
  private readonly random: RandomSource = createWarmedRandom(NOISE_SEED);
  private white: AudioBufferLike | null = null;
  private crackle: AudioBufferLike | null = null;

  constructor(context: AudioContextLike) {
    this.context = context;
  }

  public get(kind: NoiseKind): AudioBufferLike {
    if (kind === "crackle") {
      this.crackle = this.crackle ?? this.makeCrackle();

      return this.crackle;
    }

    this.white = this.white ?? this.makeWhite();

    return this.white;
  }

  private makeWhite(): AudioBufferLike {
    const length = Math.max(1, Math.floor(this.context.sampleRate * NOISE_SECONDS));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = this.random() * 2 - 1;
    }

    return buffer;
  }

  private makeCrackle(): AudioBufferLike {
    const length = Math.max(1, Math.floor(this.context.sampleRate * CRACKLE_SECONDS));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let level = 0;

    for (let index = 0; index < data.length; index += 1) {
      if (this.random() < CRACKLE_DENSITY) {
        level = 0.4 + this.random() * 0.6;
      }

      data[index] = level * (this.random() * 2 - 1);
      level *= CRACKLE_FADE;
    }

    return buffer;
  }
}
