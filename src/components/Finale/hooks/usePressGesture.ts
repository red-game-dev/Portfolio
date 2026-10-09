import { MouseEvent, PointerEvent, useCallback, useRef, useState } from "react";

import { isPointerlessClick, PressKind, PressTimer } from "@/packages/interaction/gestures";

interface PressGestureOptions {
  // A press shorter than this (ms) is a tap.
  tapMs: number;
  // Whether a pointer going down now starts a press; a control with nothing to do leaves it alone.
  canPress: () => boolean;
  // A press starting.
  onPress: () => void;
  // A press let go: a tap or a hold.
  onRelease: (kind: PressKind) => void;
  // The pointer taken away mid press (by a scroll, or by the system).
  onCancel: () => void;
  // A click with no pointer behind it, from a keyboard's Space or Enter or from assistive technology: one press.
  onPointerlessClick: () => void;
}

// Props for a button a pointer can hold or tap, and anything else presses once. The pointer is captured for the
// whole press, so it ends wherever it is let go, even off the button, and a long press never opens the context
// menu. Pair the button with `touch-action: none`, so holding it never scrolls the page.
export const usePressGesture = (options: PressGestureOptions) => {
  const [timer] = useState(() => new PressTimer(options.tapMs));
  const latest = useRef(options);

  latest.current = options;

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!latest.current.canPress()) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    timer.press(event.timeStamp);
    latest.current.onPress();
  }, [timer]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const kind = timer.release(event.timeStamp);

    if (kind) {
      latest.current.onRelease(kind);
    }
  }, [timer]);

  const onPointerCancel = useCallback(() => {
    timer.cancel();
    latest.current.onCancel();
  }, [timer]);

  const onClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (isPointerlessClick(event)) {
      latest.current.onPointerlessClick();
    }
  }, []);

  const onContextMenu = useCallback((event: MouseEvent<HTMLElement>) => event.preventDefault(), []);

  return { onPointerDown, onPointerUp, onPointerCancel, onClick, onContextMenu };
};
