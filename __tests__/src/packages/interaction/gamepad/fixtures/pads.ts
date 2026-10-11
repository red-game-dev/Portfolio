import {
  GamepadButtonLike,
  GamepadButtonName,
  GamepadEventLike,
  GamepadEventName,
  GamepadEventTarget,
  GamepadLike,
  STANDARD_BUTTONS,
} from "@/packages/interaction/gamepad";

export interface FakePad extends GamepadLike {
  axes: number[];
  buttons: GamepadButtonLike[];
}

// A connected controller on the standard layout with nothing touched.
export const fakePad = (index = 0, init: Partial<FakePad> = {}): FakePad => ({
  index,
  connected: true,
  mapping: "standard",
  axes: [0, 0, 0, 0],
  buttons: STANDARD_BUTTONS.map(() => ({ pressed: false, value: 0 })),
  ...init,
});

// A button pressed to `value`: 1 for a plain button, part of the way for a trigger, 0 to let it go.
export const press = (pad: FakePad, name: GamepadButtonName, value = 1) => {
  const button = pad.buttons[STANDARD_BUTTONS.indexOf(name)];

  button.pressed = value > 0;
  button.value = value;
};

export const release = (pad: FakePad, name: GamepadButtonName) => press(pad, name, 0);

// The sticks leant: the left one, and the right one where given.
export const lean = (pad: FakePad, moveX: number, moveY: number, aimX = 0, aimY = 0) => {
  pad.axes[0] = moveX;
  pad.axes[1] = moveY;
  pad.axes[2] = aimX;
  pad.axes[3] = aimY;
};

// The browser's list of controllers, changed by the test between polls.
export const padList = (...pads: Array<GamepadLike | null>) => {
  const list: Array<GamepadLike | null> = [...pads];

  return { list, source: () => list };
};

type Listener = (event: GamepadEventLike) => void;

// A window that only announces controllers, and can say how many listeners it holds.
export class FakeGamepadEvents implements GamepadEventTarget {
  private readonly listeners = new Map<GamepadEventName, Set<Listener>>();

  public addEventListener(type: GamepadEventName, listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();

    set.add(listener);
    this.listeners.set(type, set);
  }

  public removeEventListener(type: GamepadEventName, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  public count(type: GamepadEventName): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  public announce(type: GamepadEventName, gamepad: GamepadLike): void {
    this.listeners.get(type)?.forEach((listener) => listener({ gamepad }));
  }
}
