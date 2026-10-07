import { DependencyList, useEffect } from "react";

import { createBrowserScrollFrame, FrameTask, ScrollFrame } from "@/packages/interaction/scroll-frame";

let shared: ScrollFrame | null = null;

// The page's one scroll frame, made on first use in the browser.
export const getScrollFrame = (): ScrollFrame => {
  shared = shared ?? createBrowserScrollFrame(window);

  return shared;
};

// Runs a task on the shared scroll frame while the component is mounted and `isEnabled` holds: its read
// on every frame the page scrolls or resizes, before any other reader writes, then its write.
export default function useScrollFrame<T>(createTask: () => FrameTask<T>, deps: DependencyList, isEnabled = true) {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    return getScrollFrame().subscribe(createTask());
    // The task is rebuilt from the caller's own dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, ...deps]);
}
