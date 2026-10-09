import { lensedSource } from "@/packages/graphics/webgl";

describe("graphics/webgl lens", () => {
  const lens = { x: 0, y: 0, shadow: 10, einstein: 20 };

  test("far from a lens, light comes nearly straight", () => {
    const source = lensedSource(1000, 0, [lens]);

    expect(source.x).toBeCloseTo(999.6, 1);
    expect(source.y).toBeCloseTo(0, 10);
  });

  test("at the Einstein radius the light comes from straight behind the lens: the ring", () => {
    const source = lensedSource(20, 0, [lens]);

    expect(source.x).toBeCloseTo(0, 10);
  });

  test("inside the ring the image comes from the far side, flipped, which draws a disk's far side over the top", () => {
    expect(lensedSource(10, 0, [lens]).x).toBeLessThan(0);
    expect(lensedSource(0, -10, [lens]).y).toBeGreaterThan(0);
  });

  test("several lenses add up", () => {
    const one = lensedSource(50, 0, [lens]);
    const two = lensedSource(50, 0, [lens, { x: 100, y: 0, shadow: 10, einstein: 20 }]);

    expect(two.x).not.toBeCloseTo(one.x, 3);
  });
});
