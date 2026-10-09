import { Direction, KeyStep } from "../domain/types";

// The arrow keys as one step on the screen's axes, y growing downwards: for aiming a cursor or moving a view.
export const ARROW_STEPS: Readonly<Record<string, Readonly<KeyStep>>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

// Left and right alone, as a step back or forward: for turning a page or travelling between items.
export const HORIZONTAL_ARROWS: Readonly<Record<string, Direction>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
};
