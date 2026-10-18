import type { WarmMessage } from "@/sw/service-worker";

// The site's offline copy: the service worker built from src/sw/service-worker.ts into /sw.js. It is registered once
// the page has loaded and the browser is idle, in production only, so it never competes with the first paint. Each
// time a worker takes the page over (the first visit, then each deploy), the page tells it what it fetched before the
// worker could see it, and fetches the pictures still to come once, so the whole page reads offline. A connection that
// asks to save data gets neither.
export const SERVICE_WORKER_URL = "/sw.js";

// How many pictures are fetched at once while the copy is made.
const AT_ONCE = 4;

const savesData = (): boolean => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

// What the page fetched before the worker could see it: its pictures, fonts and scripts so far.
const fetchedSoFar = (): string[] => performance.getEntriesByType("resource").map((entry) => entry.name);

// One picture fetched as the page would fetch it at this screen's size, on an element of its own, so the page's own
// stays as React left it.
const fetchLike = (image: HTMLImageElement) => new Promise<void>((resolve) => {
  const copy = new Image();

  copy.onload = () => resolve();
  copy.onerror = () => resolve();
  copy.decoding = "async";
  copy.sizes = image.sizes;
  copy.srcset = image.srcset;
  copy.src = image.src;
});

// Every picture in the page not fetched yet (further down, in a closed tab), a few at a time.
const fetchPictures = async (): Promise<void> => {
  const waiting = [...document.querySelectorAll("img")].filter((image) => !image.currentSrc && (image.src || image.srcset));
  const next = async (): Promise<void> => {
    const image = waiting.shift();

    if (image) {
      await fetchLike(image);
      await next();
    }
  };

  await Promise.all(Array.from({ length: AT_ONCE }, next));
};

const warm = (worker: ServiceWorker) => {
  const isFull = !savesData();
  const message: WarmMessage = { type: "warm", urls: fetchedSoFar(), isFull };

  worker.postMessage(message);

  if (isFull) {
    void fetchPictures();
  }
};

const whenIdle = (work: () => void) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(work, { timeout: 5000 });
  } else {
    setTimeout(work, 2000);
  }
};

export const keepOfflineCopy = (): void => {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
    return;
  }

  const { serviceWorker } = navigator;
  const register = () => whenIdle(() => {
    serviceWorker.register(SERVICE_WORKER_URL, { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  });

  // Listened for before registering, since a new worker takes the page over as soon as it is ready.
  serviceWorker.addEventListener("controllerchange", () => {
    if (serviceWorker.controller) {
      warm(serviceWorker.controller);
    }
  });

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
};
