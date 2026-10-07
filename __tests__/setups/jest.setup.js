require("@testing-library/jest-dom");

// What jsdom lacks and the components use: observers, media queries and the modal dialog API.
class MockObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

global.IntersectionObserver = global.IntersectionObserver || MockObserver;
global.ResizeObserver = global.ResizeObserver || MockObserver;

if (typeof window !== "undefined") {
  window.matchMedia = window.matchMedia || ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));

  if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }

  window.scrollTo = window.scrollTo || (() => {});

  // jsdom has no canvas. Returning no context is what code that draws already handles (it skips drawing),
  // instead of jsdom logging "not implemented" for every call.
  if (typeof HTMLCanvasElement !== "undefined") {
    HTMLCanvasElement.prototype.getContext = function getContext() {
      return null;
    };
  }
}
