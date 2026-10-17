import { ModelAsset } from "../domain/types";

// Where a slot's model comes from: built by code (in a worker, so the page never waits on it), read from a file, or
// anything else that hands back a `ModelAsset`. A source loads; the registry decides when, and keeps the result.
export abstract class ModelSource {
  public abstract readonly id: string;

  public abstract load(model: string): Promise<ModelAsset>;
}
