import { DrawableSurface, SpriteCache } from "@/packages/graphics/canvas";

// A stand in for a canvas: records its size and the scale it was given.
const fakeSurface = (width: number, height: number): DrawableSurface => {
  const surface = { width, height } as unknown as OffscreenCanvas;
  const context = { scale: jest.fn(), canvas: surface } as unknown as OffscreenCanvasRenderingContext2D;

  return { surface, context };
};

describe("graphics/canvas SpriteCache", () => {
  test("paints a frame once, at device resolution, and reuses it", () => {
    const cache = new SpriteCache({ width: 200, height: 240, scale: 1.5, createSurface: fakeSurface });
    const paint = jest.fn();
    const first = cache.get("head:open", paint);
    const second = cache.get("head:open", paint);

    expect(paint).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(first).toMatchObject({ width: 300, height: 360 });
  });

  test("drops the least recently used frame past its limit", () => {
    const cache = new SpriteCache({ width: 10, height: 10, scale: 1, maxEntries: 2, createSurface: fakeSurface });
    const paint = jest.fn();

    cache.get("a", paint);
    cache.get("b", paint);
    cache.get("a", paint);
    cache.get("c", paint);
    cache.get("a", paint);
    cache.get("b", paint);

    // a, b and c painted once each, then b again after it was dropped for c.
    expect(paint).toHaveBeenCalledTimes(4);
    expect(cache.size).toBe(2);
  });

  test("a new scale throws the old frames away", () => {
    const cache = new SpriteCache({ width: 10, height: 10, scale: 1, createSurface: fakeSurface });
    const paint = jest.fn();

    cache.get("a", paint);
    cache.rescale(2);
    cache.get("a", paint);
    cache.rescale(2);
    cache.get("a", paint);

    expect(paint).toHaveBeenCalledTimes(2);
  });

  test("without a surface to draw on, it returns nothing rather than throwing", () => {
    const cache = new SpriteCache({ width: 10, height: 10, scale: 1, createSurface: () => null });

    expect(cache.get("a", jest.fn())).toBeNull();
  });
});
