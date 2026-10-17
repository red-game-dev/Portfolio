import { MaterialSpec, ModelAsset } from "../domain/types";
import { parseGlb } from "../utils/glb";
import { ModelSource } from "./ModelSource";

// A model made elsewhere, as a binary glTF file: fetched when a scene first asks for it, its mesh scaled into the units
// the scene places models in, and drawn in the material it is given (pictures by their address).
export interface GlbModel {
  url: string;
  material: MaterialSpec;
  // Model units per unit of the file.
  scale?: number;
  // The part's name, for tinting it.
  name?: string;
}

export class GlbModelSource extends ModelSource {
  public readonly id = "glb";
  private readonly files: Record<string, GlbModel>;
  private readonly fetcher: (url: string) => Promise<ArrayBuffer>;

  constructor(files: Record<string, GlbModel>, fetcher: (url: string) => Promise<ArrayBuffer> = (url) => fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`The model at ${url} could not be fetched`);
    }

    return response.arrayBuffer();
  })) {
    super();
    this.files = files;
    this.fetcher = fetcher;
  }

  public async load(model: string): Promise<ModelAsset> {
    const file = this.files[model];

    if (!file) {
      throw new Error(`No model file for "${model}"`);
    }

    const mesh = parseGlb(await this.fetcher(file.url));
    const scale = file.scale ?? 1;

    if (scale !== 1) {
      mesh.positions.forEach((value, index) => {
        mesh.positions[index] = value * scale;
      });
    }

    return { id: model, parts: [{ name: file.name ?? "body", material: file.material, mesh }] };
  }
}
