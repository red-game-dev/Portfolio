import { ManualScheduler } from "@/packages/animation/frame-loop";
import { DrawableSurface } from "@/packages/graphics/canvas";
import { Animator, RigActor, RigModel, RigRenderer, RigSkin } from "@/packages/graphics/rig";

const fakeSurface = (width: number, height: number): DrawableSurface => {
  const surface = { width, height } as unknown as OffscreenCanvas;
  const context = { scale: () => undefined, translate: () => undefined, canvas: surface } as unknown as OffscreenCanvasRenderingContext2D;

  return { surface, context };
};

const recordingContext = () => {
  const draws: Array<{ x: number; y: number }> = [];
  let translation = { x: 0, y: 0 };
  const context = {
    canvas: { width: 0, height: 0 },
    save: () => undefined,
    restore: () => {
      translation = { x: 0, y: 0 };
    },
    translate: (x: number, y: number) => {
      translation = { x: translation.x + x, y: translation.y + y };
    },
    rotate: () => undefined,
    scale: () => undefined,
    setTransform: () => undefined,
    clearRect: () => undefined,
    drawImage: (_: unknown, x: number, y: number) => draws.push({ x: translation.x + x, y: translation.y + y }),
  } as unknown as CanvasRenderingContext2D;

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
});
