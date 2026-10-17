import { ModelAsset } from "../domain/types";
import { ModelSource } from "./ModelSource";

// A model built by a pure function on the page itself, for a host with no worker (a test, a server).
export class BuilderModelSource extends ModelSource {
  public readonly id = "builder";
  private readonly build: (model: string) => ModelAsset;

  constructor(build: (model: string) => ModelAsset) {
    super();
    this.build = build;
  }

  public load(model: string): Promise<ModelAsset> {
    try {
      return Promise.resolve(this.build(model));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
