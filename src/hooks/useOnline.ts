import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

// Whether the browser says it has a connection, following it as it comes and goes, for what needs one (Ask Red, the
// message form, the daily board) to say so plainly. Online on the server and in the first client render, so hydration
// matches; the real value lands right after.
export const useOnline = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

// Whether the browser says it has no connection now, for code that acts rather than renders.
export const isOffline = (): boolean => typeof navigator !== "undefined" && navigator.onLine === false;
