// A binary glTF (.glb) read into plain arrays: each mesh by its name, its primitives joined into one, with each
// vertex's place, the way it faces and where it falls on its pictures. Only what a still model needs is read (no
// scenes, skins or animation), so it stays small and has no renderer behind it.

import { isOneOf, isRecord } from "@/packages/core/domain";

export interface GlbMesh {
  positions: Float32Array;
  normals: Float32Array;
  uvs?: Float32Array;
  indices: Uint32Array;
}

export interface GlbPart {
  name: string;
  mesh: GlbMesh;
}

// What is read of an accessor; its type is checked as it is read, since a model may hold kinds (a skin's matrices) that
// a still model never reads.
interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
}

interface BufferView {
  byteOffset?: number;
  byteStride?: number;
}

interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
}

interface GltfMesh {
  name?: string;
  primitives: GltfPrimitive[];
}

interface Gltf {
  accessors: Accessor[];
  bufferViews: BufferView[];
  meshes: GltfMesh[];
}

const ACCESSOR_TYPES = ["SCALAR", "VEC2", "VEC3", "VEC4"] as const;

type AccessorType = typeof ACCESSOR_TYPES[number];

const isOptionalNumber = (value: unknown): boolean => value === undefined || typeof value === "number";

const isAccessor = (value: unknown): value is Accessor => isRecord(value) && typeof value.bufferView === "number" &&
  isOptionalNumber(value.byteOffset) && typeof value.componentType === "number" && typeof value.count === "number" &&
  typeof value.type === "string";

const isBufferView = (value: unknown): value is BufferView => isRecord(value) && isOptionalNumber(value.byteOffset) &&
  isOptionalNumber(value.byteStride);

const isPrimitive = (value: unknown): value is GltfPrimitive => isRecord(value) && isRecord(value.attributes) &&
  Object.values(value.attributes).every((index) => typeof index === "number") && isOptionalNumber(value.indices);

const isMesh = (value: unknown): value is GltfMesh => isRecord(value) && (value.name === undefined || typeof value.name === "string") &&
  Array.isArray(value.primitives) && value.primitives.every(isPrimitive);

// The parts of a glTF this reads, checked before it is trusted.
const isGltf = (value: unknown): value is Gltf => isRecord(value) && Array.isArray(value.accessors) && value.accessors.every(isAccessor) &&
  Array.isArray(value.bufferViews) && value.bufferViews.every(isBufferView) && Array.isArray(value.meshes) && value.meshes.every(isMesh);

const MAGIC = 0x46546c67;

const CHUNK = { json: 0x4e4f534a, binary: 0x004e4942 } as const;

const WIDTH: Record<AccessorType, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

// Each component type's size in bytes, and how to read one.
const COMPONENTS: Record<number, { size: number; read: (view: DataView, at: number) => number }> = {
  5121: { size: 1, read: (view, at) => view.getUint8(at) },
  5123: { size: 2, read: (view, at) => view.getUint16(at, true) },
  5125: { size: 4, read: (view, at) => view.getUint32(at, true) },
  5126: { size: 4, read: (view, at) => view.getFloat32(at, true) },
};

export const parseGlb = (buffer: ArrayBuffer): GlbPart[] => {
  const view = new DataView(buffer);

  if (view.getUint32(0, true) !== MAGIC) {
    throw new Error("Not a binary glTF");
  }

  let gltf: Gltf | null = null;
  let binary: DataView | null = null;

  for (let at = 12; at < view.byteLength;) {
    const length = view.getUint32(at, true);
    const type = view.getUint32(at + 4, true);

    if (type === CHUNK.json) {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, at + 8, length)));

      gltf = isGltf(parsed) ? parsed : null;
    } else if (type === CHUNK.binary) {
      binary = new DataView(buffer, at + 8, length);
    }

    at += 8 + length;
  }

  if (!gltf || !binary || !gltf.meshes?.length) {
    throw new Error("A binary glTF with no mesh");
  }

  const data = binary;
  const { accessors, bufferViews } = gltf;
  const read = (index: number): number[] => {
    const accessor = accessors[index];
    const bufferView = bufferViews[accessor.bufferView];
    const component = COMPONENTS[accessor.componentType];
    const kind = accessor.type;

    if (!isOneOf(ACCESSOR_TYPES, kind)) {
      throw new Error(`A glTF accessor of a kind a still model does not read: ${kind}`);
    }

    const width = WIDTH[kind];
    const stride = bufferView.byteStride ?? component.size * width;
    const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const values: number[] = [];

    for (let item = 0; item < accessor.count; item += 1) {
      for (let lane = 0; lane < width; lane += 1) {
        values.push(component.read(data, start + item * stride + lane * component.size));
      }
    }

    return values;
  };
  // Added a value at a time: a big mesh has more values than a call can take as arguments.
  const append = (target: number[], values: number[]) => values.forEach((value) => target.push(value));

  return gltf.meshes.map((mesh, meshIndex) => {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let hasUvs = true;

    mesh.primitives.forEach((primitive) => {
      const base = positions.length / 3;
      const place = read(primitive.attributes.POSITION);
      const count = place.length / 3;

      append(positions, place);
      append(normals, primitive.attributes.NORMAL === undefined ? new Array<number>(count * 3).fill(0) : read(primitive.attributes.NORMAL));

      if (primitive.attributes.TEXCOORD_0 === undefined) {
        hasUvs = false;
      } else {
        append(uvs, read(primitive.attributes.TEXCOORD_0));
      }

      (primitive.indices === undefined ? Array.from({ length: count }, (_, index) => index) : read(primitive.indices))
        .forEach((index) => indices.push(index + base));
    });

    return {
      name: mesh.name ?? `mesh${meshIndex}`,
      mesh: {
        positions: Float32Array.from(positions),
        normals: Float32Array.from(normals),
        ...(hasUvs ? { uvs: Float32Array.from(uvs) } : {}),
        indices: Uint32Array.from(indices),
      },
    };
  });
};
