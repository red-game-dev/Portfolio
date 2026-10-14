import { isPressTarget, isTypingTarget } from "@/packages/interaction/focus";
import { BROWSER_SHORTCUTS, KeyMap, KeyStep } from "@/packages/interaction/keys";
import type { ZoomInputOptions } from "@/packages/interaction/zoom";

// The ability bar's slots, in order, as the keys 1 to 4 name them.
export const SLOT_COMMANDS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"] as const;

export type SlotCommand = typeof SLOT_COMMANDS[number];

// What a key asks of the voyage.
export type VoyageCommand =
  "left" | "right" | "up" | "down" | "brake" | "pause" | "map" | "guns" | "hangar" | "photo" | "follow" | "zoomIn" | "zoomOut" | "back" | "dock" |
  SlotCommand;

// The keys that fly the ship, held for as long as they are down.
export type SteerCommand = "left" | "right" | "up" | "down" | "brake";

// Arrows and WASD fly the ship (the way they point, or turning and burning, as the reader's `voyage-keys` setting
// has it) and Space brakes; P pauses, M opens the map, F holds fire, H opens the hangar, C photo mode, U does what
// the hangar suggests and E docks at the port alongside (or casts off); 1 to 6 use the ability bar; + and - zoom,
// and Escape steps back out of the hangar, a port or photo mode. The browser's own shortcuts (Ctrl+H, Cmd+U, Cmd+1)
// are left to the browser, and so is every key typed into a field (the daily board's initials), but Escape, and Space
// on a focused button, which it presses (the leave card's Stay, a perk, a port's trade).
export const VOYAGE_KEYS = new KeyMap<VoyageCommand>({
  "ArrowLeft": "left",
  "ArrowRight": "right",
  "ArrowUp": "up",
  "ArrowDown": "down",
  "a": "left",
  "d": "right",
  "w": "up",
  "s": "down",
  " ": "brake",
  "p": "pause",
  "m": "map",
  "f": "guns",
  "h": "hangar",
  "c": "photo",
  "u": "follow",
  "e": "dock",
  "1": "slot1",
  "2": "slot2",
  "3": "slot3",
  "4": "slot4",
  "5": "slot5",
  "6": "slot6",
  "+": "zoomIn",
  "=": "zoomIn",
  "-": "zoomOut",
  "Escape": "back",
}, {
  ignore: BROWSER_SHORTCUTS,
  skip: (event) => (event.key !== "Escape" && isTypingTarget(event.target)) || (event.key === " " && isPressTarget(event.target)),
});

// How far an arrow looks round in photo mode: the CSS pixels the view moves, against the arrow.
export const PHOTO_PAN = new KeyMap<KeyStep>({
  ArrowLeft: { x: 60, y: 0 },
  ArrowRight: { x: -60, y: 0 },
  ArrowUp: { x: 0, y: 60 },
  ArrowDown: { x: 0, y: -60 },
});

// How much a pixel of the wheel, a pixel of a trackpad's pinch (far smaller steps), or a key zooms.
export const VOYAGE_ZOOM: ZoomInputOptions = { wheel: 0.0015, pinch: 0.012, step: 1.25 };

// What the held keys ask of the ship. Pointing the way they fly, they lean like a thumb stick (x right, y down, -1
// to 1), the burn is the up key (which is still the burn while coming down) and only Space brakes; turning and
// burning, left and right turn, up burns along the nose and down or Space brakes.
export interface HeldSteer {
  turn: number;
  thrust: number;
  brake: boolean;
  lean: { x: number; y: number } | null;
}

export const heldSteer = (isHeld: (command: SteerCommand) => boolean, mode: "direction" | "turn"): HeldSteer => {
  const across = (isHeld("right") ? 1 : 0) - (isHeld("left") ? 1 : 0);
  const down = (isHeld("down") ? 1 : 0) - (isHeld("up") ? 1 : 0);
  const thrust = isHeld("up") ? 1 : 0;

  if (mode === "turn") {
    return { turn: across, thrust, brake: isHeld("down") || isHeld("brake"), lean: null };
  }

  const length = Math.hypot(across, down);

  return { turn: 0, thrust, brake: isHeld("brake"), lean: length > 0 ? { x: across / length, y: down / length } : null };
};

// What the voyage is doing, as far as its keys care.
export interface VoyageKeyState {
  isFlying: boolean;
  // A run held still by the pause key, under its card.
  isPaused: boolean;
  // A run has begun (it is flying or over), so the map and photo mode have something to show.
  hasRun: boolean;
  isHangarOpen: boolean;
  isPhoto: boolean;
  isMapOpen: boolean;
  // The pilot's hangar has loaded.
  hasHangar: boolean;
  hasSuggestion: boolean;
  hasGame: boolean;
  // A port alongside slowly enough to dock at, and docked at one (its trade open, the run held still).
  canDock: boolean;
  isDocked: boolean;
}

// What a key does: steer (held until it comes up), or one of the voyage's own actions.
export type VoyageKeyAction =
  "steer" | "pause" | "map" | "guns" | "hangar" | "closeHangar" | "photo" | "follow" | "zoomIn" | "zoomOut" | "dock" | "undock" | "leave" | SlotCommand;

// Which slot of the bar a key action uses, or -1 for any other.
export const slotOf = (action: VoyageKeyAction | null): number => SLOT_COMMANDS.findIndex((command) => command === action);

// The keys that still work with the hangar open (the run is held still under it), and in photo mode.
const HANGAR_KEYS: ReadonlySet<VoyageCommand> = new Set<VoyageCommand>(["hangar", "back", "follow"]);
const PHOTO_KEYS: ReadonlySet<VoyageCommand> = new Set<VoyageCommand>(["photo", "back", "zoomIn", "zoomOut"]);

// What a command does in the voyage's present state, or null when it means nothing now and the browser keeps the
// key. With the hangar open only its own keys work, and in photo mode only its own; Escape steps out of the hangar
// first, then a port, then photo mode, then the map, and only then asks to leave the run.
export const voyageKeyAction = (command: VoyageCommand, state: VoyageKeyState): VoyageKeyAction | null => {
  if ((state.isHangarOpen && !HANGAR_KEYS.has(command)) || (state.isPhoto && !PHOTO_KEYS.has(command))) {
    return null;
  }

  switch (command) {
    case "left":
    case "right":
    case "up":
    case "down":
    case "brake":
      // Nothing to steer while the run is held still, paused or docked.
      return state.isFlying && !state.isPaused && !state.isDocked ? "steer" : null;
    case "pause":
    case "guns":
      return state.isFlying ? command : null;
    case "map":
      return state.hasRun ? "map" : null;
    case "hangar":
      return state.hasHangar ? "hangar" : null;
    case "photo":
      return state.hasRun && !state.isHangarOpen ? "photo" : null;
    case "follow":
      return state.hasSuggestion ? "follow" : null;
    case "slot1":
    case "slot2":
    case "slot3":
    case "slot4":
    case "slot5":
    case "slot6":
      return state.isFlying && !state.isPaused && state.hasHangar ? command : null;
    case "dock":
      return state.isDocked ? "undock" : state.canDock && state.isFlying && !state.isPaused ? "dock" : null;
    case "back":
      if (state.isHangarOpen) {
        return "closeHangar";
      }

      if (state.isDocked) {
        return "undock";
      }

      if (state.isPhoto) {
        return "photo";
      }

      // Escape on the map closes the map, not the voyage.
      if (state.isMapOpen) {
        return "map";
      }

      // With nothing open, during a run Escape asks before leaving it, here rather than as the dialog's close request,
      // which a browser may refuse to hold back a second time.
      return state.isFlying ? "leave" : null;
    default:
      return state.hasGame ? command : null;
  }
};
