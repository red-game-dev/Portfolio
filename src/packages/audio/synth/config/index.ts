import { VolumeChannel } from "../domain/types";

export interface SynthConfig {
  // One-shot sounds at once. Past this the voice cap lets one go, so a firefight cannot swamp an older phone.
  maxVoices: number;
  // How far ahead of the context's clock the score is written (s), and how often it is topped up (ms): the
  // timer is late now and then, the audio clock never is, so notes land on time however the page is doing.
  lookaheadSeconds: number;
  tickMs: number;
  // How long one theme takes to give way to the next.
  crossfadeSeconds: number;
  // How long a volume takes to settle on a new value.
  rampSeconds: number;
  // The same cue asked for again sooner than this (s) is let go, unless its recipe says otherwise.
  minGapSeconds: number;
  // The volumes it starts at, 0 to 1.
  volumes: Readonly<Record<VolumeChannel, number>>;
}

export type SynthConfigOverrides = Partial<Omit<SynthConfig, "volumes">> & { volumes?: Partial<Record<VolumeChannel, number>> };

export const DEFAULT_SYNTH_CONFIG: SynthConfig = {
  maxVoices: 12,
  lookaheadSeconds: 0.15,
  tickMs: 30,
  crossfadeSeconds: 2.5,
  rampSeconds: 0.12,
  minGapSeconds: 0.03,
  volumes: { master: 0.8, sfx: 0.8, music: 0.55 },
};

export const resolveSynthConfig = (overrides: SynthConfigOverrides = {}): SynthConfig => ({
  ...DEFAULT_SYNTH_CONFIG,
  ...overrides,
  volumes: { ...DEFAULT_SYNTH_CONFIG.volumes, ...overrides.volumes },
});
