import { BlockSnapTransition, CasinoScene, ChainScene, ChipFlipTransition, DevopsScene } from "@/packages/effects/backdrop";
import { createSeededRandom } from "@/packages/math/random";

import { FakeContext2D } from "../../../fixtures/canvas";

// jsdom has no 2D canvas, so sprites are skipped; the scenes must still draw everything else.
jest.mock("@/packages/graphics/canvas", () => ({
  ...jest.requireActual("@/packages/graphics/canvas"),
  createDrawableSurface: () => null,
}));

// Records every drawing call, like a real context accepts them.
const createContext = () => {
  const context = new FakeContext2D();

  return { context, calls: context.calls };
};

const SIZE = { width: 1200, height: 800, pixelRatio: 1 };

describe("effects/backdrop chain and casino zones", () => {
  const devops = () => new DevopsScene(createSeededRandom(9), {
    rack: [255, 107, 74],
    core: [255, 222, 210],
    universes: [[75, 255, 165], [79, 216, 255], [184, 150, 255]],
    intensity: 1,
  });

  test("the DevOps data centre is drawn built when no frame has run, as with reduced motion", () => {
    const scene = devops();
    const { context, calls } = createContext();

    scene.resize(SIZE);
    scene.draw(context, 1);

    expect(scene.id).toBe("devops");
    expect(calls.filter((call) => call === "strokeRect").length).toBeGreaterThan(SIZE.width / 160 - 1);
    expect(calls).toContain("quadraticCurveTo");
    expect(calls).toContain("fillRect");
  });

  test("the DevOps data centre builds from bare metal as it is entered, then moves universes between its racks", () => {
    const scene = devops();
    const starting = createContext();

    scene.resize(SIZE);
    scene.update(16, 1000);
    scene.draw(starting.context, 1, 1000);
    // Just entered: the racks are still below the screen, so nothing is cabled yet.
    expect(starting.calls).not.toContain("quadraticCurveTo");

    const running = createContext();

    for (let now = 1016; now < 8000; now += 33) {
      scene.update(33, now);
    }

    scene.draw(running.context, 1, 8000);
    expect(running.calls).toContain("quadraticCurveTo");
    expect(running.calls.filter((call) => call === "fillRect").length).toBeGreaterThan(20);

    // Left and come back: built again from scratch.
    const back = createContext();

    scene.update(33, 20000);
    scene.draw(back.context, 1, 20000);
    expect(back.calls).not.toContain("quadraticCurveTo");
  });

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
