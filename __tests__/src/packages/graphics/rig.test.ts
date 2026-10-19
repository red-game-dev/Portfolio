import { ManualScheduler } from "@/packages/animation/frame-loop";
import { Animator, keepCamera, RigActor, RigModel, RigRenderer, RigSkin } from "@/packages/graphics/rig";

import { FakeContext2D, fakeSurface } from "../../fixtures/canvas";

const recordingContext = () => {
  const draws: Array<{ x: number; y: number }> = [];
  let translation = { x: 0, y: 0 };
  const context = Object.assign(new FakeContext2D(), {
    restore: () => {
      translation = { x: 0, y: 0 };
    },
    translate: (x: number, y: number) => {
      translation = { x: translation.x + x, y: translation.y + y };
    },
    drawImage: (_: unknown, x: number, y: number) => {
      draws.push({ x: translation.x + x, y: translation.y + y });
    },
  });

  return { context, draws };
};

interface Skin extends RigSkin {
  colour: string;
}

const SKINS: Skin[] = [{ id: "red", colour: "#f00" }, { id: "blue", colour: "#00f" }];

const paints: string[] = [];

const model: RigModel<Skin> = {
  id: "test",
  width: 100,
  height: 120,
  layers: [
    { id: "body", paint: (_, skin) => paints.push(`body:${skin.id}`), motion: (channels) => ({ y: channels.breath }) },
    { id: "head", keyChannels: ["blink"], paint: (_, skin, channels) => paints.push(`head:${skin.id}:${channels.blink}`) },
  ],
  channels: (timeMs, cues) => ({ breath: timeMs > 0 ? 2 : 0, blink: cues.progress("blink") === null ? 0 : 1 }),
  setup: (animator) => {
    animator.every("blink", 1000, 1000, 100);
  },
};

describe("graphics/rig", () => {
  beforeEach(() => {
    paints.length = 0;
  });

  test("the animator plays one shot cues and repeats others on their interval", () => {
    const animator = new Animator(() => 0.5).every("blink", 1000, 3000, 200);

    animator.play("talk", 500);
    animator.advance(250);
    expect(animator.progress("talk")).toBeCloseTo(0.5);
    expect(animator.progress("blink")).toBeNull();

    animator.advance(1750);
    expect(animator.progress("talk")).toBeNull();
    expect(animator.progress("blink")).toBe(0);

    animator.advance(100);
    expect(animator.progress("blink")).toBeCloseTo(0.5);
  });

  test("each layer is painted once per skin and step, then only blitted", () => {
    const renderer = new RigRenderer(model, { createSurface: fakeSurface });
    const { context } = recordingContext();

    renderer.rescale(2);
    renderer.draw(context, SKINS[0], { breath: 0, blink: 0 });
    renderer.draw(context, SKINS[0], { breath: 1, blink: 0 });
    renderer.draw(context, SKINS[0], { breath: 1, blink: 1 });
    renderer.draw(context, SKINS[1], { breath: 0, blink: 0 });

    expect(paints).toEqual(["body:red", "head:red:0", "head:red:1", "body:blue", "head:blue:0"]);
    expect(renderer.cachedFrames).toBe(5);
  });

  test("motion moves a cached layer in device pixels", () => {
    const renderer = new RigRenderer(model, { createSurface: fakeSurface });
    const { context, draws } = recordingContext();

    renderer.rescale(2);
    renderer.draw(context, SKINS[0], { breath: 3, blink: 0 });

    expect(draws[0]).toEqual({ x: 0, y: 6 });
    expect(draws[1]).toEqual({ x: 0, y: 0 });
  });

  test("a live layer is painted every frame and never cached", () => {
    const live: RigModel<Skin> = { ...model, layers: [{ id: "glow", cache: false, paint: (_, skin) => paints.push(`glow:${skin.id}`) }] };
    const renderer = new RigRenderer(live, { createSurface: fakeSurface });
    const { context } = recordingContext();

    renderer.draw(context, SKINS[0], {});
    renderer.draw(context, SKINS[0], {});

    expect(paints).toEqual(["glow:red", "glow:red"]);
    expect(renderer.cachedFrames).toBe(0);
  });

  test("an actor sizes its canvas, wears skins by id and runs the model's idle cues", () => {
    const { context } = recordingContext();
    const scheduler = new ManualScheduler();
    const actor = new RigActor(context, { model, skins: SKINS, scheduler, renderer: new RigRenderer(model, { createSurface: fakeSurface }) });

    actor.resize(50, 2);
    expect(context.canvas).toMatchObject({ width: 100, height: 120 });

    actor.setSkinById("blue");
    expect(actor.skin).toBe(1);

    actor.start();
    for (let frame = 0; frame < 40; frame += 1) {
      scheduler.tick(frame * 34);
    }

    expect(paints).toContain("head:blue:1");
  });

  test("an actor draws at the size its canvas is, should something size the canvas after it", () => {
    const { context } = recordingContext();
    const renderer = new RigRenderer(model, { createSurface: fakeSurface });
    const actor = new RigActor(context, { model, skins: SKINS, scheduler: new ManualScheduler(), renderer });
    const rescale = jest.spyOn(renderer, "rescale");

    actor.resize(model.width, 2);
    expect(rescale).toHaveBeenLastCalledWith(2);

    // Halved under it, as a move to a screen of half the density would.
    context.canvas.width = model.width;
    actor.renderStill();
    expect(rescale).toHaveBeenLastCalledWith(1);
  });

  test("a renderer that adopts a model with the same parts keeps the frames it cached", () => {
    const renderer = new RigRenderer(model, { createSurface: fakeSurface });
    const { context } = recordingContext();

    renderer.rescale(2);
    renderer.draw(context, SKINS[0], { breath: 0, blink: 0 });

    const cached = renderer.cachedFrames;

    renderer.adopt({ ...model });
    renderer.draw(context, SKINS[0], { breath: 0, blink: 0 });
    expect(renderer.cachedFrames).toBe(cached);
  });

  test("the camera never zooms out past the whole box, nor looks past its edges", () => {
    expect(keepCamera({ x: 0, y: 0, zoom: 2 }, 100, 120)).toEqual({ x: 25, y: 30, zoom: 2 });
    expect(keepCamera({ x: 90, y: 10, zoom: 0.5 }, 100, 120)).toEqual({ x: 50, y: 60, zoom: 1 });
  });

  test("a layer can draw another's cached frames, faded, and a layer faded out is not drawn", () => {
    const shared: RigModel<Skin> = {
      ...model,
      layers: [
        { id: "hand", paint: () => paints.push("hand") },
        { id: "shadow", cacheAs: "hand", paint: () => paints.push("shadow"), motion: () => ({ opacity: 0.5 }) },
        { id: "gone", paint: () => paints.push("gone"), motion: () => ({ opacity: 0 }) },
      ],
    };
    const renderer = new RigRenderer(shared, { createSurface: fakeSurface });
    const { context, draws } = recordingContext();

    renderer.draw(context, SKINS[0], {});

    expect(paints).toEqual(["hand"]);
    expect(renderer.cachedFrames).toBe(1);
    expect(draws).toHaveLength(2);
  });

  test("the camera moves every layer but a fixed one", () => {
    const placed: Array<{ x: number; y: number }> = [];
    let matrix = { scale: 1, x: 0, y: 0 };
    const context = Object.assign(new FakeContext2D(), {
      restore: () => {
        matrix = { scale: 1, x: 0, y: 0 };
      },
      translate: (x: number, y: number) => {
        matrix = { ...matrix, x: matrix.x + x * matrix.scale, y: matrix.y + y * matrix.scale };
      },
      scale: (by: number) => {
        matrix = { ...matrix, scale: matrix.scale * by };
      },
      drawImage: (_: unknown, x: number, y: number) => {
        placed.push({ x: matrix.x + x * matrix.scale, y: matrix.y + y * matrix.scale });
      },
    });
    const filmed: RigModel<Skin> = {
      ...model,
      camera: () => ({ x: 25, y: 30, zoom: 2 }),
      layers: [{ id: "scene", paint: () => undefined }, { id: "vignette", isFixed: true, paint: () => undefined }],
    };
    const renderer = new RigRenderer(filmed, { createSurface: fakeSurface });

    renderer.draw(context, SKINS[0], {});

    // Zoomed in twice on the box's top left quarter, its corner lands at the view's corner.
    expect(placed[0]).toEqual({ x: 0, y: 0 });
    expect(placed[1]).toEqual({ x: 0, y: 0 });

    filmed.camera = () => ({ x: 75, y: 90, zoom: 2 });
    placed.length = 0;
    renderer.draw(context, SKINS[0], {});

    expect(placed[0]).toEqual({ x: -100, y: -120 });
    expect(placed[1]).toEqual({ x: 0, y: 0 });
  });
});
