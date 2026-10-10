import { clamp, clamp01 } from "@/packages/math/clamp";

import { releasedButtons, STANDARD_AXES, STANDARD_BUTTONS } from "../config/buttons";
import { resolveGamepadConfig } from "../config/defaults";
import {
  GamepadButtonName,
  GamepadConfig,
  GamepadEventLike,
  GamepadEventTarget,
  GamepadInputOptions,
  GamepadLike,
  GamepadSource,
  GamepadState,
} from "../domain/types";
import { navigatorGamepads, windowGamepadEvents } from "../sources/navigator";
import { axisAt, clampLength, readStick, triggerTravel } from "../utils/sticks";

// Browsers cap how long one rumble lasts; Chrome at five seconds.
const MAX_RUMBLE_MS = 5000;

const ignore = () => undefined;

const isTrigger = (name: GamepadButtonName) => name === "lt" || name === "rt";

// Whether any of a controller's buttons is pressed.
const isPressing = (pad: GamepadLike): boolean => {
  for (const button of pad.buttons) {
    if (button.pressed) {
      return true;
    }
  }

  return false;
};

// Reads a controller through the Gamepad API. Browsers do not announce stick and button changes, so the host
// polls once a frame and gets back one state: both sticks through a radial dead zone, the d-pad folded into the
// left stick, fire and brake from the triggers, and every button of the standard layout with whether it is held
// and whether it went down or came up since the last poll, so a press acts once however many frames it is held.
// The controller in use is kept until another has a button pressed while it has none, so whichever one the reader
// picks up takes over. Buttons already down on a controller the first time it is read count as held, not pressed:
// the press that wakes a controller (browsers show one only after a press) does not also act. A poll allocates
// nothing: the state is made once and changed in place.
export class GamepadInput {
  private readonly config: GamepadConfig;
  private readonly source: GamepadSource;
  private readonly target: GamepadEventTarget | null;
  private readonly onConnect: ((pad: GamepadLike) => void) | null;
  private readonly onDisconnect: ((pad: GamepadLike) => void) | null;
  private readonly state: GamepadState = {
    index: 0,
    isStandard: false,
    isActive: false,
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    fire: false,
    brake: 0,
    buttons: releasedButtons(),
  };
  // The controller read last poll, or null when the next one read is new to the input.
  private padIndex: number | null = null;

  constructor(options: GamepadInputOptions = {}) {
    this.config = resolveGamepadConfig(options);
    this.source = options.source ?? navigatorGamepads;
    this.target = options.target === undefined ? windowGamepadEvents() : options.target;
    this.onConnect = options.onConnect ?? null;
    this.onDisconnect = options.onDisconnect ?? null;
    this.target?.addEventListener("gamepadconnected", this.connected);
    this.target?.addEventListener("gamepaddisconnected", this.disconnected);
  }

  // Whether a controller is connected now, read from the browser's list rather than the last poll.
  public get isConnected(): boolean {
    return this.find() !== null;
  }

  // The controller in use this frame, or null when none is connected.
  public poll(): GamepadState | null {
    const pad = this.find();

    if (pad === null) {
      this.padIndex = null;

      return null;
    }

    const { deadZone, edge, triggerThreshold } = this.config;
    const { state } = this;
    const { buttons, move, aim } = state;
    const isFresh = pad.index !== this.padIndex;
    let isHolding = false;

    this.padIndex = pad.index;

    for (let index = 0; index < STANDARD_BUTTONS.length; index += 1) {
      const name = STANDARD_BUTTONS[index];
      const button = buttons[name];
      const raw = pad.buttons[index];
      const value = raw !== undefined && Number.isFinite(raw.value) ? clamp01(raw.value) : 0;
      const isDown = raw !== undefined && (isTrigger(name) ? value >= triggerThreshold : raw.pressed);

      button.wentDown = isDown && !button.isDown && !isFresh;
      button.wentUp = !isDown && button.isDown && !isFresh;
      button.isDown = isDown;
      button.value = value;
      isHolding = isHolding || isDown;
    }

    readStick(move, axisAt(pad, STANDARD_AXES.moveX), axisAt(pad, STANDARD_AXES.moveY), deadZone, edge);
    readStick(aim, axisAt(pad, STANDARD_AXES.aimX), axisAt(pad, STANDARD_AXES.aimY), deadZone, edge);

    const padX = (buttons.right.isDown ? 1 : 0) - (buttons.left.isDown ? 1 : 0);
    const padY = (buttons.down.isDown ? 1 : 0) - (buttons.up.isDown ? 1 : 0);

    if (padX !== 0 || padY !== 0) {
      move.x += padX;
      move.y += padY;
      clampLength(move, 1);
    }

    state.index = pad.index;
    state.isStandard = pad.mapping === "standard";
    state.fire = buttons.rt.isDown || buttons.rb.isDown;
    state.brake = triggerTravel(buttons.lt.value, deadZone);
    state.isActive = isHolding || move.x !== 0 || move.y !== 0 || aim.x !== 0 || aim.y !== 0 || state.brake > 0;

    return state;
  }

  // Forgets what was down, so on the next poll buttons held then count as held and not pressed: for a run that
  // resumes after the host stopped polling.
  public reset(): void {
    this.padIndex = null;
  }

  // Shakes the controller in use at `strength` (0 to 1, both motors) for `ms`. Returns whether a rumble was asked
  // for; a controller or browser without rumble does nothing and returns false.
  public rumble(strength: number, ms: number): boolean {
    const actuator = this.find()?.vibrationActuator;
    const magnitude = clamp01(strength);
    const duration = clamp(ms, 0, MAX_RUMBLE_MS);

    if (!actuator || typeof actuator.playEffect !== "function" || !(magnitude > 0) || !(duration > 0)) {
      return false;
    }

    try {
      // A rumble the browser refuses (the page in the background) rejects; that is no one's error.
      Promise.resolve(actuator.playEffect("dual-rumble", { startDelay: 0, duration, strongMagnitude: magnitude, weakMagnitude: magnitude })).catch(ignore);

      return true;
    } catch {
      return false;
    }
  }

  // Stops hearing controllers arrive and leave.
  public dispose(): void {
    this.target?.removeEventListener("gamepadconnected", this.connected);
    this.target?.removeEventListener("gamepaddisconnected", this.disconnected);
  }

  // The controller to read: the one in use unless another has a press while it has none, else one with a press,
  // else the first whose layout the browser knows, else the first connected.
  private find(): GamepadLike | null {
    let current: GamepadLike | null = null;
    let pressing: GamepadLike | null = null;
    let fallback: GamepadLike | null = null;

    for (const pad of this.source()) {
      if (!pad || !pad.connected) {
        continue;
      }

      if (pad.index === this.padIndex) {
        current = pad;
      } else if (pressing === null && isPressing(pad)) {
        pressing = pad;
      }

      if (fallback === null || (pad.mapping === "standard" && fallback.mapping !== "standard")) {
        fallback = pad;
      }
    }

    if (current !== null && (pressing === null || isPressing(current))) {
      return current;
    }

    return pressing ?? fallback;
  }

  private readonly connected = (event: GamepadEventLike) => {
    if (event.gamepad) {
      this.onConnect?.(event.gamepad);
    }
  };

  // A controller leaving: if it was the one in use, one back in its place is read afresh.
  private readonly disconnected = (event: GamepadEventLike) => {
    if (!event.gamepad) {
      return;
    }

    if (event.gamepad.index === this.padIndex) {
      this.padIndex = null;
    }

    this.onDisconnect?.(event.gamepad);
  };
}
