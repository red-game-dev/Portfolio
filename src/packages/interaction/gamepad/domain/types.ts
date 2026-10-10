// A button on the standard layout, named by where it sits on a typical controller: the four face buttons (a at
// the bottom, b on the right, x on the left, y at the top), the bumpers and triggers, back and start, the sticks
// pressed in, the d-pad and the home button.
export type GamepadButtonName =
  | "a"
  | "b"
  | "x"
  | "y"
  | "lb"
  | "rb"
  | "lt"
  | "rt"
  | "back"
  | "start"
  | "ls"
  | "rs"
  | "up"
  | "down"
  | "left"
  | "right"
  | "home";

// One button as the Gamepad API reports it. A trigger's value runs from 0 to 1 as it is squeezed; a plain button's
// is 0 or 1.
export interface GamepadButtonLike {
  pressed: boolean;
  value: number;
}

// What a dual rumble asks of the two motors: the strong one is low and heavy, the weak one high and light, each
// from 0 to 1, for so many ms after so many ms.
export interface RumbleEffect {
  startDelay: number;
  duration: number;
  strongMagnitude: number;
  weakMagnitude: number;
}

// A controller's motors. Browsers without rumble leave it out, or leave out its method.
export interface GamepadActuatorLike {
  playEffect?(type: "dual-rumble", params: RumbleEffect): Promise<unknown>;
}

// What the input reads from a controller. The browser's Gamepad fits, and so does a plain object in a test.
export interface GamepadLike {
  index: number;
  connected: boolean;
  // "standard" when the browser knows the controller's layout, so its buttons sit where the names say.
  mapping: string;
  axes: readonly number[];
  buttons: readonly GamepadButtonLike[];
  vibrationActuator?: GamepadActuatorLike | null;
}

// Where the controllers come from: the browser's list, which holds null where one has gone.
export type GamepadSource = () => ReadonlyArray<GamepadLike | null>;

export type GamepadEventName = "gamepadconnected" | "gamepaddisconnected";

// A controller arriving or leaving, as the window announces it.
export interface GamepadEventLike {
  gamepad: GamepadLike;
}

// Where those announcements are heard: the window in a page, a small fake in a test.
export interface GamepadEventTarget {
  addEventListener(type: GamepadEventName, listener: (event: GamepadEventLike) => void): void;
  removeEventListener(type: GamepadEventName, listener: (event: GamepadEventLike) => void): void;
}

// A stick's lean on the screen's axes, each from -1 to 1 and y growing downwards, never longer than 1.
export interface Stick {
  x: number;
  y: number;
}

// One button this poll.
export interface ButtonState {
  // Whether it is held: pressed, or for a trigger, squeezed past the trigger threshold.
  isDown: boolean;
  // Whether it went down or came up since the last poll, so a press acts once.
  wentDown: boolean;
  wentUp: boolean;
  // How far it is pressed, from 0 to 1.
  value: number;
}

// Everything a controller says in one poll. The same object comes back every poll, changed in place, so a host
// reads it then and there rather than keeping it.
export interface GamepadState {
  // Which of the browser's controllers this is.
  index: number;
  // Whether the browser knows its layout. Without it the buttons are read where the standard layout puts them,
  // which most controllers follow anyway.
  isStandard: boolean;
  // Whether anything is being touched: a button held, a stick out of its dead zone or the brake squeezed. A host
  // can hand control to the controller when it is.
  isActive: boolean;
  // The left stick and the d-pad together.
  move: Stick;
  // The right stick.
  aim: Stick;
  // The right trigger squeezed past the threshold, or the right bumper held.
  fire: boolean;
  // How far the left trigger is squeezed past its dead zone, from 0 to 1.
  brake: number;
  buttons: Record<GamepadButtonName, ButtonState>;
}

export interface GamepadConfig {
  // How far a stick leans before it counts, as a share of full tilt measured round the circle, so a stick at rest
  // reads exactly 0 whichever way it drifts. A trigger's rest is cut off the same way.
  deadZone: number;
  // How far a stick leans to count as full tilt, so a worn stick that never quite reaches the rim still reads 1.
  edge: number;
  // How far a trigger is squeezed before it counts as down.
  triggerThreshold: number;
}

export interface GamepadInputOptions extends Partial<GamepadConfig> {
  // Where the controllers are read from: the browser's list by default.
  source?: GamepadSource;
  // Where controllers are heard arriving and leaving: the window by default, none on the server.
  target?: GamepadEventTarget | null;
  onConnect?: (pad: GamepadLike) => void;
  onDisconnect?: (pad: GamepadLike) => void;
}

// What a host binds buttons to: a name, a step, anything but null.
export type GamepadBindings<I> = Partial<Readonly<Record<GamepadButtonName, I>>>;
