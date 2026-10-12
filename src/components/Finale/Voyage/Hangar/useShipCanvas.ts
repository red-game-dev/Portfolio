import { DependencyList, RefObject, useEffect } from "react";

// Draws the ship into a canvas at the screen's pixel ratio (at most 2), again whenever `deps` change and whenever
// the canvas changes size, which it first does when its tab is opened (a hidden tab has no size to draw at).
export const useShipCanvas = (
  canvasRef: RefObject<HTMLCanvasElement>,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
  deps: DependencyList,
) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return undefined;
    }

    const paint = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);

      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        draw(context, width, height);
      }
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(paint);

    paint();
    observer?.observe(canvas);

    return () => observer?.disconnect();
    // The caller names what the drawing depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
