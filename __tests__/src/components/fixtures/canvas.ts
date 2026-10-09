// Reports everything it observes as on screen, at once, so a canvas engine builds straight away.
class OnScreenObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  public observe(target: Element) {
    this.callback([{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }

  public disconnect() {
    return undefined;
  }

  public unobserve() {
    return undefined;
  }
}

// Lets canvas engines build in jsdom, which has no 2D context and never sees anything on screen: every canvas
// hands out a context (the engines under test are fakes, so any object will do) and everything counts as in view.
// Returns how to put both back.
export const stubCanvases = () => {
  // Kept to put back afterwards, never called here.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const getContext = HTMLCanvasElement.prototype.getContext;
  const Observer = window.IntersectionObserver;

  HTMLCanvasElement.prototype.getContext = (() => ({})) as unknown as typeof getContext;
  window.IntersectionObserver = OnScreenObserver as unknown as typeof IntersectionObserver;

  return () => {
    HTMLCanvasElement.prototype.getContext = getContext;
    window.IntersectionObserver = Observer;
  };
};
