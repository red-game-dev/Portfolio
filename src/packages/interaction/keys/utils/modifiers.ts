import { KeyInput, Modifier } from "../domain/types";

// The modifiers browsers and systems keep for their own shortcuts.
export const BROWSER_SHORTCUTS: readonly Modifier[] = ["alt", "ctrl", "meta"];

// Every modifier: for keys that count only when pressed alone.
export const ANY_MODIFIER: readonly Modifier[] = ["alt", "ctrl", "meta", "shift"];

// Whether one modifier is down during a press.
export const isModifierDown = (event: KeyInput, modifier: Modifier): boolean => {
  switch (modifier) {
    case "alt":
      return event.altKey;
    case "ctrl":
      return event.ctrlKey;
    case "meta":
      return event.metaKey;
    default:
      return event.shiftKey;
  }
};

// Whether any of `modifiers` is down during a press.
export const hasModifier = (event: KeyInput, modifiers: readonly Modifier[]): boolean => {
  for (const modifier of modifiers) {
    if (isModifierDown(event, modifier)) {
      return true;
    }
  }

  return false;
};

// A key as a map compares it: a letter in lower case, so W and w are one key, and anything longer (ArrowUp,
// Escape) as it is.
export const foldKey = (key: string) => (key.length === 1 ? key.toLowerCase() : key);
