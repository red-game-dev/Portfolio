// Tilting a phone or tablet to steer. The device reports how it leans (beta, front to back, and gamma, side to side,
// in degrees); turned by how the screen is turned, that is a lean across the screen and down it.

// Leaning less than this (degrees) from level is held still; this far or more is a full burn.
const DEAD_ZONE = 3;
const FULL_LEAN = 22;

// The lean across the screen (right) and down it, in degrees, for a screen turned `angle` degrees.
export const screenLean = (beta: number, gamma: number, angle: number): { x: number; y: number } => {
  const turned = ((Math.round(angle / 90) % 4) + 4) % 4;

  return [
    { x: gamma, y: beta },
    { x: beta, y: -gamma },
    { x: -gamma, y: -beta },
    { x: -beta, y: gamma },
  ][turned];
};

// The way to fly and how hard (0 to 1), from how the device leans now against how it was held at the start; nothing
// while it is held level, which still steers (by holding still), so a finger on the screen never takes over.
export const tiltSteer = (lean: { x: number; y: number }, level: { x: number; y: number }): { x: number; y: number } => {
  const x = lean.x - level.x;
  const y = lean.y - level.y;
  const degrees = Math.hypot(x, y);
  const strength = Math.min(1, Math.max(0, (degrees - DEAD_ZONE) / (FULL_LEAN - DEAD_ZONE)));

  return strength > 0 ? { x: (x / degrees) * strength, y: (y / degrees) * strength } : { x: 0, y: 0 };
};

// How far the screen is turned (degrees): from the screen itself, or on older iPhones and iPads without it, from
// the window's own reading.
export const screenAngle = (): number => {
  const legacy: unknown = Reflect.get(window, "orientation");

  return window.screen.orientation?.angle ?? (typeof legacy === "number" ? legacy : 0);
};

// Whether this device can steer by tilting: a touch screen that reports how it leans.
export const canTilt = (): boolean => typeof window !== "undefined" && "DeviceOrientationEvent" in window &&
  typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

// Asks to read how the device leans where the browser asks first (iPhones and iPads, from a tap), and says whether it
// may. Elsewhere it may without asking.
export const askToTilt = async (): Promise<boolean> => {
  if (!canTilt()) {
    return false;
  }

  const request: unknown = Reflect.get(window.DeviceOrientationEvent, "requestPermission");

  if (typeof request !== "function") {
    return true;
  }

  try {
    const answer: unknown = await Reflect.apply(request, window.DeviceOrientationEvent, []);

    return answer === "granted";
  } catch {
    return false;
  }
};
