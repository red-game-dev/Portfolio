import { AudioContextLike } from "../domain/types";

export type AudioContextConstructor = new () => AudioContextLike;

// Whether a value found on the page can be called with `new` to make an audio context. Browsers only ever put a
// constructor under these names, so being a function is check enough.
export const isAudioContextConstructor = (value: unknown): value is AudioContextConstructor => typeof value === "function";
