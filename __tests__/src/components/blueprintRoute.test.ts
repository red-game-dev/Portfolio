import { Box, routeBetween } from "@/components/Blueprint/utils/route";

const box = (left: number, top: number, width = 100, height = 40): Box => ({ left, top, right: left + width, bottom: top + height });

describe("routeBetween", () => {
  test("boxes in a row join with a straight line from facing edges", () => {
    expect(routeBetween(box(0, 0), box(200, 0))).toEqual({ d: "M100,20 L200,20", mid: { x: 150, y: 20 } });
  });

  test("a box to the left is reached from the left edge", () => {
    expect(routeBetween(box(200, 0), box(0, 0))?.d).toBe("M200,20 L100,20");
  });

  test("boxes in a column join with a straight vertical line through their shared width", () => {
    expect(routeBetween(box(0, 0), box(50, 100))).toEqual({ d: "M75,40 L75,100", mid: { x: 75, y: 70 } });
  });

  test("offset boxes get a curve whose label sits on the curve", () => {
    const route = routeBetween(box(0, 0), box(300, 200));

    expect(route?.d).toBe("M100,20 C200,20 200,220 300,220");
    expect(route?.mid).toEqual({ x: 200, y: 120 });
  });

  test("overlapping boxes, such as a node inside its own group, have no route", () => {
    expect(routeBetween(box(0, 0, 300, 300), box(20, 20))).toBeNull();
  });
});
