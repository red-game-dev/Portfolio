import { StageFrame, StageScene, StageTarget } from "../domain/types";
import { ModelRegistry } from "../services/ModelRegistry";

// Where in a 2D target a stage draws, in the target's own units.
export interface StageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// A scene set up on a stage, for drawing its frames and taking it down again.
export interface SceneHandle {
  readonly id: number;
}

// What every 3D renderer the site can use shares: one per page, offscreen, drawn into whatever 2D canvases need it.
// Scenes are set up once (their models from the registry's slots, uploaded to the GPU once and shared between
// scenes), each frame is rendered at the size it is drawn at and then composited into a 2D target, and the quality
// steps down on a device that cannot keep up. An adapter that loses its GPU says so, and the service moves on.
export abstract class Stage {
  protected readonly models: ModelRegistry;
  private readonly lostListeners = new Set<() => void>();
  public abstract readonly id: string;

  constructor(models: ModelRegistry) {
    this.models = models;
  }

  // 0 (the least a weak device can keep up with) to 3 (all of it): the pixel ratio, the shadows' sharpness and the
  // skin's fine detail follow it, and materials made from then on are lighter at the lower levels.
  public abstract get quality(): number;

  public onLost(listener: () => void): () => void {
    this.lostListeners.add(listener);

    return () => this.lostListeners.delete(listener);
  }

  // The GPU was taken away (the browser reclaims contexts under pressure): everything listening is told once.
  protected lose(): void {
    this.lostListeners.forEach((listener) => listener());
    this.lostListeners.clear();
  }

  // Gets ready to draw; false where it cannot (no WebGL), so the service tries the next adapter.
  public abstract prepare(): Promise<boolean>;

  // Sets a scene up; resolves once every model it names is loaded and on the GPU.
  public abstract mount(scene: StageScene): Promise<SceneHandle>;

  // A picture painted in 2D that a material shows (a card's face), handed again with a new version when it changes.
  public abstract setPicture(id: string, source: TexImageSource, version: number): void;

  // Renders a scene's frame at the device pixel size the host draws it at, then draws it into `target` over `box`
  // (in the target's own units).
  public abstract draw(scene: SceneHandle, frame: StageFrame, target: StageTarget, box: StageBox, pixels: { width: number; height: number }): void;

  public abstract unmount(scene: SceneHandle): void;

  // Moves the quality to another level (see `quality`).
  public abstract setQuality(level: number): void;

  public abstract dispose(): void;
}
