import { isTooSoon, voiceToDrop, volumeGain } from "@/packages/audio/synth";

const voice = (startedAt: number, priority = 1, endsAt = startedAt + 1) => ({ startedAt, priority, endsAt });

describe("audio/synth voice cap", () => {
  test("nobody gives way while there is room", () => {
    expect(voiceToDrop([], 3, 0)).toBe(-1);
    expect(voiceToDrop([voice(0), voice(0.1)], 3, 0.2)).toBe(-1);
  });

  test("at the cap the oldest gives way", () => {
    expect(voiceToDrop([voice(0.2), voice(0.1), voice(0.3)], 3, 0.4)).toBe(1);
  });

  test("the lowest priority gives way first, the oldest among them", () => {
    const voices = [voice(0, 2), voice(0.1, 1), voice(0.2, 1), voice(0.05, 2)];

    expect(voiceToDrop(voices, 4, 0.3)).toBe(1);
  });

  test("a voice whose sound is already over goes before anyone still heard", () => {
    const voices = [voice(0, 0), voice(0.1, 1, 0.2), voice(0.15, 2)];

    expect(voiceToDrop(voices, 3, 0.3)).toBe(1);
  });

  test("the same cue too soon after itself is let go", () => {
    expect(isTooSoon(undefined, 5, 0.03)).toBe(false);
    expect(isTooSoon(5, 5.01, 0.03)).toBe(true);
    expect(isTooSoon(5, 5.03, 0.03)).toBe(false);
  });

  test("a slider's value is squared into a gain, held between 0 and 1", () => {
    expect(volumeGain(1)).toBe(1);
    expect(volumeGain(0.5)).toBe(0.25);
    expect(volumeGain(0)).toBe(0);
    expect(volumeGain(2)).toBe(1);
    expect(volumeGain(-1)).toBe(0);
  });
});
