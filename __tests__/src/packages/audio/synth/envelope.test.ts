import { envelopeLength, envelopeLevel, SILENCE } from "@/packages/audio/synth";

describe("audio/synth envelopes", () => {
  const pluck = { attack: 0.01, decay: 0.5 };
  const pad = { attack: 1, decay: 0.5, sustain: 0.6, hold: 2, release: 1.5 };

  test("a percussive sound lasts its attack and decay; a held one adds its hold and release", () => {
    expect(envelopeLength(pluck)).toBeCloseTo(0.51, 10);
    expect(envelopeLength(pad)).toBeCloseTo(5, 10);
    expect(envelopeLength(pad, 0.5)).toBeCloseTo(3.5, 10);
    // Held for less than nothing is held for nothing.
    expect(envelopeLength(pad, -3)).toBeCloseTo(3, 10);
  });

  test("an attack left out is a few milliseconds, never a click", () => {
    expect(envelopeLength({ decay: 0.1 })).toBeGreaterThan(0.1);
    expect(envelopeLevel({ decay: 0.1 }, 0)).toBe(0);
  });

  test("the level rises in a straight line to the peak", () => {
    expect(envelopeLevel(pad, 0)).toBe(0);
    expect(envelopeLevel(pad, 0.25)).toBeCloseTo(0.25, 10);
    expect(envelopeLevel(pad, 0.5)).toBeCloseTo(0.5, 10);
  });

  test("it falls exponentially to the sustain level, holds, then falls to silence", () => {
    // Halfway through the decay of an exponential fall from 1 to 0.6 is the geometric mean.
    expect(envelopeLevel(pad, 1.25)).toBeCloseTo(Math.sqrt(0.6), 6);
    expect(envelopeLevel(pad, 1.5)).toBeCloseTo(0.6, 6);
    expect(envelopeLevel(pad, 3)).toBeCloseTo(0.6, 10);
    expect(envelopeLevel(pad, 3.5 + 0.75)).toBeCloseTo(0.6 * Math.sqrt(SILENCE / 0.6), 6);
    expect(envelopeLevel(pad, 5)).toBe(0);
    expect(envelopeLevel(pad, 9)).toBe(0);
  });

  test("a percussive fall reaches silence just as the sound ends", () => {
    expect(envelopeLevel(pluck, 0.01)).toBeCloseTo(1, 6);
    expect(envelopeLevel(pluck, 0.26)).toBeCloseTo(Math.sqrt(SILENCE), 6);
    expect(envelopeLevel(pluck, 0.5099)).toBeLessThan(0.001);
  });

  test("the level only ever falls after the peak", () => {
    let previous = 1;

    for (let time = 1; time < 5; time += 0.05) {
      const level = envelopeLevel(pad, time);

      expect(level).toBeLessThanOrEqual(previous + 1e-9);
      previous = level;
    }
  });
});
