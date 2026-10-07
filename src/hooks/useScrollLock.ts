import { useEffect, useSyncExternalStore } from "react";

// How many things currently hold the page still (an intro, a modal). Counted, so one closing never frees
// the page while another still holds it.
let holds = 0;
let previousOverflow = "";
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const hold = () => {
  if (holds === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }

  holds += 1;
  notify();

  return () => {
    holds -= 1;

    if (holds === 0) {
      document.documentElement.style.overflow = previousOverflow;
    }

    notify();
  };
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// Keeps the page from scrolling while `isActive`.
export default function useScrollLock(isActive: boolean) {
  useEffect(() => (isActive ? hold() : undefined), [isActive]);
}

// Whether anything holds the page still, for work that should pause meanwhile, such as the backdrop.
export const usePageHeld = () => useSyncExternalStore(subscribe, () => holds > 0, () => false);
