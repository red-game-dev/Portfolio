import { BROWSER_SHORTCUTS, KeyMap, KeyStep } from "@/packages/interaction/keys";
import type { ZoomInputOptions } from "@/packages/interaction/zoom";

// The ability bar's slots, in order, as the keys 1 to 4 name them.
export const SLOT_COMMANDS = ["slot1", "slot2", "slot3", "slot4"] as const;

export type SlotCommand = typeof SLOT_COMMANDS[number];

// What a key asks of the voyage.
export type VoyageCommand =
  "left" | "right" | "burn" | "brake" | "pause" | "map" | "guns" | "hangar" | "photo" | "follow" | "zoomIn" | "zoomOut" | "back" | SlotCommand;

// Arrows and WASD turn and burn, down and S brake; P pauses, M opens the map, F holds fire, H opens the hangar, C photo
// mode and U does what the hangar suggests; 1 to 4 use the ability bar; + and - zoom, and Escape steps back out of the
// hangar or photo mode. The browser's own shortcuts (Ctrl+H, Cmd+U, Cmd+1) are left to the browser.
export const VOYAGE_KEYS = new KeyMap<VoyageCommand>({
  "ArrowLeft": "left",
  "ArrowRight": "right",
  "ArrowUp": "burn",
  "ArrowDown": "brake",
  "a": "left",
  "d": "right",
  "w": "burn",
  "s": "brake",
  "p": "pause",
  "m": "map",
  "f": "guns",
  "h": "hangar",
  "c": "photo",
  "u": "follow",
  "1": "slot1",
  "2": "slot2",
  "3": "slot3",
  "4": "slot4",
  "+": "zoomIn",
  "=": "zoomIn",
  "-": "zoomOut",
  "Escape": "back",
}, { ignore: BROWSER_SHORTCUTS });

// How far an arrow looks round in photo mode: the CSS pixels the view moves, against the arrow.
export const PHOTO_PAN = new KeyMap<KeyStep>({
  ArrowLeft: { x: 60, y: 0 },
  ArrowRight: { x: -60, y: 0 },
  ArrowUp: { x: 0, y: 60 },
  ArrowDown: { x: 0, y: -60 },
});

// How much a pixel of the wheel, or a key, zooms.
export const VOYAGE_ZOOM: ZoomInputOptions = { wheel: 0.0015, step: 1.25 };

// What the voyage is doing, as far as its keys care.
export interface VoyageKeyState {
  isFlying: boolean;
  // A run held still by the pause key, under its card.
  isPaused: boolean;
  // A run has begun (it is flying or over), so the map and photo mode have something to show.
  hasRun: boolean;
  isHangarOpen: boolean;
  isPhoto: boolean;
  // The pilot's hangar has loaded.
  hasHangar: boolean;
  hasSuggestion: boolean;
  hasGame: boolean;
}

// What a key does: steer (held until it comes up), or one of the voyage's own actions.
export type VoyageKeyAction = "steer" | "pause" | "map" | "guns" | "hangar" | "closeHangar" | "photo" | "follow" | "zoomIn" | "zoomOut" | SlotCommand;

// Which slot of the bar a key action uses, or -1 for any other.
export const slotOf = (action: VoyageKeyAction | null): number => SLOT_COMMANDS.findIndex((command) => command === action);

// The keys that still work with the hangar open (the run is held still under it), and in photo mode.
const HANGAR_KEYS: ReadonlySet<VoyageCommand> = new Set<VoyageCommand>(["hangar", "back", "follow"]);
const PHOTO_KEYS: ReadonlySet<VoyageCommand> = new Set<VoyageCommand>(["photo", "back", "zoomIn", "zoomOut"]);

// What a command does in the voyage's present state, or null when it means nothing now and the browser keeps the
// key. With the hangar open only its own keys work, and in photo mode only its own; Escape steps out of the hangar
// first, and only then out of photo mode.
export const voyageKeyAction = (command: VoyageCommand, state: VoyageKeyState): VoyageKeyAction | null => {
  if ((state.isHangarOpen && !HANGAR_KEYS.has(command)) || (state.isPhoto && !PHOTO_KEYS.has(command))) {
    return null;
  }

  switch (command) {
    case "left":
    case "right":
    case "burn":
    case "brake":
      return state.isFlying ? "steer" : null;
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
      return state.isFlying && !state.isPaused && state.hasHangar ? command : null;
    case "back":
      if (state.isHangarOpen) {
        return "closeHangar";
      }

      return state.isPhoto ? "photo" : null;
    default:
      return state.hasGame ? command : null;
  }
};
