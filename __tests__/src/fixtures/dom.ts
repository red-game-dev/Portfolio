/* eslint-disable max-classes-per-file -- small doubles for what jsdom leaves out, kept together */
import { FakeContext2D } from "./canvas";

// Typed stand ins for what jsdom leaves out or never measures: boxes, observers, media queries, and a check that an
// element is the kind a test needs before it is used as one.

interface Box {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

// A box where jsdom lays nothing out, with every side a DOMRect has.
export const rect = ({ left = 0, top = 0, width = 0, height = 0 }: Box = {}): DOMRect => ({
  x: left,
  y: top,
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  toJSON: () => ({ left, top, width, height }),
});

// What an observer reports for an element: on screen whole, or off it.
export const entryFor = (target: Element, isIntersecting = true): IntersectionObserverEntry => ({
  target,
  isIntersecting,
  intersectionRatio: isIntersecting ? 1 : 0,
  boundingClientRect: rect(),
  intersectionRect: rect(),
  rootBounds: null,
  time: 0,
});

// Reports everything it observes as on screen, at once, so what waits to be seen starts straight away.
export class OnScreenObserver implements IntersectionObserver {
  public readonly root = null;
  public readonly rootMargin = "0px";
  public readonly thresholds: readonly number[] = [0];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  public observe(target: Element): void {
    this.callback([entryFor(target)], this);
  }

  public disconnect(): void {
    return undefined;
  }

  public takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  public unobserve(): void {
    return undefined;
  }
}

// Lets canvas engines build in jsdom, which has no 2D context and never sees anything on screen: every canvas
// hands out a context that accepts any drawing, and everything counts as in view. Returns how to put both back.
export const stubCanvases = () => {
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function context(this: HTMLCanvasElement) {
    return new FakeContext2D(this);
  });
  const Observer = window.IntersectionObserver;

  window.IntersectionObserver = OnScreenObserver;

  return () => {
    getContext.mockRestore();
    window.IntersectionObserver = Observer;
  };
};

// A media query whose answer the test decides; it never changes, so nothing is told of a change.
export class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  public readonly matches: boolean;
  public readonly media: string;
  public onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null = null;

  constructor(media: string, matches: boolean) {
    super();
    this.media = media;
    this.matches = matches;
  }

  public addListener(): void {
    return undefined;
  }

  public removeListener(): void {
    return undefined;
  }
}

// window.matchMedia answering each query as `matches` says.
export const matchMediaBy = (matches: (query: string) => boolean): typeof window.matchMedia => (query: string) => new FakeMediaQueryList(query, matches(query));
