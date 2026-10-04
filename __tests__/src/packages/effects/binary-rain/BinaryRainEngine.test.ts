import { ManualScheduler } from "@/packages/animation/frame-loop";
import { BinaryRainEngine, isMessageComplete, RainRenderer, RainState } from "@/packages/effects/binary-rain";
import { createSeededRandom } from "@/packages/math/random";

const createRenderer = () => {
  const frames: RainState[] = [];
  const resize = jest.fn();
  const draw = jest.fn((state: RainState) => {
    frames.push(state);
  });
  const renderer: RainRenderer = { resize, draw };

  return { renderer, resize, draw, frames };
};

const createEngine = (isStatic = false) => {
  const { renderer, resize, draw, frames } = createRenderer();
  const scheduler = new ManualScheduler();
  const engine = new BinaryRainEngine(renderer, {
    message: ["33,000+ prompts"],
    isStatic,
    random: createSeededRandom(5),
    scheduler,
  });

  return { engine, resize, draw, frames, scheduler };
};

const lastFrame = (frames: RainState[]) => frames[frames.length - 1];

describe("effects/binary-rain BinaryRainEngine", () => {
  test("resize draws a frame straight away and caps the pixel ratio", () => {
    const { engine, resize, frames } = createEngine();

    engine.resize(900, 300, 3);

    expect(resize).toHaveBeenCalledWith(expect.objectContaining({ width: 900, height: 300 }), 2);
    expect(frames).toHaveLength(1);
  });

  test("ignores a zero size, which happens while the section is hidden", () => {
    const { engine, draw } = createEngine();

    engine.resize(0, 300);

    expect(draw).not.toHaveBeenCalled();
  });

  test("runs on its scheduler and stops cleanly", () => {
    const { engine, frames, scheduler } = createEngine();

    engine.resize(900, 300);
    engine.start();
    [0, 34, 68, 102].forEach((time) => scheduler.tick(time));

    expect(frames.length).toBeGreaterThan(1);

    engine.stop();
    expect(scheduler.pendingCount).toBe(0);
  });

  test("decode called before the first resize still plays the reveal", () => {
    const { engine, frames } = createEngine();

    engine.decode();
    engine.resize(900, 300);

    expect(lastFrame(frames).armedAt).not.toBeNull();
    expect(isMessageComplete(lastFrame(frames))).toBe(false);
  });

  test("a resize after the reveal started puts the message straight back", () => {
    const { engine, frames } = createEngine();

    engine.resize(900, 300);
    engine.decode();
    engine.resize(600, 300);

    expect(isMessageComplete(lastFrame(frames))).toBe(true);
  });

  test("static mode never schedules frames and shows the message at once", () => {
    const { engine, frames, scheduler } = createEngine(true);

    engine.resize(900, 300);
    engine.start();
    engine.decode();

    expect(scheduler.pendingCount).toBe(0);
    expect(isMessageComplete(lastFrame(frames))).toBe(true);
  });
});
