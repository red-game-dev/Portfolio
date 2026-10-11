import { GamepadInput, GamepadMap } from "@/packages/interaction/gamepad";

import { fakePad, press, release } from "./fixtures/pads";

describe("GamepadMap", () => {
  const map = new GamepadMap({ a: "boost", x: "map", rb: "fire", rt: "fire", start: "pause" });
  const setup = () => {
    const pad = fakePad();
    const input = new GamepadInput({ source: () => [pad], target: null });
    const poll = () => {
      const state = input.poll();

      if (state === null) {
        throw new Error("no controller");
      }

      return state;
    };

    poll();

    return { pad, poll };
  };

  test("names the intent of a bound button and nothing for any other", () => {
    expect(map.intentOf("a")).toBe("boost");
    expect(map.intentOf("rt")).toBe("fire");
    expect(map.intentOf("b")).toBeNull();
  });

  test("answers the intents whose buttons went down this poll, and none while they are held", () => {
    const { pad, poll } = setup();

    expect(map.pressed(poll())).toEqual([]);

    press(pad, "a");
    press(pad, "start");
    expect(map.pressed(poll())).toEqual(["boost", "pause"]);
    expect(map.pressed(poll())).toEqual([]);

    release(pad, "a");
    expect(map.pressed(poll())).toEqual([]);

    press(pad, "a");
    expect(map.pressed(poll())).toEqual(["boost"]);
  });

  test("answers an intent once when two of its buttons go down together", () => {
    const { pad, poll } = setup();

    press(pad, "rb");
    press(pad, "rt", 1);
    expect(map.pressed(poll())).toEqual(["fire"]);
  });

  test("fills the same list on every call", () => {
    const { poll } = setup();

    expect(map.pressed(poll())).toBe(map.pressed(poll()));
  });

  test("says whether any button bound to an intent is held", () => {
    const { pad, poll } = setup();

    expect(map.isHeld(poll(), "fire")).toBe(false);

    press(pad, "rt", 0.8);
    expect(map.isHeld(poll(), "fire")).toBe(true);
    expect(map.isHeld(poll(), "boost")).toBe(false);

    release(pad, "rt");
    press(pad, "rb");
    expect(map.isHeld(poll(), "fire")).toBe(true);
  });

  test("takes any intent but null, and leaves out a button bound to nothing", () => {
    const steps = new GamepadMap({ left: -1, right: 1, up: undefined });

    expect(steps.intentOf("left")).toBe(-1);
    expect(steps.intentOf("up")).toBeNull();
  });
});
