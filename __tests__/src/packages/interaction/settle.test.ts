import { scrollToElement, settleAtTop, SettleView } from "@/packages/interaction/scroll-frame";

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
    getComputedStyle: () => ({ scrollMarginTop: "0px" }),
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
