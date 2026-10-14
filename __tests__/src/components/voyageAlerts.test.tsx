import { act, renderHook } from "@testing-library/react";

import { useFoldedAlerts } from "@/components/Finale/Voyage/hooks/useFoldedAlerts";
import { SMALL_HUD_SCREEN } from "@/components/Finale/Voyage/hud";

// An IntersectionObserver the test drives: it keeps what it watches and the options it was made with, and hands entries
// to its callback when told.
class Observer {
  public static last: Observer | null = null;
  public readonly watched: Element[] = [];
  public readonly options: IntersectionObserverInit;
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.options = options;
    Observer.last = this;
  }

  public observe(element: Element) {
    this.watched.push(element);
  }

  public disconnect() {
    this.watched.length = 0;
  }

  public unobserve() {
    return undefined;
  }

  public takeRecords() {
    return [];
  }

  public tell(shares: number[]) {
    const entries = this.watched.map((target, index) => ({ target, intersectionRatio: shares[index] ?? 1 } as IntersectionObserverEntry));

    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

const listOf = (count: number) => {
  const list = document.createElement("div");
  const more = document.createElement("button");

  more.setAttribute("data-alerts-more", "");
  list.append(more, ...Array.from({ length: count }, () => document.createElement("section")));

  return list;
};

describe("the voyage's alerts", () => {
  const original = window.IntersectionObserver;

  beforeEach(() => {
    window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = original;
  });

  it("folds each alert with no whole room, keeping the line's room at the top, and counts them", () => {
    const list = listOf(3);
    const { result } = renderHook(() => useFoldedAlerts(list, 28, false));
    const observer = Observer.last as Observer;

    // The line standing for them is never one of them.
    expect(observer.watched).toHaveLength(3);
    expect(observer.options.rootMargin).toBe("-28px 0px 0px 0px");
    act(() => observer.tell([0, 0.5, 1]));

    expect(result.current).toBe(2);
    expect([...list.querySelectorAll("section")].map((alert) => alert.hasAttribute("data-folded"))).toEqual([true, true, false]);
  });

  it("folds nothing while they are opened to be scrolled through, or while there is no list", () => {
    const list = listOf(2);

    list.querySelectorAll("section").forEach((alert) => alert.setAttribute("data-folded", ""));

    const { result } = renderHook(() => useFoldedAlerts(list, 28, true));
    const empty = renderHook(() => useFoldedAlerts(null, 28, false));

    expect(result.current).toBe(0);
    expect(list.querySelectorAll("[data-folded]")).toHaveLength(0);
    expect(empty.result.current).toBe(0);
  });

  it("watches an alert that comes later, as well as those already there", async () => {
    const list = listOf(1);

    renderHook(() => useFoldedAlerts(list, 28, false));
    list.append(document.createElement("section"));
    // The list's children are watched afresh once the change is heard.
    await act(async () => Promise.resolve());

    expect((Observer.last as Observer).watched).toHaveLength(2);
  });

  it("is compact by itself on a phone held upright and short, and on any phone on its side", () => {
    expect(SMALL_HUD_SCREEN).toContain("(orientation: portrait) and (max-height: 520px)");
    expect(SMALL_HUD_SCREEN).toContain("(orientation: landscape) and (max-height: 500px)");
  });
});
