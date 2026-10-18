// The browser's word on whether it has a connection. It can say online while a network fails to answer, never offline
// while one works, so offline is the answer to act on: what needs a connection says so rather than trying.
export const isOffline = (): boolean => typeof navigator !== "undefined" && navigator.onLine === false;

// Calls `onChange` whenever the connection comes or goes; the returned function stops listening.
export const watchConnection = (onChange: () => void): (() => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};
