import { act, renderHook } from "@testing-library/react";

import { useInvite } from "@/components/Finale/hooks/useInvite";
import { INVITE_KEY, INVITE_SECONDS, isInviteChoice, nextCount } from "@/components/Finale/invite";
import { gainOf } from "@/components/Finale/Voyage/hooks/useGains";

// Each second its own act, so the count's next timeout is set after the render that follows the last one.
const wait = (seconds: number) => {
  for (let second = 0; second < seconds; second += 1) {
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
};

describe("the finale's invite to play", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("the count starts full while the ship is watched, runs down to zero, and starts over if the reader looks away", () => {
    let count = nextCount(null, { kind: "watch", isWatching: true });

    expect(count).toBe(INVITE_SECONDS);

    count = nextCount(nextCount(count, { kind: "tick" }), { kind: "watch", isWatching: true });
    expect(count).toBe(INVITE_SECONDS - 1);

    for (let tick = 0; tick < INVITE_SECONDS + 2; tick += 1) {
      count = nextCount(count, { kind: "tick" });
    }

    expect(count).toBe(0);
    expect(nextCount(count, { kind: "watch", isWatching: false })).toBeNull();
    expect(nextCount(null, { kind: "tick" })).toBeNull();
  });

  test("only a kept answer reads back", () => {
    expect(isInviteChoice("taken")).toBe(true);
    expect(isInviteChoice("declined")).toBe(true);
    expect(isInviteChoice("yes")).toBe(false);
    expect(isInviteChoice(null)).toBe(false);
  });

  test("the first time in orbit, the journey goes on by itself once the count runs out, and only that once", () => {
    const open = jest.fn();
    const { result, rerender } = renderHook(
      (props: { isInView: boolean }) => useInvite({ isOrbit: true, isInView: props.isInView, isOpen: false, isChoosing: false, open }),
      { initialProps: { isInView: true } },
    );

    expect(result.current.count).toBe(INVITE_SECONDS);

    wait(2);
    expect(result.current.count).toBe(INVITE_SECONDS - 2);

    // Looking away stops the count; coming back starts it over.
    rerender({ isInView: false });
    expect(result.current.count).toBeNull();
    rerender({ isInView: true });
    expect(result.current.count).toBe(INVITE_SECONDS);

    wait(INVITE_SECONDS);
    expect(open).toHaveBeenCalledTimes(1);
    expect(result.current.count).toBeNull();
    expect(window.localStorage.getItem(INVITE_KEY)).toBe(JSON.stringify("taken"));

    const again = renderHook(() => useInvite({ isOrbit: true, isInView: true, isOpen: false, isChoosing: false, open }));

    expect(again.result.current.count).toBeNull();
  });

  test("focus on the choice holds the count where it is, and a page in the background never counts", () => {
    const open = jest.fn();
    const { result, rerender } = renderHook(
      (props: { isChoosing: boolean }) => useInvite({ isOrbit: true, isInView: true, isOpen: false, isChoosing: props.isChoosing, open }),
      { initialProps: { isChoosing: false } },
    );

    wait(1);
    rerender({ isChoosing: true });
    wait(INVITE_SECONDS * 2);
    expect(result.current.count).toBe(INVITE_SECONDS - 1);
    expect(open).not.toHaveBeenCalled();

    rerender({ isChoosing: false });
    wait(INVITE_SECONDS);
    expect(open).toHaveBeenCalledTimes(1);

    window.localStorage.clear();

    const hidden = jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const background = renderHook(() => useInvite({ isOrbit: true, isInView: true, isOpen: false, isChoosing: false, open }));

    expect(background.result.current.count).toBeNull();
    hidden.mockRestore();
  });

  test("no thanks stops the count and is remembered, and the reader can still choose to play", () => {
    const open = jest.fn();
    const { result } = renderHook(() => useInvite({ isOrbit: true, isInView: true, isOpen: false, isChoosing: false, open }));

    act(() => result.current.decline());
    wait(INVITE_SECONDS * 2);

    expect(open).not.toHaveBeenCalled();
    expect(result.current.count).toBeNull();
    expect(window.localStorage.getItem(INVITE_KEY)).toBe(JSON.stringify("declined"));

    act(() => result.current.accept());
    expect(open).toHaveBeenCalledTimes(1);
  });

  test("a coin count shows what it rose by, never its first reading or a fall", () => {
    expect(gainOf(null, 120)).toBeNull();
    expect(gainOf(120, 135)).toBe(15);
    expect(gainOf(135, 100)).toBeNull();
    expect(gainOf(100, 100)).toBeNull();
  });
});
