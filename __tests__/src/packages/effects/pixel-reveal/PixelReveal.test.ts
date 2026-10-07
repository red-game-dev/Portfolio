import { ManualScheduler } from "@/packages/animation/frame-loop";
import {
  frameAt,
  glyphFor,
  luminanceOf,
  PixelRevealEngine,
  PixelRevealFrame,
  PixelRevealRenderer,
  resolvePixelRevealConfig,
  totalDuration
} from "@/packages/effects/pixel-reveal";

const config = resolvePixelRevealConfig({ binaryMs: 1000, pixelsMs: 1000, enhanceMs: 1000, blockSizes: [16, 8, 4, 2] });

describe("effects/pixel-reveal timeline", () => {
  test("walks binary, pixels, enhance, then done", () => {
    expect(frameAt(0, config)).toEqual({ stage: "binary", progress: 0, blockSize: 16 });
    expect(frameAt(500, config).stage).toBe("binary");
    expect(frameAt(1000, config).stage).toBe("pixels");
    expect(frameAt(2500, config)).toEqual({ stage: "enhance", progress: 0.5, blockSize: 2 });
    expect(frameAt(totalDuration(config), config)).toEqual({ stage: "done", progress: 1, blockSize: 1 });
  });

  test("the mosaic sharpens through every block size in order", () => {
    const sizes = [1000, 1300, 1550, 1800, 1999].map((time) => frameAt(time, config).blockSize);

    expect(sizes).toEqual([16, 8, 4, 2, 2]);
  });

  test("time before the start is the first frame", () => {
    expect(frameAt(-50, config)).toEqual(frameAt(0, config));
  });
});

describe("effects/pixel-reveal luminance", () => {
  test("white is 1, black is 0, green outweighs blue", () => {
    const [white, black, green, blue] = luminanceOf([255, 255, 255, 255, 0, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

    expect(white).toBeCloseTo(1);
    expect(black).toBe(0);
    expect(green).toBeGreaterThan(blue);
  });

  test("a glyph holds still within its flicker window", () => {
    expect(glyphFor(42, 1000, 100)).toBe(glyphFor(42, 1099, 100));
    expect(["0", "1"]).toContain(glyphFor(7, 0, 100));
  });
});

describe("effects/pixel-reveal PixelRevealEngine", () => {
  const createEngine = (isStatic = false) => {
    const frames: PixelRevealFrame[] = [];
    const renderer: PixelRevealRenderer = { resize: jest.fn(), draw: (frame) => frames.push(frame) };
    const scheduler = new ManualScheduler();
    const onDone = jest.fn();
    const engine = new PixelRevealEngine(renderer, { config: { binaryMs: 100, pixelsMs: 100, enhanceMs: 100 }, isStatic, scheduler, onDone });

    engine.resize({ width: 160, height: 213 }, 2);

    return { engine, frames, scheduler, onDone };
  };

  test("holds the binary frame until played", () => {
    const { frames, scheduler } = createEngine();

    expect(frames).toHaveLength(1);
    expect(frames[0].stage).toBe("binary");
    expect(scheduler.pendingCount).toBe(0);
  });

  test("plays once to the end, then stops and reports done", () => {
    const { engine, frames, scheduler, onDone } = createEngine();

    engine.play();

    for (let time = 0; time <= 600; time += 34) {
      scheduler.tick(time);
    }

    expect(frames[frames.length - 1].stage).toBe("done");
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(engine.isRunning).toBe(false);

    engine.play();
    expect(engine.isRunning).toBe(false);
  });

  test("rewinds to the binary frame and plays again", () => {
    const { engine, frames, scheduler, onDone } = createEngine();

    engine.play();

    for (let time = 0; time <= 600; time += 34) {
      scheduler.tick(time);
    }

    engine.rewind();
    expect(frames[frames.length - 1].stage).toBe("binary");
    expect(engine.isDone).toBe(false);

    engine.play();

    for (let time = 700; time <= 1300; time += 34) {
      scheduler.tick(time);
    }

    expect(frames[frames.length - 1].stage).toBe("done");
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  test("a static engine stays on the finished picture when rewound", () => {
    const { engine, frames } = createEngine(true);

    engine.play();
    engine.rewind();
    expect(frames[frames.length - 1].stage).toBe("done");
  });

  test("reports each stage once, in order", () => {
    const stages: string[] = [];
    const renderer: PixelRevealRenderer = { resize: jest.fn(), draw: jest.fn() };
    const scheduler = new ManualScheduler();
    const engine = new PixelRevealEngine(renderer, {
      config: { binaryMs: 100, pixelsMs: 100, enhanceMs: 100 },
      scheduler,
      onStageChange: (stage) => stages.push(stage),
    });

    engine.resize({ width: 160, height: 213 });
    engine.play();

    for (let time = 0; time <= 600; time += 34) {
      scheduler.tick(time);
    }

    expect(stages).toEqual(["binary", "pixels", "enhance", "done"]);
  });

  test("static mode jumps to the finished picture without a loop", () => {
    const { engine, frames, scheduler, onDone } = createEngine(true);

    engine.play();

    expect(frames[frames.length - 1].stage).toBe("done");
    expect(scheduler.pendingCount).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
