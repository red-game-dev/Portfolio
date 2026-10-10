import { DependencyList, RefObject, useEffect, useRef, useState } from "react";

import useInView from "@/hooks/useInView";

export interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

// An engine stops; one that holds the GPU or other resources also gives them back when it goes.
interface StoppableEngine {
  stop(): void;
  dispose?(): void;
}

// Stops an engine for good: whatever it holds is given back, or it is at least stopped.
const retire = (engine: StoppableEngine) => {
  engine.stop();
  engine.dispose?.();
};

interface CanvasEngineOptions<TEngine extends StoppableEngine> {
  // Builds the engine for the canvas. Return a promise to load the engine's code first: it is then only
  // fetched once the canvas comes near the screen.
  create: (context: CanvasRenderingContext2D) => TEngine | Promise<TEngine>;
  // How this engine takes a new size, in CSS pixels plus the device pixel ratio.
  resize: (engine: TEngine, size: CanvasSize) => void;
  // The element the canvas fills; its size is followed. Defaults to the canvas itself.
  sizeRef?: RefObject<HTMLElement>;
  // False builds nothing, for views or settings without this effect.
  isEnabled?: boolean;
  contextOptions?: CanvasRenderingContext2DSettings;
  // How far ahead of the screen to build, as an IntersectionObserver root margin.
  nearMargin?: string;
}

// Wires a canvas engine to the page the same way everywhere: built (and its code loaded) once the canvas is
// near the screen, sized from a ResizeObserver at the device's pixel ratio, rebuilt when `deps` change, and
// retired when the component goes or it is rebuilt (stopped, and its GPU and other resources given back where it
// has a `dispose`). A build that finishes after the component has gone is retired at once.
// Starting and stopping while built is the caller's: engines differ in when they should run.
export default function useCanvasEngine<TEngine extends StoppableEngine>(
  canvasRef: RefObject<HTMLCanvasElement>,
  { create, resize, sizeRef, isEnabled = true, contextOptions, nearMargin = "50% 0px" }: CanvasEngineOptions<TEngine>,
  deps: DependencyList = [],
): TEngine | null {
  const [engine, setEngine] = useState<TEngine | null>(null);
  const isNear = useInView(sizeRef ?? canvasRef, { once: true, threshold: 0, rootMargin: nearMargin });
  // The latest functions, without rebuilding the engine when the caller passes new ones each render.
  const createRef = useRef(create);
  const resizeRef = useRef(resize);

  createRef.current = create;
  resizeRef.current = resize;

  useEffect(() => {
    const canvas = canvasRef.current;
    const sized = sizeRef?.current ?? canvas;
    const context = canvas?.getContext("2d", contextOptions);

    if (!isEnabled || !isNear || !sized || !context) {
      return;
    }

    let built: TEngine | null = null;
    let isGone = false;
    const observer = new ResizeObserver(() => {
      if (built) {
        resizeRef.current(built, { width: sized.clientWidth, height: sized.clientHeight, pixelRatio: window.devicePixelRatio || 1 });
      }
    });

    Promise.resolve(createRef.current(context))
      .then((next) => {
        if (isGone) {
          retire(next);

          return;
        }

        built = next;
        resizeRef.current(next, { width: sized.clientWidth, height: sized.clientHeight, pixelRatio: window.devicePixelRatio || 1 });
        observer.observe(sized);
        setEngine(next);
      })
      // console.error is the one console call the production build keeps; the page simply goes without it.
      // eslint-disable-next-line no-console
      .catch((error: unknown) => console.error("A canvas effect could not start", error));

    return () => {
      isGone = true;
      observer.disconnect();
      if (built) {
        retire(built);
      }

      setEngine(null);
    };
    // Rebuilt for the caller's own dependencies, not for new function identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, sizeRef, isEnabled, isNear, ...deps]);

  return engine;
}
