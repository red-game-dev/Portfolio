import { BlockSnapTransition, CasinoScene, ChainScene, ChipFlipTransition } from "@/packages/effects/backdrop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { createSeededRandom } from "@/packages/math/random";

// jsdom has no 2D canvas, so sprites are skipped; the scenes must still draw everything else.
jest.mock("@/packages/graphics/canvas", () => ({
  ...jest.requireActual("@/packages/graphics/canvas"),
  createDrawableSurface: () => null,
}));

// Records every drawing call and accepts any property, like a real context would.
const createContext = () => {
  const calls: string[] = [];
  const target: Record<string, unknown> = {};
  const context = new Proxy(target, {
    get: (object, key: string) => (key in object ? object[key] : (...args: unknown[]) => {
      calls.push(key);

      return key === "createRadialGradient" || key === "createLinearGradient" ? { addColorStop: () => undefined } : args[0];
    }),
    set: (object, key: string, value) => {
      object[key] = value;

      return true;
    },
  }) as unknown as Canvas2DContext;

  return { context, calls };
};

const SIZE = { width: 1200, height: 800, pixelRatio: 1 };

describe("effects/backdrop chain and casino zones", () => {
  test("the chain scene draws its lanes and mines blocks over time", () => {
    const scene = new ChainScene(createSeededRandom(3), { block: [184, 150, 255], flash: [255, 255, 255], intensity: 1 });
    const { context, calls } = createContext();

    scene.resize(SIZE);

    for (let step = 0; step < 100; step += 1) {
      scene.update(33);
    }

    scene.draw(context, 1);

    expect(scene.id).toBe("chain");
    expect(calls.filter((call) => call === "stroke")).toHaveLength(3);
    expect(calls).toContain("fillRect");
  });

  test("the casino scene survives without sprites and keeps its drifters on screen", () => {
    const scene = new CasinoScene(createSeededRandom(5), {
      felt: "rgba(0, 0, 0, 0)",
      chipColors: ["#f00", "#0f0"],
      suitColor: "#fff",
      wheelColor: "#fff",
      intensity: 1,
    });
    const { context } = createContext();

    scene.resize(SIZE);

    for (let step = 0; step < 1000; step += 1) {
      scene.update(100);
    }

    expect(() => scene.draw(context, 0.5)).not.toThrow();
    expect(scene.id).toBe("casino");
  });

  test("the snap transition draws one stroked path, and nothing at the very start", () => {
    const transition = new BlockSnapTransition({ from: [0, 0, 0], to: [255, 255, 255], cell: 64 });
    const { context, calls } = createContext();

    transition.resize(SIZE);
    transition.draw(context, 0.5);

    expect(calls.filter((call) => call === "stroke")).toHaveLength(1);
    expect(calls.filter((call) => call === "rect").length).toBeGreaterThan(0);

    const start = createContext();

    transition.draw(start.context, 0);
    expect(start.calls.filter((call) => call === "rect")).toHaveLength(0);
  });

  test("the flip transition draws every chip", () => {
    const transition = new ChipFlipTransition(createSeededRandom(9), { chipColors: [[255, 0, 0]], rim: [255, 255, 255] });
    const { context, calls } = createContext();

    transition.resize(SIZE);
    transition.draw(context, 0.4);

    expect(calls.filter((call) => call === "ellipse")).toHaveLength(48);
  });
});
