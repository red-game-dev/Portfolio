// What a settle needs from the page; the browser window in practice, a fake in tests.
export interface SettleView {
  // Present where the browser fires scrollend.
  onscrollend?: unknown;
  addEventListener(type: string, listener: () => void, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: () => void): void;
  setTimeout(handler: () => void, ms: number): number;
  clearTimeout(id: number): void;
  getComputedStyle(element: Element): Pick<CSSStyleDeclaration, "scrollMarginTop">;
}

// Input that means the reader has taken over the scroll, so the target is left wherever they take it.
const TAKE_OVER = ["wheel", "touchstart", "keydown", "pointerdown"];
// A scroll that has not started by now never will (the target was already in place).
const START_MS = 400;
// For browsers without scrollend: long enough for a smooth scroll across the page to have finished.
const FALLBACK_MS = 1600;

// Only the latest jump is settled; starting another cancels the one before.
let cancelActive: (() => void) | null = null;

// A smooth scroll aims at where its target was when it started. Content that changes size above the target
// on the way (sections that load as the scroll passes them) moves it, and the scroll ends somewhere else.
// Once the scroll ends, this puts the target back where it was meant to land: at the top of the screen,
// less its scroll-margin-top. Within `tolerance` pixels it leaves it alone. Returns a cancel.
export const settleAtTop = (element: Element, view: SettleView = window, tolerance = 2) => {
  cancelActive?.();

  let isDone = false;
  let fallback = 0;

  const stop = () => {
    isDone = true;
    view.removeEventListener("scroll", started);
    view.removeEventListener("scrollend", settle);
    view.clearTimeout(fallback);
    view.clearTimeout(notStarted);
    TAKE_OVER.forEach((type) => view.removeEventListener(type, stop));

    if (cancelActive === stop) {
      cancelActive = null;
    }
  };

  function started() {
    view.removeEventListener("scroll", started);
    view.clearTimeout(notStarted);
  }

  function settle() {
    if (isDone) {
      return;
    }

    stop();

    const margin = parseFloat(view.getComputedStyle(element).scrollMarginTop) || 0;

    if (Math.abs(element.getBoundingClientRect().top - margin) > tolerance) {
      element.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }

  const notStarted = view.setTimeout(stop, START_MS);

  view.addEventListener("scroll", started, { passive: true });

  if ("onscrollend" in view) {
    view.addEventListener("scrollend", settle);
  } else {
    fallback = view.setTimeout(settle, FALLBACK_MS);
  }

  TAKE_OVER.forEach((type) => view.addEventListener(type, stop, { passive: true }));
  cancelActive = stop;

  return stop;
};

// Scrolls an element to the top of the screen and makes sure it stays the target of a smooth scroll.
export const scrollToElement = (element: Element, behavior: ScrollBehavior, view: SettleView = window) => {
  element.scrollIntoView({ behavior, block: "start" });

  return behavior === "smooth" ? settleAtTop(element, view) : () => undefined;
};
