import { clamp } from "@/packages/math/clamp";

import { GamepadConfig } from "../domain/types";

// A dead zone wide enough for a worn stick's drift, a rim a little inside the gate so full tilt is easy to reach,
// and a trigger that fires half way down.
export const DEFAULT_GAMEPAD_CONFIG: GamepadConfig = {
  deadZone: 0.18,
  edge: 0.95,
  triggerThreshold: 0.5,
};

// The host's settings over the defaults, each kept to a range that still reads: a dead zone short of the rim, and
// a rim past the dead zone.
export const resolveGamepadConfig = (overrides: Partial<GamepadConfig> = {}): GamepadConfig => {
  const deadZone = clamp(overrides.deadZone ?? DEFAULT_GAMEPAD_CONFIG.deadZone, 0, 0.9);

  return {
    deadZone,
    edge: clamp(overrides.edge ?? DEFAULT_GAMEPAD_CONFIG.edge, deadZone + 0.05, 1),
    triggerThreshold: clamp(overrides.triggerThreshold ?? DEFAULT_GAMEPAD_CONFIG.triggerThreshold, 0.01, 1),
  };
};
