// An entity is only an id; what it is comes from the components stored against it.
export type Entity = number;

// One piece of game logic, run in order at a fixed step. `dt` is in seconds.
export interface System<TContext> {
  readonly name: string;
  update(context: TContext, dt: number): void;
  // Forgets whatever it carries from one step to the next (timers, flags), for a run that starts afresh.
  reset?(): void;
}

// A rectangle in world units.
export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

// One step of a layered renderer: each layer draws its part of the frame, in order.
export interface RenderLayer<TFrame> {
  readonly name: string;
  resize?(viewport: Viewport, pixelRatio: number): void;
  draw(frame: TFrame): void;
}
