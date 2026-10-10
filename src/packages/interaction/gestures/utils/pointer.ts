import { Boxed, ClientPoint, Direction, Point } from "../domain/types";

// Where a pointer is on an element, in CSS pixels from its top left corner.
export const localPoint = (event: ClientPoint, element: Boxed): Point => {
  const rect = element.getBoundingClientRect();

  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};

// Which way a swipe across `distance` pixels turns: right to left goes forward. Too short a swipe is a tap or a
// scroll, and turns nothing.
export const swipeDirection = (distance: number, threshold: number): Direction | null => {
  if (Math.abs(distance) <= threshold) {
    return null;
  }

  return distance < 0 ? 1 : -1;
};

// Whether a click came with no pointer behind it: a keyboard's Space or Enter, or assistive technology activating
// the control. Browsers report those with a detail of 0, where a pointer's click counts its clicks from 1.
export const isPointerlessClick = (event: { detail: number }) => event.detail === 0;
