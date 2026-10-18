import { MaterialSpec, ModelAsset } from "../domain/types";
import { parseGlb } from "../utils/glb";
import { ModelSource } from "./ModelSource";

// A model made elsewhere, as a binary glTF file: fetched when a scene first asks for it (once, however many models it
// holds), its meshes scaled into the units the scene places models in, each drawn in the material named for it
// (pictures by their address). A mesh with no material named is left out.
export interface GlbModel {
  url: string;
  parts: Record<string, MaterialSpec>;
  // Model units per unit of the file.
  scale?: number;
}

export class GlbModelSource extends ModelSource {
  public readonly id = "glb";
  private readonly files: Record<string, GlbModel>;
  private readonly fetcher: (url: string) => Promise<ArrayBuffer>;
  private readonly fetched = new Map<string, Promise<ArrayBuffer>>();

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

    const scale = file.scale ?? 1;
    const buffer = this.fetched.get(file.url) ?? this.fetcher(file.url);

    this.fetched.set(file.url, buffer);
    buffer.catch(() => this.fetched.delete(file.url));

    const parts = parseGlb(await buffer).filter((part) => file.parts[part.name]);

    if (scale !== 1) {
      parts.forEach(({ mesh }) => mesh.positions.forEach((value, index) => {
        mesh.positions[index] = value * scale;
      }));
    }

    return { id: model, parts: parts.map(({ name, mesh }) => ({ name, material: file.parts[name], mesh })) };
  }
}
