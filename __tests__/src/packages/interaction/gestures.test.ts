import {
  DragTracker,
  isPointerlessClick,
  localPoint,
  PinchTracker,
  PressTimer,
  swipeDirection,
  SwipeTracker,
} from "@/packages/interaction/gestures";

describe("PressTimer", () => {
  test("tells a quick press from a held one", () => {
    const timer = new PressTimer(250);

    timer.press(1000);
    expect(timer.isPressed).toBe(true);
    expect(timer.release(1249)).toBe("tap");
    expect(timer.isPressed).toBe(false);

    timer.press(2000);
    expect(timer.release(2250)).toBe("hold");
  });

  test("ends nothing that was never pressed, or that was cancelled", () => {
    const timer = new PressTimer(250);

    expect(timer.release(10)).toBeNull();

    timer.press(100);
    timer.cancel();
    expect(timer.isPressed).toBe(false);
    expect(timer.release(150)).toBeNull();
  });
});

describe("SwipeTracker", () => {
  test("turns a long enough swipe of a finger or pen, right to left going forward", () => {
    const swipe = new SwipeTracker(40);

    swipe.start(200, "touch");
    expect(swipe.end(150)).toBe(1);

    swipe.start(100, "pen");
    expect(swipe.end(160)).toBe(-1);
  });

  test("leaves a short swipe, a mouse, and a lift with no swipe begun", () => {
    const swipe = new SwipeTracker(40);

    swipe.start(100, "touch");
    expect(swipe.end(140)).toBeNull();

    swipe.start(300, "mouse");
    expect(swipe.end(100)).toBeNull();

    expect(swipe.end(0)).toBeNull();
  });

  test("forgets a swipe once it has ended", () => {
    const swipe = new SwipeTracker(40);

    swipe.start(200, "touch");
    swipe.end(100);
    expect(swipe.end(0)).toBeNull();
  });
});

describe("DragTracker", () => {
  test("reports how far the pointer moved since the last reading", () => {
    const drag = new DragTracker();

    drag.start(10, 20);
    expect(drag.isDragging).toBe(true);
    expect(drag.move(15, 18)).toEqual({ x: 5, y: -2 });
    expect(drag.move(15, 30)).toEqual({ x: 0, y: 12 });
  });

  test("reports nothing before a drag starts or after it ends", () => {
    const drag = new DragTracker();

    expect(drag.move(5, 5)).toBeNull();

    drag.start(0, 0);
    drag.end();
    expect(drag.isDragging).toBe(false);
    expect(drag.move(5, 5)).toBeNull();
  });
});

describe("PinchTracker", () => {
  test("is no pinch with one pointer", () => {
    const pinch = new PinchTracker();

    expect(pinch.track(1, 0, 0)).toBeNull();
    expect(pinch.track(1, 10, 0)).toBeNull();
    expect(pinch.count).toBe(1);
    expect(pinch.isPinching).toBe(false);
  });

  test("applies nothing as a pinch begins, then how much the spread changed, even when it did not", () => {
    const pinch = new PinchTracker();

    pinch.track(1, 0, 0);
    expect(pinch.track(2, 100, 0)).toBeNull();
    expect(pinch.isPinching).toBe(true);
    expect(pinch.track(2, 200, 0)).toBe(2);
    expect(pinch.track(1, 100, 0)).toBe(0.5);
    expect(pinch.track(1, 100, 0)).toBe(1);
  });

  test("measures the first two pointers down and ignores a third", () => {
    const pinch = new PinchTracker();

    pinch.track(1, 0, 0);
    pinch.track(2, 0, 50);
    expect(pinch.track(3, 500, 500)).toBe(1);
    expect(pinch.track(2, 0, 100)).toBe(2);
  });

  test("applies nothing while the two touch, or as they part", () => {
    const pinch = new PinchTracker();

    pinch.track(1, 10, 10);
    expect(pinch.track(2, 10, 10)).toBeNull();
    expect(pinch.track(2, 30, 10)).toBeNull();
    expect(pinch.track(2, 50, 10)).toBe(2);
  });

  test("starts afresh once fewer than two remain, keeping the order pointers came down in", () => {
    const pinch = new PinchTracker();

    pinch.track(1, 0, 0);
    pinch.track(2, 100, 0);
    pinch.release(1);
    expect(pinch.count).toBe(1);
    expect(pinch.isPinching).toBe(false);
    expect(pinch.track(2, 100, 0)).toBeNull();
    expect(pinch.track(3, 100, 50)).toBeNull();
    expect(pinch.track(3, 100, 100)).toBe(2);
    pinch.release(9);
    expect(pinch.count).toBe(2);
  });

  test("forgets every pointer at once", () => {
    const pinch = new PinchTracker();

    pinch.track(1, 0, 0);
    pinch.track(2, 100, 0);
    pinch.clear();
    expect(pinch.count).toBe(0);
    expect(pinch.track(2, 50, 0)).toBeNull();
    expect(pinch.track(1, 50, 50)).toBeNull();
  });
});

describe("pointer helpers", () => {
  test("read a pointer from an element's top left corner", () => {
    const element = { getBoundingClientRect: () => ({ left: 30, top: 40 }) };

    expect(localPoint({ clientX: 50, clientY: 45 }, element)).toEqual({ x: 20, y: 5 });
  });

  test("turn a swipe only past its threshold", () => {
    expect(swipeDirection(-41, 40)).toBe(1);
    expect(swipeDirection(41, 40)).toBe(-1);
    expect(swipeDirection(40, 40)).toBeNull();
    expect(swipeDirection(-40, 40)).toBeNull();
  });

  test("tell a click with no pointer behind it", () => {
    expect(isPointerlessClick({ detail: 0 })).toBe(true);
    expect(isPointerlessClick({ detail: 1 })).toBe(false);
  });
});
