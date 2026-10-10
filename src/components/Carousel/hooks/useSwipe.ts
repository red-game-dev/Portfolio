import { PointerEvent, useState } from "react";

import { Direction, SwipeTracker } from "@/packages/interaction/gestures";

// Pointer handlers that turn a horizontal swipe of a finger or a pen across an element into `onSwipe`, right to
// left going forward; a mouse is left to select and click. Pair the element with `touch-action: pan-y`, so the
// browser still scrolls the page vertically under the same finger.
export const useSwipe = (onSwipe: (direction: Direction) => void, threshold: number) => {
  const [swipe] = useState(() => new SwipeTracker(threshold));

  return {
    onPointerDown: (event: PointerEvent) => swipe.start(event.clientX, event.pointerType),
    onPointerUp: (event: PointerEvent) => {
      const direction = swipe.end(event.clientX);

      if (direction) {
        onSwipe(direction);
      }
    },
  };
};
