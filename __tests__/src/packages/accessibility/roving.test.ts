import { rovingTarget } from "@/packages/accessibility/roving";

describe("rovingTarget", () => {
  test("arrows step forward and back, wrapping at either end", () => {
    expect(rovingTarget("ArrowRight", 0, 3)).toBe(1);
    expect(rovingTarget("ArrowDown", 2, 3)).toBe(0);
    expect(rovingTarget("ArrowLeft", 0, 3)).toBe(2);
    expect(rovingTarget("ArrowUp", 2, 3)).toBe(1);
  });

  test("Home and End jump to the first and last", () => {
    expect(rovingTarget("Home", 2, 5)).toBe(0);
    expect(rovingTarget("End", 0, 5)).toBe(4);
  });

  test("a row without ends leaves Home and End to the browser and still steps with the arrows", () => {
    expect(rovingTarget("Home", 2, 5, { ends: false })).toBeNull();
    expect(rovingTarget("End", 0, 5, { ends: false })).toBeNull();
    expect(rovingTarget("ArrowRight", 4, 5, { ends: false })).toBe(0);
  });

  test("other keys and empty rows move nowhere", () => {
    expect(rovingTarget("Enter", 1, 3)).toBeNull();
    expect(rovingTarget("ArrowRight", 0, 0)).toBeNull();
  });
});
