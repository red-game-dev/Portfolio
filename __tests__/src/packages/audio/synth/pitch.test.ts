import { centsToRatio, degreeToMidi, inScale, midiToHz, MODES, scaleNotes } from "@/packages/audio/synth";

describe("audio/synth pitch", () => {
  test("MIDI notes are equal tempered from A4 at 440 Hz", () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBeCloseTo(880, 6);
    expect(midiToHz(60)).toBeCloseTo(261.626, 3);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });

  test("a hundred cents is a semitone, twelve hundred an octave", () => {
    expect(centsToRatio(1200)).toBeCloseTo(2, 10);
    expect(centsToRatio(-1200)).toBeCloseTo(0.5, 10);
    expect(centsToRatio(100)).toBeCloseTo(midiToHz(70) / midiToHz(69), 10);
  });

  test("a scale climbs through its octaves from the tonic", () => {
    expect(scaleNotes(60, "major", 1)).toEqual([60, 62, 64, 65, 67, 69, 71]);
    expect(scaleNotes(57, "minor", 2)).toEqual([57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79]);
    expect(scaleNotes(60, "majorPentatonic", 1)).toEqual([60, 62, 64, 67, 69]);
    expect(scaleNotes(60, "major", 0)).toEqual([]);
  });

  test("degrees past the top climb an octave and those below 0 fall one", () => {
    expect(degreeToMidi(60, "major", 7)).toBe(72);
    expect(degreeToMidi(60, "major", 9)).toBe(76);
    expect(degreeToMidi(60, "major", -1)).toBe(59);
    expect(degreeToMidi(60, "major", -7)).toBe(48);
    expect(degreeToMidi(60, "phrygian", 1)).toBe(61);
  });

  test("a note is in the key in any octave", () => {
    expect(inScale(64, 60, "major")).toBe(true);
    expect(inScale(64 + 24, 60, "major")).toBe(true);
    expect(inScale(63, 60, "major")).toBe(false);
    expect(inScale(63, 60, "minor")).toBe(true);
    expect(inScale(47, 60, "lydian")).toBe(true);
  });

  test("every mode starts on its tonic and climbs within an octave", () => {
    Object.values(MODES).forEach((steps) => {
      expect(steps[0]).toBe(0);
      steps.slice(1).forEach((step, index) => expect(step).toBeGreaterThan(steps[index]));
      expect(steps[steps.length - 1]).toBeLessThan(12);
    });
  });
});
