import { GamepadInput, GamepadLike, navigatorGamepads } from "@/packages/interaction/gamepad";

import { FakeGamepadEvents, fakePad, lean, padList, press, release } from "./fixtures/pads";

// An input on the given list of controllers, hearing no window.
const inputOn = (...pads: Array<GamepadLike | null>) => {
  const { list, source } = padList(...pads);

  return { list, input: new GamepadInput({ source, target: null }) };
};

describe("GamepadInput", () => {
  test("reads nothing when no controller is connected", () => {
    expect(inputOn().input.poll()).toBeNull();
    expect(inputOn().input.isConnected).toBe(false);
    expect(inputOn(null, fakePad(1, { connected: false })).input.poll()).toBeNull();
  });

  test("hands back the same state every poll, changed in place", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);
    const first = input.poll();

    lean(pad, 1, 0);

    expect(input.poll()).toBe(first);
    expect(input.isConnected).toBe(true);
  });

  test("rests at exactly 0 inside the dead zone, whichever way a stick drifts", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    lean(pad, 0.12, -0.12, -0.17, 0.02);

    expect(input.poll()?.move).toEqual({ x: 0, y: 0 });
    expect(input.poll()?.aim).toEqual({ x: 0, y: 0 });
  });

  test("reads full tilt as 1 and a diagonal no longer than 1", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    lean(pad, 1, 0, 0, -1);

    const state = input.poll();

    expect(state?.move).toEqual({ x: 1, y: 0 });
    expect(state?.aim).toEqual({ x: 0, y: -1 });

    lean(pad, 1, 1);

    const move = input.poll()?.move ?? { x: 0, y: 0 };

    expect(Math.hypot(move.x, move.y)).toBeCloseTo(1, 10);
    expect(move.x).toBeCloseTo(Math.SQRT1_2, 10);
    expect(move.y).toBeCloseTo(Math.SQRT1_2, 10);
  });

  test("starts again from 0 past the dead zone, with no jump where it ends", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    lean(pad, 0.19, 0);
    expect(input.poll()?.move.x).toBeCloseTo(0.013, 3);

    lean(pad, 0, 0.565);
    expect(input.poll()?.move.y).toBeCloseTo(0.5, 10);

    const soft = new GamepadInput({ source: () => [pad], target: null, deadZone: 0, edge: 1 });

    expect(soft.poll()?.move.y).toBeCloseTo(0.565, 10);
  });

  test("folds the d-pad into the left stick, never longer than 1", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    press(pad, "right");
    expect(input.poll()?.move).toEqual({ x: 1, y: 0 });

    press(pad, "up");

    const diagonal = input.poll()?.move ?? { x: 0, y: 0 };

    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2, 10);
    expect(diagonal.y).toBeCloseTo(-Math.SQRT1_2, 10);

    release(pad, "up");
    lean(pad, 0.565, 0);
    expect(input.poll()?.move).toEqual({ x: 1, y: 0 });

    release(pad, "right");
    press(pad, "left");
    expect(input.poll()?.move.x).toBeCloseTo(-0.5, 10);
  });

  test("marks a press once, however many polls it is held, and its release once", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    expect(input.poll()?.buttons.a).toEqual({ isDown: false, wentDown: false, wentUp: false, value: 0 });

    press(pad, "a");
    expect(input.poll()?.buttons.a).toEqual({ isDown: true, wentDown: true, wentUp: false, value: 1 });
    expect(input.poll()?.buttons.a).toEqual({ isDown: true, wentDown: false, wentUp: false, value: 1 });

    release(pad, "a");
    expect(input.poll()?.buttons.a).toEqual({ isDown: false, wentDown: false, wentUp: true, value: 0 });
    expect(input.poll()?.buttons.a.wentUp).toBe(false);

    press(pad, "a");
    expect(input.poll()?.buttons.a.wentDown).toBe(true);
  });

  test("counts a button already down when a controller is first read as held, not pressed, and again after a reset", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    press(pad, "start");
    expect(input.poll()?.buttons.start).toMatchObject({ isDown: true, wentDown: false });

    release(pad, "start");
    input.poll();
    press(pad, "start");
    input.reset();
    expect(input.poll()?.buttons.start).toMatchObject({ isDown: true, wentDown: false });
  });

  test("fires on the right trigger past its threshold or the right bumper, and brakes on the left trigger", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    input.poll();
    press(pad, "rt", 0.4);

    let state = input.poll();

    expect(state?.fire).toBe(false);
    expect(state?.buttons.rt).toMatchObject({ isDown: false, value: 0.4 });

    press(pad, "rt", 0.6);
    state = input.poll();
    expect(state?.fire).toBe(true);
    expect(state?.buttons.rt).toMatchObject({ isDown: true, wentDown: true });

    release(pad, "rt");
    press(pad, "rb");
    expect(input.poll()?.fire).toBe(true);

    release(pad, "rb");
    press(pad, "lt", 0.1);
    state = input.poll();
    expect(state?.fire).toBe(false);
    expect(state?.brake).toBe(0);

    press(pad, "lt", 0.59);
    expect(input.poll()?.brake).toBeCloseTo(0.5, 10);

    press(pad, "lt", 1);
    expect(input.poll()?.brake).toBe(1);

    const early = new GamepadInput({ source: () => [pad], target: null, triggerThreshold: 0.2 });

    press(pad, "rt", 0.3);
    expect(early.poll()?.fire).toBe(true);
  });

  test("says whether anything is being touched", () => {
    const pad = fakePad();
    const { input } = inputOn(pad);

    expect(input.poll()?.isActive).toBe(false);

    lean(pad, 0, 0, 0.5, 0);
    expect(input.poll()?.isActive).toBe(true);

    lean(pad, 0, 0);
    press(pad, "y");
    expect(input.poll()?.isActive).toBe(true);

    release(pad, "y");
    press(pad, "lt", 0.5);
    expect(input.poll()?.isActive).toBe(true);
  });

  test("keeps the controller in use until another has a press while it has none", () => {
    const first = fakePad(0);
    const second = fakePad(1);
    const { input } = inputOn(first, second);

    expect(input.poll()?.index).toBe(0);

    press(first, "a");
    press(second, "b");
    expect(input.poll()?.index).toBe(0);

    release(first, "a");

    const state = input.poll();

    expect(state?.index).toBe(1);
    expect(state?.buttons.b).toMatchObject({ isDown: true, wentDown: false });
  });

  test("moves to another controller when the one in use goes, preferring a layout the browser knows", () => {
    const odd = fakePad(0, { mapping: "" });
    const known = fakePad(2);
    const { list, input } = inputOn(odd, null, known);

    expect(input.poll()?.index).toBe(2);
    expect(input.poll()?.isStandard).toBe(true);

    list[2] = null;
    expect(input.poll()).toMatchObject({ index: 0, isStandard: false });
  });

  test("reads a missing axis or button as at rest", () => {
    const pad = fakePad(0, { axes: [Number.NaN], buttons: [{ pressed: true, value: 1 }] });
    const state = inputOn(pad).input.poll();

    expect(state?.move).toEqual({ x: 0, y: 0 });
    expect(state?.buttons.a.isDown).toBe(true);
    expect(state?.buttons.home.isDown).toBe(false);
  });
});

describe("GamepadInput connections", () => {
  test("tells the host when a controller arrives and leaves, until it is disposed", () => {
    const events = new FakeGamepadEvents();
    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    const pad = fakePad();
    const input = new GamepadInput({ source: () => [], target: events, onConnect, onDisconnect });

    events.announce("gamepadconnected", pad);
    events.announce("gamepaddisconnected", pad);

    expect(onConnect).toHaveBeenCalledWith(pad);
    expect(onDisconnect).toHaveBeenCalledWith(pad);

    input.dispose();

    expect(events.count("gamepadconnected")).toBe(0);
    expect(events.count("gamepaddisconnected")).toBe(0);

    events.announce("gamepadconnected", pad);
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  test("hears the window by default", () => {
    const onConnect = jest.fn();
    const pad = fakePad();
    const input = new GamepadInput({ source: () => [], onConnect });
    const announce = () => {
      const event = new Event("gamepadconnected");

      Object.defineProperty(event, "gamepad", { value: pad });
      window.dispatchEvent(event);
    };

    announce();
    expect(onConnect).toHaveBeenCalledWith(pad);

    input.dispose();
    announce();
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  test("forgets the controller in use when it leaves, so one back at its place is read afresh", () => {
    const events = new FakeGamepadEvents();
    const pad = fakePad();
    const input = new GamepadInput({ source: () => [pad], target: events });

    input.poll();
    press(pad, "a");
    events.announce("gamepaddisconnected", pad);

    expect(input.poll()?.buttons.a).toMatchObject({ isDown: true, wentDown: false });
  });
});

describe("GamepadInput rumble", () => {
  test("rumbles both motors of the controller in use, kept to what a browser takes", () => {
    const playEffect = jest.fn().mockResolvedValue("complete");
    const pad = fakePad(0, { vibrationActuator: { playEffect } });
    const { input } = inputOn(pad);

    expect(input.rumble(0.6, 120)).toBe(true);
    expect(playEffect).toHaveBeenCalledWith("dual-rumble", { startDelay: 0, duration: 120, strongMagnitude: 0.6, weakMagnitude: 0.6 });

    input.rumble(3, 60000);
    expect(playEffect).toHaveBeenLastCalledWith("dual-rumble", { startDelay: 0, duration: 5000, strongMagnitude: 1, weakMagnitude: 1 });

    expect(input.rumble(0, 100)).toBe(false);
    expect(input.rumble(1, 0)).toBe(false);
    expect(input.rumble(Number.NaN, 100)).toBe(false);
    expect(playEffect).toHaveBeenCalledTimes(2);
  });

  test("does nothing, and breaks nothing, without a controller, a motor or a willing browser", async () => {
    expect(inputOn().input.rumble(1, 100)).toBe(false);
    expect(inputOn(fakePad()).input.rumble(1, 100)).toBe(false);
    expect(inputOn(fakePad(0, { vibrationActuator: null })).input.rumble(1, 100)).toBe(false);
    expect(inputOn(fakePad(0, { vibrationActuator: {} })).input.rumble(1, 100)).toBe(false);

    const throwing = jest.fn(() => {
      throw new Error("not allowed");
    });

    expect(inputOn(fakePad(0, { vibrationActuator: { playEffect: throwing } })).input.rumble(1, 100)).toBe(false);

    const refusing = jest.fn().mockRejectedValue(new Error("in the background"));

    expect(inputOn(fakePad(0, { vibrationActuator: { playEffect: refusing } })).input.rumble(1, 100)).toBe(true);
    await Promise.resolve();
  });
});

describe("navigatorGamepads", () => {
  test("reads no controllers where the browser has no list or refuses to read it", () => {
    expect(navigatorGamepads()).toEqual([]);

    Object.defineProperty(window.navigator, "getGamepads", {
      configurable: true,
      value: () => {
        throw new Error("blocked by permissions policy");
      },
    });
    expect(navigatorGamepads()).toEqual([]);

    const pad = fakePad();

    Object.defineProperty(window.navigator, "getGamepads", { configurable: true, value: () => [null, pad] });
    expect(navigatorGamepads()).toEqual([null, pad]);
    expect(new GamepadInput({ target: null }).poll()?.index).toBe(0);

    Reflect.deleteProperty(window.navigator, "getGamepads");
  });
});
