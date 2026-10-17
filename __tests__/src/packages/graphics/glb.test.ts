/**
 * @jest-environment node
 */
// Node, for the TextEncoder and TextDecoder a browser has and jsdom lacks.
import { GlbModelSource, parseGlb } from "@/packages/graphics/stage3d";

// A one triangle binary glTF, built here: three corners, their normals and picture places, and its indices.
const triangleGlb = (): ArrayBuffer => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1]);
  const indices = new Uint16Array([0, 1, 2, 0]);
  const binary = new Uint8Array(positions.byteLength + normals.byteLength + uvs.byteLength + indices.byteLength);
  let offset = 0;
  const views = [positions, normals, uvs, indices].map((array) => {
    binary.set(new Uint8Array(array.buffer), offset);
    const view = { buffer: 0, byteOffset: offset, byteLength: array.byteLength };

    offset += array.byteLength;

    return view;
  });
  const json = {
    asset: { version: "2.0" },
    buffers: [{ byteLength: binary.byteLength }],
    bufferViews: views,
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
      { bufferView: 1, componentType: 5126, count: 3, type: "VEC3" },
      { bufferView: 2, componentType: 5126, count: 3, type: "VEC2" },
      { bufferView: 3, componentType: 5123, count: 3, type: "SCALAR" },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3 }] }],
  };
  let text = new TextEncoder().encode(JSON.stringify(json));

  if (text.length % 4) {
    text = new Uint8Array([...text, ...new Array<number>(4 - (text.length % 4)).fill(32)]);
  }

  const total = 12 + 8 + text.length + 8 + binary.length;
  const out = new ArrayBuffer(total);
  const view = new DataView(out);

  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, text.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(out, 20, text.length).set(text);
  view.setUint32(20 + text.length, binary.length, true);
  view.setUint32(24 + text.length, 0x004e4942, true);
  new Uint8Array(out, 28 + text.length, binary.length).set(binary);

  return out;
};

describe("a binary glTF", () => {
  it("reads its mesh: places, normals, picture places and indices", () => {
    const mesh = parseGlb(triangleGlb());

    expect(Array.from(mesh.positions)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(Array.from(mesh.normals.slice(0, 3))).toEqual([0, 0, 1]);
    expect(Array.from(mesh.uvs ?? [])).toEqual([0, 0, 1, 0, 0, 1]);
    expect(Array.from(mesh.indices)).toEqual([0, 1, 2]);
    expect(() => parseGlb(new ArrayBuffer(16))).toThrow("Not a binary glTF");
  });

  it("is fetched as a model when a scene asks for it, scaled into the scene's units and drawn in its material", async () => {
    const source = new GlbModelSource(
      { "thing.scan": { url: "/thing.glb", scale: 10, name: "skin", material: { kind: "skin", image: "/thing.jpg" } } },
      () => Promise.resolve(triangleGlb()),
    );
    const asset = await source.load("thing.scan");

    expect(asset.parts[0].name).toBe("skin");
    expect(asset.parts[0].material.image).toBe("/thing.jpg");
    expect(Array.from(asset.parts[0].mesh.positions)).toEqual([0, 0, 0, 10, 0, 0, 0, 10, 0]);
    await expect(source.load("other")).rejects.toThrow("No model file");
  });
});
