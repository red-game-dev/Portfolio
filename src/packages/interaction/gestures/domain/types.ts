// A point, or a distance moved, in CSS pixels.
export interface Point {
  x: number;
  y: number;
}

// A step back or forward, as a swipe turns a page.
export type Direction = -1 | 1;

// How a press ended: let go quickly enough to be a tap, or held.
export type PressKind = "tap" | "hold";

// Where a pointer is on the page; pointer and mouse events both have it.
export interface ClientPoint {
  clientX: number;
  clientY: number;
}

// Anything with a box on the page, an element in practice.
export interface Boxed {
  getBoundingClientRect(): { left: number; top: number };
}
