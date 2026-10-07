import { createHeroModel, DEFAULT_HERO_CLASSES, HeroPainter, DEFAULT_HERO_LOOK } from "@/packages/games/heroes";

// A context that accepts any drawing call, to prove every class paints without throwing.
const anyContext = () => new Proxy({}, {
  get: (_, key) => (key === "createLinearGradient" || key === "createRadialGradient" ? () => ({ addColorStop: () => undefined }) : () => undefined),
  set: () => true,
}) as unknown as CanvasRenderingContext2D;

describe("games/heroes", () => {
  test("every class has a unique id", () => {
    const ids = DEFAULT_HERO_CLASSES.map((hero) => hero.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every layer of every class paints in every pose without throwing", () => {
    const model = createHeroModel();
    const painter = new HeroPainter(DEFAULT_HERO_LOOK);

    DEFAULT_HERO_CLASSES.forEach((hero) => {
      [0, 1, 2].forEach((blink) => {
        model.layers.forEach((layer) => {
          expect(() => layer.paint(anyContext(), hero, { blink, glow: 5, pulse: 1, breath: 0, sway: 0, bob: 0 })).not.toThrow();
        });
      });
      expect(() => painter.paintAura(anyContext(), hero, 0.5)).not.toThrow();
    });
  });

  test("the glow pulses through whole steps and he blinks when the cue plays", () => {
    const model = createHeroModel();
    const idle = { progress: () => null };
    const glows = Array.from({ length: 30 }, (_, index) => model.channels(index * 100, idle).glow);

    expect(glows.every((glow) => Number.isInteger(glow) && glow >= 0 && glow <= 5)).toBe(true);
    expect(new Set(glows).size).toBeGreaterThan(2);
    expect(model.channels(0, { progress: (cue: string) => (cue === "blink" ? 0.5 : null) }).blink).toBe(2);
  });
});
