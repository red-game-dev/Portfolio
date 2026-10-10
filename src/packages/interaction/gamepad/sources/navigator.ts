import { GamepadEventTarget, GamepadLike } from "../domain/types";

const NO_PADS: ReadonlyArray<GamepadLike | null> = [];

// The browser's controllers. The list is missing on the server and outside a secure page, and reading it throws
// where a permissions policy blocks it (a frame without the gamepad feature), so any of those reads as none.
export const navigatorGamepads = (): ReadonlyArray<GamepadLike | null> => {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
    return NO_PADS;
  }

  try {
    return navigator.getGamepads();
  } catch {
    return NO_PADS;
  }
};

// The window, where controllers are announced as they arrive and leave; none on the server.
export const windowGamepadEvents = (): GamepadEventTarget | null => (typeof window === "undefined" ? null : window);
