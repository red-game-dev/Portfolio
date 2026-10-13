export interface ZoomInputOptions {
  // How much a pixel of wheel travel zooms: the factor is e to the power of minus the travel times this, so
  // rolling away zooms out, rolling back zooms in, and equal travel either way cancels out.
  wheel: number;
  // The same for a trackpad's pinch, which browsers send as a wheel with the control key held, in far smaller steps.
  pinch: number;
  // The factor one key press zooms in by; zooming out divides by it.
  step: number;
}

// Which way a key zooms: in or out.
export type ZoomDirection = -1 | 1;
