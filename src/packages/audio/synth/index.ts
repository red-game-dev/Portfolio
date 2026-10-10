export { DEFAULT_SYNTH_CONFIG, resolveSynthConfig } from "./config";
export { CUES, SOUND_CUES } from "./config/cues";
export { LOOP_IDS, LOOPS } from "./config/loops";
export { DRUMS, MUSIC_THEMES, THEMES } from "./config/themes";
export { SoundEngine } from "./core/SoundEngine";
export { isAudioContextConstructor } from "./guards/context";
export { browserAudioContext } from "./sources/browserAudioContext";
export { chordDegreeAt, chordOf, composeBar, stepSeconds, stepsPerBar } from "./utils/composer";
export { envelopeLength, envelopeLevel, SILENCE } from "./utils/envelope";
export { centsToRatio, degreeToMidi, inScale, midiToHz, MODES, scaleNotes } from "./utils/pitch";
export { isTooSoon, voiceToDrop, volumeGain } from "./utils/voices";
export type { SynthConfig, SynthConfigOverrides } from "./config";
export type { MusicOptions, SoundEngineOptions } from "./core/SoundEngine";
export type {
  ArpPart, AudioBufferLike, AudioContextFactory, AudioContextLike, AudioNodeLike, AudioParamLike, BarScore, BiquadFilterLike, BufferSourceLike, CompressorLike, CueLayer,
  CueRecipe, DelayLike, DrumId, DrumPart, Envelope, FilterKind, FilterSweep, GainNodeLike, Instrument, LeadPart, LoopHandle, LoopId, LoopParams, LoopRecipe, ModeName,
  MusicTheme, MusicThemeId, NoiseKind, NoiseLayer, NoteEvent, OscillatorLike, PlayOptions, PulsePart, ScheduledSourceLike, ScorePart, SoundCue, StereoPannerLike,
  ToneLayer, VoiceTiming, VolumeChannel, Wave,
} from "./domain/types";
