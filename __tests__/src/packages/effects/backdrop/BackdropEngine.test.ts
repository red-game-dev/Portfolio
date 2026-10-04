import { ManualScheduler } from "@/packages/animation/frame-loop";
import { BackdropEngine, Scene } from "@/packages/effects/backdrop";
import { Canvas2DContext } from "@/packages/graphics/canvas";

interface RecordingScene extends Scene {
  draws: number[];
  updates: number;
}

const createScene = (id: string): RecordingScene => ({
  id,
  draws: [],
  updates: 0,
  resize: jest.fn(),
  update() {
    this.updates += 1;
  },
  draw(_context, alpha) {
    this.draws.push(alpha);
  },
});

// Only the calls the compositor makes; nothing is actually painted.
const createContext = () => ({
  canvas: { width: 0, height: 0 },
  globalAlpha: 1,
  fillStyle: "",
  setTransform: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
}) as unknown as Canvas2DContext;

const setup = (isStatic = false) => {
  const matrix = createScene("matrix");
  const ai = createScene("ai");
  const scheduler = new ManualScheduler();
  const engine = new BackdropEngine(createContext(), {
    initialScene: "matrix",
    scenes: [() => matrix, () => ai],
    config: { fadeMs: 1000, framesPerSecond: 30 },
    isStatic,
    scheduler,
  });

  engine.resize(800, 600);

  return { engine, matrix, ai, scheduler };
};

describe("effects/backdrop BackdropEngine", () => {
  test("refuses an initial scene it does not have", () => {
    expect(() => new BackdropEngine(createContext(), { initialScene: "nope", scenes: [() => createScene("matrix")] }))
      .toThrow('no scene "nope"');
  });

  test("only the current scene is updated when nothing is fading", () => {
    const { engine, matrix, ai, scheduler } = setup();

    engine.start();
    [0, 40, 80].forEach((time) => scheduler.tick(time));

    expect(matrix.updates).toBeGreaterThan(0);
    expect(ai.updates).toBe(0);
  });

  test("a scene change crossfades both scenes, then drops the old one", () => {
    const { engine, matrix, ai, scheduler } = setup();
    const start = performance.now();

    engine.start();
    engine.setScene("ai");
    scheduler.tick(start + 500);

    expect(matrix.draws[matrix.draws.length - 1]).toBeGreaterThan(0);
    expect(ai.draws[ai.draws.length - 1]).toBeGreaterThan(0);

    scheduler.tick(start + 1100);
    const matrixDraws = matrix.draws.length;

    scheduler.tick(start + 1200);

    expect(matrix.draws.length).toBe(matrixDraws);
    expect(ai.draws[ai.draws.length - 1]).toBe(1);
  });

  test("unknown scene ids are ignored", () => {
    const { engine, ai } = setup();

    engine.setScene("nowhere");

    expect(ai.draws).toHaveLength(0);
  });

  test("static mode never schedules frames and switches scenes without a fade", () => {
    const { engine, matrix, ai, scheduler } = setup(true);

    engine.start();
    engine.setScene("ai");

    expect(scheduler.pendingCount).toBe(0);
    expect(ai.draws).toEqual([1]);
    expect(matrix.draws).toEqual([1]);
  });
});
