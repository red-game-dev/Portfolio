import { RefObject, useEffect, useRef } from "react";

import { listenOutside } from "@/packages/interaction/focus";

// While `isActive`, calls `onOutside` whenever a press (a finger, a pen or a mouse) starts outside the element
// `ref` holds: for closing a popover when the reader presses anywhere else.
export const useOutsidePress = (ref: RefObject<HTMLElement>, isActive: boolean, onOutside: () => void) => {
  const latest = useRef(onOutside);

  latest.current = onOutside;

  useEffect(() => (isActive ? listenOutside(document, () => ref.current, () => latest.current()) : undefined), [isActive, ref]);
};
