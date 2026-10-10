import { FocusEvent, useCallback, useRef } from "react";

import { focusLeaves } from "@/packages/interaction/focus";

// The blur handler for a container that calls `onLeave` once focus moves out of it, and not while it moves between
// the container's own controls: for closing a menu the reader has tabbed past, or knowing a choice no longer has
// their attention. Focus leaving the page counts as leaving.
export default function useFocusLeave(onLeave: () => void) {
  const latest = useRef(onLeave);

  latest.current = onLeave;

  return useCallback((event: FocusEvent<HTMLElement>) => {
    if (focusLeaves(event.currentTarget, event.relatedTarget)) {
      latest.current();
    }
  }, []);
}
