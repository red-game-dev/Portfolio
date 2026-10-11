import {
  clampLength,
  DEFAULT_GAMEPAD_CONFIG,
  readStick,
  releasedButtons,
  resolveGamepadConfig,
  STANDARD_AXES,
  STANDARD_BUTTONS,
  triggerTravel,
} from "@/packages/interaction/gamepad";

describe("readStick", () => {
  test("rests at exactly 0 inside a radial dead zone, even drifting on both axes", () => {
    const out = { x: 9, y: 9 };

    expect(readStick(out, 0.15, 0.09, 0.18, 0.95)).toEqual({ x: 0, y: 0 });
    expect(readStick(out, 0.12, 0.12, 0.18, 0.95)).toEqual({ x: 0, y: 0 });
    expect(readStick(out, 0.18, 0, 0.18, 0.95)).toEqual({ x: 0, y: 0 });
    expect(readStick(out, Number.NaN, 0, 0.18, 0.95)).toEqual({ x: 0, y: 0 });
  });

  test("writes into the stick it is given and reaches 1 at the rim, keeping the direction", () => {
    const out = { x: 0, y: 0 };

    expect(readStick(out, 0, 0.95, 0.18, 0.95)).toBe(out);
    expect(out).toEqual({ x: 0, y: 1 });

    readStick(out, -0.6, 0.8, 0.18, 0.95);
    expect(out.x).toBeCloseTo(-0.6, 10);
    expect(out.y).toBeCloseTo(0.8, 10);
  });
});

describe("clampLength", () => {
  test("shortens a lean past the limit and leaves a shorter one alone", () => {
    expect(clampLength({ x: 3, y: 4 }, 1)).toEqual({ x: 0.6, y: 0.8 });
    expect(clampLength({ x: 0.3, y: 0.4 }, 1)).toEqual({ x: 0.3, y: 0.4 });
  });
});

describe("triggerTravel", () => {
  test("reads a trigger at rest as 0 and squeezed all the way as 1", () => {
    expect(triggerTravel(0, 0.18)).toBe(0);
    expect(triggerTravel(0.18, 0.18)).toBe(0);
    expect(triggerTravel(0.59, 0.18)).toBeCloseTo(0.5, 10);
    expect(triggerTravel(1, 0.18)).toBe(1);
    expect(triggerTravel(1.2, 0.18)).toBe(1);
  });
});

describe("gamepad config", () => {
  test("starts from the defaults and keeps a host's settings to a range that reads", () => {
    expect(resolveGamepadConfig()).toEqual(DEFAULT_GAMEPAD_CONFIG);
    expect(resolveGamepadConfig({ deadZone: undefined, edge: 0.9 })).toEqual({ ...DEFAULT_GAMEPAD_CONFIG, edge: 0.9 });

    const extreme = resolveGamepadConfig({ deadZone: 2, edge: 0.1, triggerThreshold: -1 });

    expect(extreme).toMatchObject({ deadZone: 0.9, triggerThreshold: 0.01 });
    expect(extreme.edge).toBeCloseTo(0.95, 10);
  });

  test("lists the buttons and axes where the standard layout puts them", () => {
    expect(STANDARD_BUTTONS).toHaveLength(17);
    expect(STANDARD_BUTTONS.indexOf("a")).toBe(0);
    expect(STANDARD_BUTTONS.indexOf("rt")).toBe(7);
    expect(STANDARD_BUTTONS.indexOf("up")).toBe(12);
    expect(STANDARD_BUTTONS.indexOf("home")).toBe(16);
    expect(new Set(STANDARD_BUTTONS).size).toBe(STANDARD_BUTTONS.length);
    expect(Object.keys(releasedButtons()).sort()).toEqual([...STANDARD_BUTTONS].sort());
    expect(STANDARD_AXES).toEqual({ moveX: 0, moveY: 1, aimX: 2, aimY: 3 });
  });
});
