import { holdAtTop, HoldView, scrollToElement, settleAtTop, SettleView } from "@/packages/interaction/scroll-frame";

// A page that fires events on demand and runs timers when told.
const fakeView = (withScrollEnd = true) => {
  const listeners = new Map<string, Set<() => void>>();
  const timers = new Map<number, () => void>();
  let nextTimer = 1;
  const view: SettleView & { fire(type: string): void; runTimers(): void; count(type: string): number } = {
    addEventListener: (type, listener) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(listener));
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    setTimeout: (handler) => {
      timers.set(nextTimer, handler);

      return nextTimer++;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
    getComputedStyle: () => ({ scrollMarginTop: "0px", scrollPaddingTop: "0px" }),
    fire: (type) => [...(listeners.get(type) ?? [])].forEach((listener) => listener()),
    runTimers: () => [...timers.values()].forEach((handler) => handler()),
    count: (type) => listeners.get(type)?.size ?? 0,
  };

  if (withScrollEnd) {
    view.onscrollend = null;
  }

  return view;
};

const target = (top: number) => {
  const element = document.createElement("section");
  const scroll = jest.fn();

  element.getBoundingClientRect = () => ({ top } as DOMRect);
  element.scrollIntoView = scroll;

  return { element, scroll };
};

describe("settleAtTop", () => {
  it("puts a target that moved during the scroll back at the top once it ends", () => {
    const view = fakeView();
    const { element, scroll } = target(-316);

    settleAtTop(element, view);
    view.fire("scroll");
    view.fire("scrollend");

    expect(scroll).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    expect(view.count("scrollend")).toBe(0);
  });

  it("leaves a target that landed where it should", () => {
    const view = fakeView();
    const { element, scroll } = target(1);

    settleAtTop(element, view);
    view.fire("scrollend");

    expect(scroll).not.toHaveBeenCalled();
  });

  it("counts the page's scroll padding and the target's scroll margin in where it should land", () => {
    const view = fakeView();
    const root = document.createElement("html");
    const styles = new Map<Element, { scrollMarginTop: string; scrollPaddingTop: string }>();
    const padded = { ...view, getComputedStyle: (element: Element) => styles.get(element) ?? { scrollMarginTop: "0px", scrollPaddingTop: "0px" } };
    const section = target(0);
    const control = target(104);

    styles.set(root, { scrollMarginTop: "0px", scrollPaddingTop: "104px" });
    // A section cancels the padding with a margin of its own, so it lands at the very top.
    styles.set(section.element, { scrollMarginTop: "-104px", scrollPaddingTop: "0px" });
    settleAtTop(section.element, padded, 2, root);
    view.fire("scrollend");
    // Anything else lands below the fixed bars.
    settleAtTop(control.element, padded, 2, root);
    view.fire("scrollend");

    expect(section.scroll).not.toHaveBeenCalled();
    expect(control.scroll).not.toHaveBeenCalled();
  });

  it("lets the reader take over: no correction once they scroll themselves", () => {
    const view = fakeView();
    const { element, scroll } = target(-400);

    settleAtTop(element, view);
    view.fire("wheel");
    view.fire("scrollend");

    expect(scroll).not.toHaveBeenCalled();
    expect(view.count("wheel")).toBe(0);
  });

  it("falls back to a timer where the browser has no scrollend", () => {
    const view = fakeView(false);
    const { element, scroll } = target(-50);

    settleAtTop(element, view);
    expect(view.count("scrollend")).toBe(0);
    view.fire("scroll");
    view.runTimers();

    expect(scroll).toHaveBeenCalled();
  });

  it("gives up when the scroll never starts, so a later scroll is not pulled back", () => {
    const view = fakeView();
    const { element, scroll } = target(-300);

    settleAtTop(element, view);
    view.runTimers();
    view.fire("scrollend");

    expect(scroll).not.toHaveBeenCalled();
    expect(view.count("scrollend")).toBe(0);
  });

  it("settles only the latest jump", () => {
    const view = fakeView();
    const first = target(-200);
    const second = target(-80);

    settleAtTop(first.element, view);
    settleAtTop(second.element, view);
    view.fire("scroll");
    view.fire("scrollend");

    expect(first.scroll).not.toHaveBeenCalled();
    expect(second.scroll).toHaveBeenCalled();
  });
});

describe("scrollToElement", () => {
  it("settles only smooth scrolls", () => {
    const view = fakeView();
    const { element, scroll } = target(-20);

    scrollToElement(element, "auto", view);
    expect(view.count("scrollend")).toBe(0);

    scrollToElement(element, "smooth", view);
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(view.count("scrollend")).toBe(1);
  });
});

describe("holdAtTop", () => {
  // A page that runs its frames when told, at the given times.
  const framedView = () => {
    const base = fakeView();
    let pending: ((time: number) => void) | null = null;
    const view: HoldView & typeof base & { frame(time: number): void; hasFrame(): boolean } = Object.assign(base, {
      requestAnimationFrame: (callback: (time: number) => void) => {
        pending = callback;

        return 1;
      },
      cancelAnimationFrame: () => {
        pending = null;
      },
      frame: (time: number) => {
        const next = pending;

        pending = null;
        next?.(time);
      },
      hasFrame: () => pending !== null,
    });

    return view;
  };

  // A target whose place the test moves, as sections above it load.
  const drifting = (top: number) => {
    const element = document.createElement("section");
    const place = { top };
    const scroll = jest.fn(() => {
      place.top = 0;
    });

    element.getBoundingClientRect = () => ({ top: place.top } as DOMRect);
    element.scrollIntoView = scroll;

    return { element, place, scroll };
  };

  it("lands the target at once and puts it back each time what is above it moves it", () => {
    const view = framedView();
    const { element, place, scroll } = drifting(-900);

    holdAtTop(element, view);
    expect(scroll).toHaveBeenCalledTimes(1);

    view.frame(0);
    place.top = 240;
    view.frame(400);
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(scroll).toHaveBeenLastCalledWith({ behavior: "instant", block: "start" });
  });

  it("lets go once the target has stayed where it belongs for the quiet time", () => {
    const view = framedView();
    const { element } = drifting(0);

    holdAtTop(element, view, { quiet: 1000 });
    view.frame(0);
    view.frame(500);
    expect(view.hasFrame()).toBe(true);

    view.frame(1000);
    expect(view.hasFrame()).toBe(false);
  });

  it("lets go after the longest it holds, even while things still move", () => {
    const view = framedView();
    const { element, place } = drifting(0);

    holdAtTop(element, view, { most: 2000, quiet: 5000 });
    view.frame(0);
    place.top = 50;
    view.frame(1000);
    place.top = 50;
    view.frame(2000);
    expect(view.hasFrame()).toBe(false);
  });

  it("lets go of a target the page cannot bring any nearer once it has been still for the quiet time", () => {
    const view = framedView();
    const element = document.createElement("section");
    const scroll = jest.fn();

    // Near the end of the page: always 300 px down, however it is scrolled.
    element.getBoundingClientRect = () => ({ top: 300 } as DOMRect);
    element.scrollIntoView = scroll;
    holdAtTop(element, view, { quiet: 1000 });
    view.frame(0);
    view.frame(600);
    expect(view.hasFrame()).toBe(true);

    view.frame(1000);
    expect(view.hasFrame()).toBe(false);
  });

  it("stops as soon as the reader takes over the scroll", () => {
    const view = framedView();
    const { element, place, scroll } = drifting(0);

    holdAtTop(element, view);
    view.frame(0);
    view.fire("wheel");
    place.top = 300;
    view.frame(100);

    expect(scroll).not.toHaveBeenCalled();
    expect(view.count("wheel")).toBe(0);
  });
});
