import { act, renderHook } from "@testing-library/react";

import { useInvite } from "@/components/Finale/hooks/useInvite";
import { INVITE_KEY, isInviteChoice } from "@/components/Finale/invite";
import { gainOf } from "@/components/Finale/Voyage/hooks/useGains";

describe("the finale's invite to play", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("only a kept answer reads back", () => {
    expect(isInviteChoice("taken")).toBe(true);
    expect(isInviteChoice("declined")).toBe(true);
    expect(isInviteChoice("yes")).toBe(false);
    expect(isInviteChoice(null)).toBe(false);
  });

  test("asks until answered, and nothing opens by itself however long the reader looks", () => {
    const open = jest.fn();
    const { result } = renderHook(() => useInvite(open));

    expect(result.current.isAsking).toBe(true);
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(open).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(INVITE_KEY)).toBeNull();
  });

  test("yes opens the voyage and is kept, so it is not asked again", () => {
    const open = jest.fn();
    const { result } = renderHook(() => useInvite(open));

    act(() => result.current.accept());
    expect(open).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(INVITE_KEY)).toBe(JSON.stringify("taken"));

    const again = renderHook(() => useInvite(open));

    expect(again.result.current.isAsking).toBe(false);
  });

  test("no thanks is kept, and the reader can still choose to play", () => {
    const open = jest.fn();
    const { result } = renderHook(() => useInvite(open));

    act(() => result.current.decline());
    expect(open).not.toHaveBeenCalled();
    expect(result.current.isAsking).toBe(false);
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
