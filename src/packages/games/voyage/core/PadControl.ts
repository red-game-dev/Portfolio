import { GamepadMap } from "@/packages/interaction/gamepad";
import type { GamepadState } from "@/packages/interaction/gamepad";

// What the voyage needs of a controller: its state, read once a frame (null with none connected), and a rumble.
export interface PadPort {
  poll(): GamepadState | null;
  rumble(strength: number, ms: number): boolean;
}

// What a controller's buttons ask: a slot of the ability bar, or something the page around the game does (pause,
// the map, the hangar, photo mode, holding fire).
export type PadIntent = "slot1" | "slot2" | "slot3" | "slot4" | "slot5" | "slot6" | "pause" | "map" | "hangar" | "photo" | "guns";

// The face buttons and shoulders are the bar's six slots; Start pauses, Back opens the map, the d-pad's up the
// hangar, a stick pressed in takes a photo, the right stick pressed holds fire.
const BINDINGS = new GamepadMap<PadIntent>({
  a: "slot1",
  b: "slot2",
  x: "slot3",
  y: "slot4",
  lb: "slot5",
  rb: "slot6",
  start: "pause",
  back: "map",
  up: "hangar",
  ls: "photo",
  rs: "guns",
});

// How far from the ship (CSS pixels) the right stick's aim is set, and how far it must lean to aim at all.
const AIM_REACH = 220;
const AIM_REST = 0.3;

// What a controller says this frame, read for the game: the left stick's lean to fly by, where the right stick aims
// (by hand), whether the trigger fires, the left trigger braking, and the buttons pressed this frame.
export interface PadReading {
  lean: { x: number; y: number } | null;
  aim: { x: number; y: number } | null;
  isFiring: boolean;
  isBraking: boolean;
  pressed: readonly PadIntent[];
}

// Reads a controller once a frame into what the game does with it, reusing one reading so a frame allocates nothing.
export class PadControl {
  private readonly reading: PadReading = { lean: null, aim: null, isFiring: false, isBraking: false, pressed: [] };
  private readonly lean = { x: 0, y: 0 };
  private readonly aim = { x: 0, y: 0 };

  constructor(private readonly pad: PadPort) {}

  // This frame's reading, the aim set out from where the ship is on the screen; null with no controller.
  public read(ship: { x: number; y: number } | null): PadReading | null {
    const state = this.pad.poll();

    if (!state) {
      return null;
    }

    const { reading } = this;
    const moving = Math.hypot(state.move.x, state.move.y) > 0;
    const aiming = Math.hypot(state.aim.x, state.aim.y) > AIM_REST;

    this.lean.x = state.move.x;
    this.lean.y = state.move.y;
    reading.lean = moving ? this.lean : null;

    if (aiming && ship) {
      this.aim.x = ship.x + state.aim.x * AIM_REACH;
      this.aim.y = ship.y + state.aim.y * AIM_REACH;
      reading.aim = this.aim;
    } else {
      reading.aim = null;
    }

    reading.isFiring = state.fire;
    reading.isBraking = state.brake > 0.5;
    reading.pressed = BINDINGS.pressed(state);

    return reading;
  }

  public rumble(strength: number, ms: number): void {
    this.pad.rumble(strength, ms);
  }
}
