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

// Controls that Space presses: buttons, links, tabs, switches, check boxes and the like.
const PRESSABLE = "button, a[href], summary, select, input[type='checkbox'], input[type='radio'], [role='button'], [role='tab'], [role='switch'], " +
  "[role='checkbox'], [role='radio'], [role='menuitem'], [role='option']";

// Whether a key went to a control that Space presses, so a shortcut on Space leaves it alone.
export const isPressTarget = (target: EventTarget | null | undefined): boolean => closestTo(target, PRESSABLE) !== null;

// The nearest element from `target` outwards that matches `selector`, or null.
export const closestTo = (target: EventTarget | null | undefined, selector: string): Element | null => (isElement(target) ? target.closest(selector) : null);

// What a reader can move focus to.
const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

// The first control in `container` a reader could move to that is not hidden, or null when there is none.
export const firstFocusable = (container: ParentNode): HTMLElement | null =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).find((element) => element.closest("[hidden]") === null) ?? null;

// Moves focus to where a jump on the page landed, without scrolling again, so the next Tab goes on from there rather
// than from the link that jumped. An element that takes no focus of its own is given a tabindex of -1 first, which
// lets a script focus it without putting it in the Tab order.
export const focusLanding = (element: Element): void => {
  if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
    return;
  }

  if (!element.matches(FOCUSABLE) && !element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
  }

  element.focus({ preventScroll: true });
};

// Whether focus has dropped out of view: nothing holds it, or what holds it now sits inside something hidden (a
// page of a carousel turned away, a panel closed), which a browser leaves on the page's body.
export const isFocusLost = (active: Element | null): boolean => active === null || active === active.ownerDocument.body || active.closest("[hidden]") !== null;
