// A modifier key, by the name its flag goes by on a key event.
export type Modifier = "alt" | "ctrl" | "meta" | "shift";

// A step back or forward, as a row of things is crossed.
export type Direction = -1 | 1;

// One step on the screen's axes, y growing downwards.
export interface KeyStep {
  x: number;
  y: number;
}

// What a key map reads from a key press. A DOM KeyboardEvent and React's synthetic one both fit, and so does a
// plain object in a test.
export interface KeyInput {
  key: string;
  // The physical key, whatever the layout types with it.
  code?: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  target?: EventTarget | null;
}

// A key press a map can answer: it may stop the browser's own action and keep the press from outer listeners.
export interface KeyEvent extends KeyInput {
  preventDefault(): void;
  stopPropagation(): void;
}

export interface KeyMapOptions<I> {
  // Physical keys (`event.code`) bound as well, for a key that types something else on some layouts.
  codes?: Readonly<Record<string, I>>;
  // A press with any of these held is not the map's, so the browser keeps its own shortcuts (Ctrl+H, Cmd+U).
  ignore?: readonly Modifier[];
  // Whether a letter counts whatever its case, so Caps Lock or Shift does not lose it. On by default.
  foldCase?: boolean;
  // Presses the map leaves alone, such as one typed into a text field.
  skip?: (event: KeyInput) => boolean;
  // What handling a press does to the event: by default the browser's own action is stopped, and the press still
  // reaches outer listeners.
  preventDefault?: boolean;
  stopPropagation?: boolean;
}
