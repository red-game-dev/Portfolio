import { edgePoint, isCovered } from "@/packages/games/voyage/renderers/layers/pointer";

// A phone held upright, 390 by 844, with the ability bar down its right edge and the readout in its bottom right corner.
const WIDTH = 390;
const HEIGHT = 844;
const BAR = { left: 330, top: 265, right: 380, bottom: 580 };
const READOUT = { left: 209, top: 706, right: 380, bottom: 833 };

describe("the arrows at the screen's edge", () => {
  it("sit on the line towards what they point at, in from the edge, where nothing covers the view", () => {
    const arrow = edgePoint(WIDTH, HEIGHT, [], 2000, HEIGHT / 2);

    expect(arrow.x).toBeCloseTo(WIDTH - 46);
    expect(arrow.y).toBeCloseTo(HEIGHT / 2);
    expect(arrow.angle).toBeCloseTo(0);
  });

  it("move in along that line until they are clear of a panel over the view, still pointing the same way", () => {
    [[2000, HEIGHT / 2], [2000, HEIGHT / 2 - 300], [1000, 2400]].forEach(([x, y]) => {
      const bare = edgePoint(WIDTH, HEIGHT, [], x, y);
      const arrow = edgePoint(WIDTH, HEIGHT, [BAR, READOUT], x, y);

      expect(isCovered([BAR, READOUT], arrow.x, arrow.y)).toBe(false);
      expect(arrow.angle).toBeCloseTo(bare.angle);
      expect(Math.hypot(arrow.x - WIDTH / 2, arrow.y - HEIGHT / 2)).toBeLessThan(Math.hypot(bare.x - WIDTH / 2, bare.y - HEIGHT / 2));
    });
  });

  it("stay put where no panel is in the way", () => {
    const bare = edgePoint(WIDTH, HEIGHT, [], -2000, 0);
    const arrow = edgePoint(WIDTH, HEIGHT, [BAR, READOUT], -2000, 0);

    expect(arrow).toEqual(bare);
  });

  it("never come closer to the middle of the screen than a little way off the ship", () => {
    const wall = { left: 0, top: 0, right: WIDTH, bottom: HEIGHT };
    const arrow = edgePoint(WIDTH, HEIGHT, [wall], 2000, HEIGHT / 2);

    expect(Math.hypot(arrow.x - WIDTH / 2, arrow.y - HEIGHT / 2)).toBeGreaterThanOrEqual(56);
  });
});
