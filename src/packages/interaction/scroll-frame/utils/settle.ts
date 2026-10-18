// What a settle needs from the page; the browser window in practice, a fake in tests.
export interface SettleView {
  // Present where the browser fires scrollend.
  onscrollend?: unknown;
  addEventListener(type: string, listener: () => void, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: () => void): void;
  setTimeout(handler: () => void, ms: number): number;
  clearTimeout(id: number): void;
  getComputedStyle(element: Element): Partial<Pick<CSSStyleDeclaration, "scrollMarginTop" | "scrollPaddingTop">>;
}

// Input that means the reader has taken over the scroll, so the target is left wherever they take it.
export const TAKE_OVER = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
// A scroll that has not started by now never will (the target was already in place).
const START_MS = 400;
// For browsers without scrollend: long enough for a smooth scroll across the page to have finished.
const FALLBACK_MS = 1600;

// Only the latest jump is settled; starting another cancels the one before.
let cancelActive: (() => void) | null = null;

// A smooth scroll aims at where its target was when it started. Content that changes size above the target
// on the way (sections that load as the scroll passes them) moves it, and the scroll ends somewhere else.
// Once the scroll ends, this puts the target back where it was meant to land: at the top of the screen, plus the
// page's scroll-padding-top (read from `root`) and the target's scroll-margin-top. Within `tolerance` pixels it leaves
// it alone. Returns a cancel.
export const settleAtTop = (
  element: Element,
  view: SettleView = window,
  tolerance = 2,
  root: Element | null = typeof document === "undefined" ? null : document.documentElement,
) => {
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

    const margin = parseFloat(view.getComputedStyle(element).scrollMarginTop ?? "") || 0;
    const padding = root ? parseFloat(view.getComputedStyle(root).scrollPaddingTop ?? "") || 0 : 0;

    if (Math.abs(element.getBoundingClientRect().top - padding - margin) > tolerance) {
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

// What holding a target in place needs besides a settle's: a frame to look again on.
export interface HoldView extends SettleView {
  requestAnimationFrame(callback: (time: number) => void): number;
  cancelAnimationFrame(id: number): void;
}

interface HoldOptions {
  // The longest it holds (ms).
  most?: number;
  // How long the target has to stay where it belongs before the hold lets go early (ms).
  quiet?: number;
  tolerance?: number;
}

// A page opened at a link to somewhere on it: puts the target at the top of the screen at once, then looks again
// every frame and puts it back while the sections above it finish loading and change size, until it has stayed put
// for `quiet` ms or `most` have passed. The reader taking over the scroll ends it, as it ends a settle. Returns a
// cancel.
export const holdAtTop = (
  element: Element,
  view: HoldView = window,
  { most = 4000, quiet = 1200, tolerance = 2 }: HoldOptions = {},
  root: Element | null = typeof document === "undefined" ? null : document.documentElement,
) => {
  cancelActive?.();

  let frame = 0;
  let started: number | null = null;
  let lastMoved = 0;

  const stop = () => {
    view.cancelAnimationFrame(frame);
    TAKE_OVER.forEach((type) => view.removeEventListener(type, stop));

    if (cancelActive === stop) {
      cancelActive = null;
    }
  };

  // Whether the target had moved and was put back: a target the page cannot bring any nearer (one too near its end
  // to reach the top) counts as still, so the hold lets it go once it has been still for the quiet time.
  const place = () => {
    const margin = parseFloat(view.getComputedStyle(element).scrollMarginTop ?? "") || 0;
    const padding = root ? parseFloat(view.getComputedStyle(root).scrollPaddingTop ?? "") || 0 : 0;
    const top = element.getBoundingClientRect().top;

    if (Math.abs(top - padding - margin) <= tolerance) {
      return false;
    }

    element.scrollIntoView({ behavior: "instant", block: "start" });

    return Math.abs(element.getBoundingClientRect().top - top) > tolerance;
  };

  const look = (time: number) => {
    started ??= time;

    if (place()) {
      lastMoved = time;
    }

    if (time - started >= most || time - Math.max(lastMoved, started) >= quiet) {
      stop();

      return;
    }

    frame = view.requestAnimationFrame(look);
  };

  place();
  TAKE_OVER.forEach((type) => view.addEventListener(type, stop, { passive: true }));
  frame = view.requestAnimationFrame(look);
  cancelActive = stop;

  return stop;
};

// Scrolls an element to the top of the screen and makes sure it stays the target of a smooth scroll.
export const scrollToElement = (element: Element, behavior: ScrollBehavior, view: SettleView = window) => {
  element.scrollIntoView({ behavior, block: "start" });

  return behavior === "smooth" ? settleAtTop(element, view) : () => undefined;
};
