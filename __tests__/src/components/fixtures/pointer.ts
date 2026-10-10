// What jsdom 20 lacks for pointer input: PointerEvent itself (fireEvent falls back to a bare Event without it, so
// clientX and pointerType are lost) and pointer capture. Capture is kept per element, as a browser keeps it, so a
// test can check what a handler captured. Safe to call more than once.
export const installPointerEvents = () => {
  if (typeof window.PointerEvent === "undefined") {
    class TestPointerEvent extends MouseEvent {
      public readonly pointerId: number;
      public readonly pointerType: string;

      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? "mouse";
      }
    }

    Object.defineProperty(window, "PointerEvent", { value: TestPointerEvent, configurable: true, writable: true });
  }

  if (typeof HTMLElement.prototype.setPointerCapture !== "function") {
    const captured = new WeakMap<Element, Set<number>>();
    const capturesOf = (element: Element) => {
      const ids = captured.get(element) ?? new Set<number>();

      captured.set(element, ids);

      return ids;
    };

    HTMLElement.prototype.setPointerCapture = function setPointerCapture(id: number) {
      capturesOf(this).add(id);
    };
    HTMLElement.prototype.releasePointerCapture = function releasePointerCapture(id: number) {
      capturesOf(this).delete(id);
    };
    HTMLElement.prototype.hasPointerCapture = function hasPointerCapture(id: number) {
      return capturesOf(this).has(id);
    };
  }
};

// A pointer event at a moment of its own, for anything timed by the events' timeStamps. Fire it with
// `fireEvent(element, event)`.
export const pointerAt = (type: string, timeStamp: number, init: PointerEventInit = {}) => {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", ...init });

  Object.defineProperty(event, "timeStamp", { value: timeStamp });

  return event;
};
