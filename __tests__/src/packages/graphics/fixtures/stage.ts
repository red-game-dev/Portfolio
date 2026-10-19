import { ModelRegistry, SceneHandle, Stage, StageScene } from "@/packages/graphics/stage3d";

// A stage with no GPU that keeps every scene mounted on it, for checking what is warmed and how often.
export class MountingStage extends Stage {
  public readonly id = "mounting";
  public readonly mounted: StageScene[] = [];

  constructor() {
    super(new ModelRegistry());
  }

  public get quality(): number {
    return 3;
  }

  public prepare(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public mount(scene: StageScene): Promise<SceneHandle> {
    this.mounted.push(scene);

    return Promise.resolve({ id: this.mounted.length });
  }

  public setPicture(): void {
    return undefined;
  }

  public draw(): void {
    return undefined;
  }

  public unmount(): void {
    return undefined;
  }

  public setQuality(): void {
    return undefined;
  }

  public dispose(): void {
    return undefined;
  }
}
