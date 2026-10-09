import { useSyncExternalStore } from "react";

const subscribe = (listener: () => void) => {
  document.addEventListener("visibilitychange", listener);

  return () => document.removeEventListener("visibilitychange", listener);
};

// Whether the page is the one on screen: false while its tab is in the background or the window is minimised,
// for anything timed that should not run unseen. The server, and the first client render, count it as shown.
export const usePageVisible = () => useSyncExternalStore(subscribe, () => document.visibilityState === "visible", () => true);
