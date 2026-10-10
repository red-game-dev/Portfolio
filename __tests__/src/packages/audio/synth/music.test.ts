import { ManualScheduler } from "@/packages/animation/frame-loop";
import { DEFAULT_SYNTH_CONFIG, inScale, MUSIC_THEMES, SoundEngine, THEMES } from "@/packages/audio/synth";
import { createSeededRandom } from "@/packages/math/random";

import { FakeAudioContext, FakeSource, lastEvent } from "./fixtures/fakeAudio";

const LOOKAHEAD = DEFAULT_SYNTH_CONFIG.lookaheadSeconds;
const TICK = DEFAULT_SYNTH_CONFIG.tickMs / 1000;

const setup = async (seed = 1) => {
  const context = new FakeAudioContext();
  const scheduler = new ManualScheduler();
  const engine = SoundEngine.create({ createContext: () => context, scheduler, random: createSeededRandom(seed) });

  if (engine === null) {
    throw new Error("An engine with a context factory is always made");
  }

  await engine.unlock();

  // Runs the timer for `seconds`, one tick at a time, checking that each tick schedules only inside its window.
  const run = (seconds: number) => {
    const ticks = Math.round(seconds / TICK);

    for (let tick = 0; tick < ticks; tick += 1) {
      const before = context.sources.length;

      context.advance(TICK);
      scheduler.tick(context.currentTime * 1000);
      context.sources.slice(before).forEach((source) => {
        expect(source.startAt ?? -1).toBeGreaterThanOrEqual(context.currentTime - 1e-9);
        expect(source.startAt ?? Infinity).toBeLessThan(context.currentTime + LOOKAHEAD + 1e-9);
      });
    }
  };

  // The faders of the scores, oldest first: each score's output into the music bus.
  const faders = () => {
    const compressor = context.nodes.find((node) => node.kind === "compressor");
    const master = context.gains.find((gain) => compressor !== undefined && gain.history.includes(compressor));
    const music = context.gains.filter((gain) => master !== undefined && gain.history.includes(master))[1];

    return context.gains.filter((gain) => gain.history.includes(music));
  };

  return { context, scheduler, engine, run, faders };
};

const midiOf = (hz: number) => 69 + 12 * Math.log2(hz / 440);

const firstFrequency = (source: FakeSource, context: FakeAudioContext) => {
  const oscillator = context.oscillators.find((candidate) => candidate === source);

  return oscillator === undefined ? null : oscillator.frequency.events.find((event) => event.kind === "set")?.value ?? null;
};

describe("audio/synth music", () => {
  test("notes are scheduled a little ahead, never past the lookahead window", async () => {
    const { context, engine, run } = await setup();

    engine.music("matrix");
    context.sources.forEach((source) => expect(source.startAt ?? Infinity).toBeLessThan(LOOKAHEAD));
    run(4);

    expect(context.sources.length).toBeGreaterThan(40);
  });

  test("a timer starved in a background tab skips what it missed instead of playing it late", async () => {
    const { context, scheduler, engine } = await setup();

    engine.music("pixels");
    context.advance(3);

    const before = context.sources.length;

    scheduler.tick(3000);

    const late = context.sources.slice(before);

    expect(late.length).toBeGreaterThan(0);
    late.forEach((source) => expect(source.startAt ?? -1).toBeGreaterThanOrEqual(3));
  });

  test("every note stays in the theme's scale", async () => {
    const { context, engine, run } = await setup(7);
    const theme = THEMES.matrix;

    engine.music("matrix");
    run(8);

    const pitches = context.sources.map((source) => firstFrequency(source, context)).filter((hz): hz is number => hz !== null);

    expect(pitches.length).toBeGreaterThan(40);
    pitches.forEach((hz) => {
      const midi = midiOf(hz);

      expect(Math.abs(midi - Math.round(midi))).toBeLessThan(1e-6);
      expect(inScale(midi, theme.root, theme.mode)).toBe(true);
    });
  });

  test("a theme crossfades into the next: both sound for a while, then only the new one", async () => {
    const { context, engine, run, faders } = await setup();

    engine.music("pixels");
    run(1);

    const [pixels] = faders();

    expect(lastEvent(pixels.gain, "target")?.value).toBe(1);

    engine.music("matrix");

    const [, matrix] = faders();
    const switchedAt = context.currentTime;

    expect(engine.theme).toBe("matrix");
    expect(lastEvent(pixels.gain, "target")).toEqual({ kind: "target", value: 0, time: switchedAt });
    expect(lastEvent(matrix.gain, "set")?.value).toBe(0);
    expect(lastEvent(matrix.gain, "target")?.value).toBe(1);
    expect(lastEvent(matrix.gain, "target")?.time).toBeCloseTo(switchedAt + 0.05, 6);

    const during = context.sources.length;

    run(1.5);

    const overlap = context.sources.slice(during);

    expect(overlap.some((source) => context.reaches(source, pixels))).toBe(true);
    expect(overlap.some((source) => context.reaches(source, matrix))).toBe(true);

    run(1.5);
    expect(pixels.isDisconnected).toBe(true);

    const after = context.sources.length;

    run(2);

    const alone = context.sources.slice(after);

    expect(alone.length).toBeGreaterThan(0);
    alone.forEach((source) => {
      expect(context.reaches(source, matrix)).toBe(true);
      expect(context.reaches(source, pixels)).toBe(false);
    });
  });

  test("asking for the theme already playing changes nothing", async () => {
    const { engine, run, faders } = await setup();

    engine.music("nebula");
    run(0.5);
    engine.music("nebula");

    expect(faders()).toHaveLength(1);
  });

  test("null fades the music out, then the timer stops and nothing more is scheduled", async () => {
    const { context, scheduler, engine, run, faders } = await setup();

    engine.music("menu");
    run(1);
    engine.music(null);

    const [menu] = faders();

    expect(engine.theme).toBeNull();
    expect(lastEvent(menu.gain, "target")?.value).toBe(0);

    run(DEFAULT_SYNTH_CONFIG.crossfadeSeconds + 0.2);

    expect(scheduler.pendingCount).toBe(0);
    expect(menu.isDisconnected).toBe(true);

    const count = context.sources.length;

    run(2);
    expect(context.sources).toHaveLength(count);
  });

  test("intensity adds the fight's layers within a step, and takes them away again", async () => {
    const { context, engine, run } = await setup();
    const noise = () => context.bufferSources.length;

    engine.music("solar");
    run(6);

    const calm = noise();

    engine.setMusicIntensity(1);
    run(3);
    expect(noise()).toBeGreaterThan(calm);

    engine.setMusicIntensity(0);
    run(0.5);

    const settled = noise();

    run(4);
    expect(noise()).toBe(settled);
  });

  test("the same seed plays the same score, another seed another", async () => {
    const notes = async (seed: number) => {
      const { context, engine, run } = await setup(seed);

      engine.music("crystal");
      run(6);

      return context.sources.map((source) => [source.startAt, firstFrequency(source, context)]);
    };

    expect(await notes(3)).toEqual(await notes(3));
    expect(await notes(4)).not.toEqual(await notes(3));
  });

  test.each(MUSIC_THEMES)("%s plays at every intensity", async (id) => {
    const { context, engine, run } = await setup();

    engine.music(id, { intensity: 0 });
    run(4);

    const calm = context.sources.length;

    engine.setMusicIntensity(1);
    run(4);

    expect(calm).toBeGreaterThan(1);
    expect(context.sources.length).toBeGreaterThan(calm);
  });
});
