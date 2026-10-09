// Each check asks whether the browser's classes exist before using them, so these are safe to call during server
// rendering or in a worker, where every answer is no.
const isNode = (target: EventTarget | null | undefined): target is Node => typeof Node !== "undefined" && target instanceof Node;

const isElement = (target: EventTarget | null | undefined): target is Element => typeof Element !== "undefined" && target instanceof Element;

// Whether `target` is `container` or anything inside it. Nothing is inside a container that is not there.
export const isInside = (container: Node | null | undefined, target: EventTarget | null | undefined): boolean => (container
  ? isNode(target) && container.contains(target)
  : false);

// Whether focus moving to `next` leaves `container`: `next` is a blur's relatedTarget, null when focus leaves the
// page or goes nowhere. Moving between the container's own controls is not leaving it.
export const focusLeaves = (container: Node | null | undefined, next: EventTarget | null | undefined): boolean => !isInside(container, next);

// Whether a key press lands where it types: a text field, a text area or editable content.
export const isTypingTarget = (target: EventTarget | null | undefined): boolean => typeof HTMLElement !== "undefined"
  && target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable === true);

// The nearest element from `target` outwards that matches `selector`, or null.
export const closestTo = (target: EventTarget | null | undefined, selector: string): Element | null => (isElement(target) ? target.closest(selector) : null);
