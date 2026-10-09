// A black hole as the lens sees it, in CSS pixels from the top left of the screen: its centre, the radius of
// its shadow, and its Einstein radius, where light from straight behind it forms a ring.
export interface LensSource {
  x: number;
  y: number;
  shadow: number;
  einstein: number;
}
