import { ButtonState, GamepadButtonName } from "../domain/types";

// The buttons in the order of the Gamepad API's standard layout, so a button's place in the list is its index.
export const STANDARD_BUTTONS: readonly GamepadButtonName[] = [
  "a",
  "b",
  "x",
  "y",
  "lb",
  "rb",
  "lt",
  "rt",
  "back",
  "start",
  "ls",
  "rs",
  "up",
  "down",
  "left",
  "right",
  "home",
];

// The axes of the standard layout: the left stick across and down, then the right.
export const STANDARD_AXES = { moveX: 0, moveY: 1, aimX: 2, aimY: 3 };

const released = (): ButtonState => ({ isDown: false, wentDown: false, wentUp: false, value: 0 });

// Every button let go, made once for an input to change in place from then on.
export const releasedButtons = (): Record<GamepadButtonName, ButtonState> => ({
  a: released(),
  b: released(),
  x: released(),
  y: released(),
  lb: released(),
  rb: released(),
  lt: released(),
  rt: released(),
  back: released(),
  start: released(),
  ls: released(),
  rs: released(),
  up: released(),
  down: released(),
  left: released(),
  right: released(),
  home: released(),
});
