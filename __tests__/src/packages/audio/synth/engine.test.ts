import { ManualScheduler } from "@/packages/animation/frame-loop";
import { AudioContextLike, browserAudioContext, CUES, LOOP_IDS, LOOPS, SoundCue, SOUND_CUES, SoundEngine, SoundEngineOptions } from "@/packages/audio/synth";
import { createSeededRandom } from "@/packages/math/random";

import { FakeAudioContext, FakeGain, FakeNode, lastEvent } from "./fixtures/fakeAudio";

// The real AudioContext fits the port the engine asks for, checked by the compiler rather than at run time.
const fitsPort = (context: AudioContext): AudioContextLike => context;

const setup = (options: SoundEngineOptions = {}) => {
  const context = new FakeAudioContext();
  const scheduler = new ManualScheduler();
  const createContext = jest.fn(() => context);
  const engine = SoundEngine.create({ createContext, scheduler, random: createSeededRandom(1), ...options });

  if (engine === null) {
    throw new Error("An engine with a context factory is always made");
  }

  return { context, scheduler, createContext, engine };
};

// The mixing desk: the master feeds the limiter, the effects and music buses feed the master.
const busesOf = (context: FakeAudioContext) => {
  const compressor = context.nodes.find((node) => node.kind === "compressor");
  const master = context.gains.find((gain) => compressor !== undefined && gain.history.includes(compressor));
  const [sfx, music] = context.gains.filter((gain) => master !== undefined && gain.history.includes(master));

  if (master === undefined || sfx === undefined || music === undefined) {
    throw new Error("The engine has not built its buses yet");
  }

  return { master, sfx, music };
};

const nodesSince = (context: FakeAudioContext, count: number): FakeNode[] => context.nodes.slice(count);

describe("audio/synth SoundEngine", () => {
  test("the browser's AudioContext fits the port", () => {
    expect(typeof fitsPort).toBe("function");
  });

  test("there is no engine where there is no Web Audio", () => {
    expect(SoundEngine.create()).toBeNull();
    expect(browserAudioContext(undefined)).toBeNull();
    expect(browserAudioContext({})).toBeNull();
    expect(browserAudioContext({ AudioContext: "not a constructor" })).toBeNull();
  });

  test("Safari's webkit name is found when the standard one is missing", () => {
    const factory = browserAudioContext({ webkitAudioContext: FakeAudioContext });

    expect(factory).not.toBeNull();
    expect(factory?.()).toBeInstanceOf(FakeAudioContext);
  });

  test("nothing sounds, and no context is made, before the unlock", async () => {
    const { context, scheduler, createContext, engine } = setup();
    const loop = engine.loop("engine");

    expect(engine.play("laser")).toBe(false);
    engine.music("solar");
    loop.set({ intensity: 0.5 });

    expect(createContext).not.toHaveBeenCalled();
    expect(context.nodes).toHaveLength(1);
    expect(scheduler.pendingCount).toBe(0);
    expect(engine.isUnlocked).toBe(false);

    await engine.unlock();

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.calls.resume).toBe(1);
    expect(engine.isUnlocked).toBe(true);
    // The silent sample iOS needs, played inside the gesture.
    expect(context.bufferSources[0].startAt).toBe(0);
    // The loop asked for earlier starts at the intensity it was set to, and the music asked for starts too.
    expect(context.oscillators.length).toBeGreaterThan(0);
    expect(lastEvent(context.filters[0].frequency, "set")?.value).toBeCloseTo(LOOPS.engine.filter.from * (LOOPS.engine.filter.to / LOOPS.engine.filter.from) ** 0.5, 6);
    expect(scheduler.pendingCount).toBe(1);
    expect(engine.play("laser")).toBe(true);
  });

  test("unlocking again makes no second context", async () => {
    const { context, createContext, engine } = setup();

    await engine.unlock();
    await engine.unlock();

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.calls.resume).toBe(1);
  });

  test("a factory that cannot make a context leaves the engine silent and tries again next time", async () => {
    let made: AudioContextLike | null = null;
    const engine = SoundEngine.create({ createContext: () => made });

    await engine?.unlock();
    expect(engine?.isUnlocked).toBe(false);
    expect(engine?.play("coin")).toBe(false);

    made = new FakeAudioContext();
    await engine?.unlock();
    expect(engine?.isUnlocked).toBe(true);
  });

  test("volumes start where configured, ease to new values, and mute silences the master", async () => {
    const { context, engine } = setup({ config: { volumes: { music: 0.5 } } });

    engine.setVolume("sfx", 0.6);
    await engine.unlock();

    const { master, sfx, music } = busesOf(context);

    expect(music.gain.value).toBeCloseTo(0.25, 10);
    expect(sfx.gain.value).toBeCloseTo(0.36, 10);

    // Set the moment the buses are built, a volume is taken outright: there is nothing yet to glide from.
    engine.setVolume("sfx", 0.5);
    expect(lastEvent(sfx.gain, "set")?.value).toBe(0.25);
    expect(lastEvent(sfx.gain, "cancel")).toBeUndefined();

    context.advance(0.1);
    engine.setVolume("music", 1);
    expect(lastEvent(music.gain, "cancel")).toBeDefined();
    expect(lastEvent(music.gain, "target")?.value).toBe(1);
    expect(engine.volume("music")).toBe(1);

    engine.setMuted(true);
    expect(engine.isMuted).toBe(true);
    expect(lastEvent(master.gain, "target")?.value).toBe(0);
    expect(engine.play("coin")).toBe(false);

    engine.setMuted(false);
    expect(lastEvent(master.gain, "target")?.value).toBeCloseTo(0.64, 10);

    engine.setVolume("master", 3);
    expect(engine.volume("master")).toBe(1);
  });

  test.each(SOUND_CUES)("%s builds its graph into the effects bus, stops itself and lets its nodes go", async (cue) => {
    const { context, engine } = setup();

    await engine.unlock();

    const { sfx } = busesOf(context);
    const before = context.nodes.length;
    const sourcesBefore = context.sources.length;

    expect(engine.play(cue, { pan: 0.4 })).toBe(true);

    const made = nodesSince(context, before);
    const sources = context.sources.slice(sourcesBefore);

    expect(sources).toHaveLength(CUES[cue].layers.length);
    sources.forEach((source) => {
      expect(source.startAt).toBeGreaterThanOrEqual(0);
      expect(source.stopAt).not.toBeNull();
      expect(source.stopAt ?? Infinity).toBeGreaterThan(source.startAt ?? Infinity);
      expect(source.stopAt ?? Infinity).toBeLessThan(10);
      expect(context.reaches(source, sfx)).toBe(true);
    });
    expect(made.some((node) => node.kind === "panner")).toBe(true);
    expect(engine.voices).toBe(1);

    context.advance(10);

    expect(engine.voices).toBe(0);
    made.forEach((node) => expect(node.isDisconnected).toBe(true));
  });

  test("the same cue too soon after itself is let go, and plays again once the gap has passed", async () => {
    const { context, engine } = setup();

    await engine.unlock();

    expect(engine.play("warning")).toBe(true);
    context.advance(0.3);
    expect(engine.play("warning")).toBe(false);
    context.advance(0.4);
    expect(engine.play("warning")).toBe(true);
  });

  test("past the voice cap the oldest voice fades out quickly and gives way", async () => {
    const { context, engine } = setup({ config: { maxVoices: 3 } });

    await engine.unlock();

    const outputs: FakeGain[] = [];
    const sourceCounts: number[] = [];
    const cues: SoundCue[] = ["cannon", "laser", "hit", "coin"];

    cues.forEach((cue) => {
      const gains = context.gains.length;

      sourceCounts.push(context.sources.length);
      engine.play(cue);
      outputs.push(context.gains[gains]);
      context.advance(0.01);
    });

    expect(engine.voices).toBe(3);
    expect(lastEvent(outputs[0].gain, "target")?.value).toBe(0);
    context.sources.slice(sourceCounts[0], sourceCounts[1]).forEach((source) => expect(source.stopAt ?? Infinity).toBeLessThan(0.1));
    outputs.slice(1).forEach((output) => expect(lastEvent(output.gain, "target")).toBeUndefined());

    context.advance(0.1);
    expect(outputs[0].isDisconnected).toBe(true);
  });

  test("a high priority cue outlasts a burst of lower ones", async () => {
    const { context, engine } = setup({ config: { maxVoices: 2 } });

    await engine.unlock();

    const levelUp = context.gains.length;

    engine.play("levelUp");
    engine.play("laser");
    context.advance(0.05);
    engine.play("laser");

    expect(lastEvent(context.gains[levelUp].gain, "target")).toBeUndefined();
    expect(engine.voices).toBe(2);
  });

  test("a loop follows its intensity, skips changes too small to hear, and stops cleanly", async () => {
    const { context, engine } = setup();

    await engine.unlock();

    const before = context.nodes.length;
    const loop = engine.loop("engine");
    const [rumble] = context.oscillators.slice(-2);
    const filter = context.filters[context.filters.length - 1];
    const output = context.gains.find((gain) => context.nodes.indexOf(gain) >= before);

    if (output === undefined) {
      throw new Error("The loop made no output");
    }

    expect(lastEvent(rumble.frequency, "set")?.value).toBeCloseTo(LOOPS.engine.tones[0].frequency, 6);

    context.advance(0.016);
    loop.set({ intensity: 1 });
    expect(lastEvent(output.gain, "target")?.value).toBeCloseTo(LOOPS.engine.level.to, 6);
    expect(lastEvent(filter.frequency, "target")?.value).toBeCloseTo(LOOPS.engine.filter.to, 6);
    expect(lastEvent(rumble.frequency, "target")?.value).toBeCloseTo(LOOPS.engine.tones[0].frequency * (LOOPS.engine.rise ?? 1), 6);

    const events = output.gain.events.length;

    loop.set({ intensity: 0.999 });
    expect(output.gain.events).toHaveLength(events);

    loop.stop();
    expect(loop.isStopped).toBe(true);
    expect(lastEvent(output.gain, "target")?.value).toBe(0);

    context.advance(1);
    nodesSince(context, before).forEach((node) => expect(node.isDisconnected).toBe(true));

    loop.set({ intensity: 0.2 });
    expect(output.gain.events.filter((event) => event.kind === "target").slice(-1)[0].value).toBe(0);
  });

  test("a loop set the moment it starts takes its pitch outright rather than swooping from a default", async () => {
    const { context, engine } = setup();

    await engine.unlock();

    const before = context.oscillators.length;
    const loop = engine.loop("beam");
    const hum = context.oscillators[before];

    loop.set({ intensity: 1, pitch: 2 });

    expect(lastEvent(hum.frequency, "cancel")).toBeUndefined();
    expect(lastEvent(hum.frequency, "set")?.value).toBeCloseTo(LOOPS.beam.tones[0].frequency * 2 * (LOOPS.beam.rise ?? 1), 6);

    // Stopped at once, before anything was heard, it lets go there and then.
    loop.stop();
    expect(hum.isDisconnected).toBe(true);
  });

  test("every loop builds and lets go", async () => {
    const { context, engine } = setup();

    await engine.unlock();

    LOOP_IDS.forEach((id) => {
      const before = context.nodes.length;
      const loop = engine.loop(id);

      loop.set({ intensity: 0.7, pitch: 1.2 });
      expect(context.nodes.length).toBeGreaterThan(before);
      loop.stop();
      context.advance(1);
      nodesSince(context, before).forEach((node) => expect(node.isDisconnected).toBe(true));
    });
  });

  test("suspending holds everything still and resuming lets it go on", async () => {
    const { context, scheduler, engine } = setup();

    await engine.unlock();
    engine.music("menu");
    expect(scheduler.pendingCount).toBe(1);

    await engine.suspend();
    expect(context.state).toBe("suspended");
    expect(scheduler.pendingCount).toBe(0);
    expect(engine.play("click")).toBe(false);

    await engine.resume();
    expect(context.state).toBe("running");
    expect(scheduler.pendingCount).toBe(1);
    expect(engine.play("click")).toBe(true);
  });

  test("an unlock while held still resumes for the gesture, then holds again", async () => {
    const { context, engine } = setup();

    await engine.suspend();
    await engine.unlock();

    expect(context.calls.resume).toBe(1);
    expect(context.state).toBe("suspended");
    expect(engine.play("click")).toBe(false);
  });

  test("a tap while the host holds the sound still does not wake it", async () => {
    const { context, engine } = setup();

    await engine.unlock();
    await engine.suspend();
    await engine.unlock();

    expect(context.calls.resume).toBe(1);
    expect(context.state).toBe("suspended");
  });

  test("dispose stops the timer, every sound and the context", async () => {
    const { context, scheduler, engine } = setup();

    await engine.unlock();
    engine.music("boss", { intensity: 1 });
    scheduler.tick(0);
    engine.play("explosion");

    const loop = engine.loop("heat");

    engine.dispose();

    expect(scheduler.pendingCount).toBe(0);
    expect(context.state).toBe("closed");
    expect(context.calls.close).toBe(1);
    expect(busesOf(context).master.isDisconnected).toBe(true);
    expect(engine.voices).toBe(0);
    expect(engine.play("coin")).toBe(false);
    expect(engine.loop("beam").isStopped).toBe(true);
    expect(loop.isStopped).toBe(true);

    engine.dispose();
    expect(context.calls.close).toBe(1);
  });
});
