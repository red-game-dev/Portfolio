import { act, renderHook } from "@testing-library/react";

import { useFoldedAlerts } from "@/components/Finale/Voyage/hooks/useFoldedAlerts";
import { SMALL_HUD_SCREEN } from "@/components/Finale/Voyage/hud";

// An element standing where a test puts it: its top on the page, which is all the folding reads.
const at = <T extends HTMLElement>(element: T, top: number): T => {
  element.getBoundingClientRect = () => ({ top, left: 0, right: 100, bottom: top + 40, width: 100, height: 40, x: 0, y: top, toJSON: () => ({}) });

  return element;
};

// A list whose top is at 100, with the line standing for folded alerts and an alert at each top given.
const listOf = (tops: number[]) => {
  const list = at(document.createElement("div"), 100);
  const more = document.createElement("button");

  more.setAttribute("data-alerts-more", "");
  list.append(more, ...tops.map((top) => at(document.createElement("section"), top)));

  return list;
};

const foldedOf = (list: HTMLElement) => [...list.querySelectorAll("section")].map((alert) => alert.hasAttribute("data-folded"));

describe("the voyage's alerts", () => {
  it("folds every alert with no whole room, and those under the line's room once any is cut", () => {
    // The first is cut off at the top; the second starts inside the line's 28px; the last has its room.
    const list = listOf([60, 120, 200]);
    const { result } = renderHook(() => useFoldedAlerts(list, 28, false));

    expect(result.current).toBe(2);
    expect(foldedOf(list)).toEqual([true, true, false]);
  });

  it("keeps an alert that fits whole, even at the very top, while none is cut", () => {
    const list = listOf([100, 180]);
    const { result } = renderHook(() => useFoldedAlerts(list, 28, false));

    expect(result.current).toBe(0);
    expect(foldedOf(list)).toEqual([false, false]);
  });

  it("folds nothing while they are opened, keeping the count so the line stays put, and nothing without a list", () => {
    const list = listOf([60, 200]);
    const { result, rerender } = renderHook(({ isOpen }) => useFoldedAlerts(list, 28, isOpen), { initialProps: { isOpen: false } });

    expect(result.current).toBe(1);
    rerender({ isOpen: true });

    expect(result.current).toBe(1);
    expect(foldedOf(list)).toEqual([false, false]);
    expect(renderHook(() => useFoldedAlerts(null, 28, false)).result.current).toBe(0);
  });

  it("reads them again when an alert comes", async () => {
    const list = listOf([200]);
    const { result } = renderHook(() => useFoldedAlerts(list, 28, false));

    expect(result.current).toBe(0);
    list.prepend(at(document.createElement("section"), 50));
    // The change is heard, then the alerts are read afresh.
    await act(async () => Promise.resolve());

    expect(result.current).toBe(1);
  });

  it("is compact by itself on a phone held upright and short, and on any phone on its side", () => {
    expect(SMALL_HUD_SCREEN).toContain("(orientation: portrait) and (max-height: 520px)");
    expect(SMALL_HUD_SCREEN).toContain("(orientation: landscape) and (max-height: 500px)");
  });
});
