import { ModelSource } from "../core/ModelSource";
import { ModelAsset } from "../domain/types";

// The models a site can show, as slots: each id is registered with the source that fills it, nothing loads until a
// scene asks for it (or a host preloads it as it comes near), and each loads once however many actors and scenes
// use it. A load that fails is forgotten, so the next ask tries again.
export class ModelRegistry {
  private readonly slots = new Map<string, ModelSource>();
  private readonly loads = new Map<string, Promise<ModelAsset>>();

  public register(model: string, source: ModelSource): this {
    this.slots.set(model, source);

    return this;
  }

  public has(model: string): boolean {
    return this.slots.has(model);
  }

  public isLoaded(model: string): boolean {
    return this.loads.has(model);
  }

  public load(model: string): Promise<ModelAsset> {
    const loading = this.loads.get(model);

    if (loading) {
      return loading;
    }

    const source = this.slots.get(model);

    if (!source) {
      return Promise.reject(new Error(`No slot for the model "${model}"`));
    }

    const loaded = source.load(model).catch((error: unknown) => {
      this.loads.delete(model);
      throw error;
    });

    this.loads.set(model, loaded);

    return loaded;
  }

  // Starts loading what a scene about to be seen will need, ignoring failures (the scene asks again when it mounts).
  public preload(...models: string[]): void {
    models.forEach((model) => {
      this.load(model).catch(() => undefined);
    });
  }
}
