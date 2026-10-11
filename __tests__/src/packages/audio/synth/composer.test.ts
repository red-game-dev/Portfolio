import { chordDegreeAt, chordOf, composeBar, inScale, MUSIC_THEMES, NoteEvent, stepSeconds, stepsPerBar, THEMES } from "@/packages/audio/synth";
import { createSeededRandom } from "@/packages/math/random";

const isPitched = (event: NoteEvent) => event.part !== "kick" && event.part !== "snare" && event.part !== "hat";

const composeBars = (seed: number, bars: number, theme = THEMES.solar) => {
  const random = createSeededRandom(seed);

  return Array.from({ length: bars }, (_, bar) => composeBar(theme, random, bar));
};

describe("audio/synth composer", () => {
  test("chords follow the progressions in turn, each for its bars, then round again", () => {
    const theme = THEMES.solar;
    const degrees = Array.from({ length: 18 }, (_, bar) => chordDegreeAt(theme, bar));

    expect(theme.barsPerChord).toBe(2);
    expect(degrees).toEqual([0, 0, 4, 4, 5, 5, 3, 3, 0, 0, 3, 3, 5, 5, 4, 4, 0, 0]);
  });

  test("chords stack thirds of the scale and keep near the root", () => {
    const theme = THEMES.solar;

    expect(chordOf(theme, 0)).toEqual([50, 54, 57]);
    // The fifth degree is built an octave down rather than up: A major under D.
    expect(chordOf(theme, 4)).toEqual([45, 49, 52]);
    expect(chordOf(THEMES.matrix, 0)).toEqual([45, 48, 52, 55]);
  });

  test.each(MUSIC_THEMES)("every pitched note of %s stays in its key, bar after bar", (id) => {
    const theme = THEMES[id];

    composeBars(11, 48, theme).forEach((bar) => {
      bar.events.filter(isPitched).forEach((event) => expect(inScale(event.midi, theme.root, theme.mode)).toBe(true));
    });
  });

  test.each(MUSIC_THEMES)("every note of %s falls within its bar, in the order it starts", (id) => {
    const theme = THEMES[id];
    const steps = stepsPerBar(theme);

    composeBars(5, 16, theme).forEach((bar) => {
      bar.events.forEach((event, index) => {
        expect(event.step).toBeGreaterThanOrEqual(0);
        expect(event.step).toBeLessThan(steps);
        expect(event.steps).toBeGreaterThan(0);
        expect(event.velocity).toBeGreaterThan(0);
        expect(event.velocity).toBeLessThanOrEqual(1);
        expect(index === 0 || bar.events[index - 1].step <= event.step).toBe(true);
      });
    });
  });

  test("the same seed plays the same score; another seed plays another, on the same chords", () => {
    const first = composeBars(42, 8);
    const again = composeBars(42, 8);
    const other = composeBars(43, 8);

    expect(again).toEqual(first);
    expect(other.map((bar) => bar.degree)).toEqual(first.map((bar) => bar.degree));
    expect(other.map((bar) => bar.events)).not.toEqual(first.map((bar) => bar.events));
  });

  test("the pad plays the chord once at the start of each chord, held for all its bars", () => {
    const bars = composeBars(3, 4);
    const pads = bars.map((bar) => bar.events.filter((event) => event.part === "pad"));

    expect(pads[0]).toHaveLength(3);
    expect(pads[1]).toHaveLength(0);
    expect(pads[2]).toHaveLength(3);
    pads[0].forEach((event) => expect(event.steps).toBe(stepsPerBar(THEMES.solar) * THEMES.solar.barsPerChord));
  });

  test("the layers a fight adds are marked with the intensity they need", () => {
    const events = composeBars(9, 4).flatMap((bar) => bar.events);
    const from = (part: NoteEvent["part"]) => new Set(events.filter((event) => event.part === part).map((event) => event.from));

    expect(from("pad")).toEqual(new Set([0]));
    expect(from("pulse")).toEqual(new Set([THEMES.solar.pulse?.from]));
    expect(from("kick")).toEqual(new Set([THEMES.solar.drums?.from]));
    expect(THEMES.solar.drums?.from ?? 0).toBeGreaterThan(THEMES.solar.pulse?.from ?? 1);
  });

  test("a boss drives from the first note and a menu stays soft", () => {
    expect(THEMES.boss.pulse?.from).toBe(0);
    expect(THEMES.boss.tempo).toBeGreaterThan(THEMES.solar.tempo);
    expect(THEMES.menu.drums).toBeNull();
    expect(THEMES.menu.pulse).toBeNull();
  });

  test("a step lasts a beat divided by the steps in it", () => {
    expect(stepSeconds(THEMES.solar)).toBeCloseTo(60 / 72 / 2, 10);
    expect(stepsPerBar(THEMES.matrix)).toBe(16);
  });
});
