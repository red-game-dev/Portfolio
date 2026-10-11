import { AudioContextFactory } from "../domain/types";
import { isAudioContextConstructor } from "../guards/context";

const pageScope = (): object | undefined => (typeof window === "undefined" ? undefined : window);

// The browser's audio context maker, or null where there is none (a server render, a test, a very old browser).
// Older Safari has it only under its webkit name. Nothing is made until the factory is called, so a page that
// never unlocks its sound never makes a context.
export const browserAudioContext = (scope: object | undefined = pageScope()): AudioContextFactory | null => {
  if (scope === undefined) {
    return null;
  }

  const standard = "AudioContext" in scope ? scope.AudioContext : undefined;
  const legacy = "webkitAudioContext" in scope ? scope.webkitAudioContext : undefined;
  const Maker = isAudioContextConstructor(standard) ? standard : isAudioContextConstructor(legacy) ? legacy : null;

  return Maker === null ? null : () => new Maker();
};
