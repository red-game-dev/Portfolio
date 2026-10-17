import { writeFileSync } from "fs";

import {
  buildHandModel, buildHandSlot, createHandPoser, HAND_MODELS, HAND_POSES, handField, handSkeleton, handSockets, isHandModel, jointNamesOf, RIGHT_HAND,
} from "@/packages/graphics/hand";
import { meshSurface } from "@/packages/graphics/hand/core/mesher";
import { jointIndex, poseSkeleton, socketAt } from "@/packages/graphics/stage3d";
import { distance } from "@/packages/math/space";

const skeleton = handSkeleton(RIGHT_HAND);
const poser = createHandPoser(RIGHT_HAND, skeleton);
const field = handField(RIGHT_HAND);

describe("graphics/hand", () => {
  it("names its joints as the WebXR hand standard does, the wrist first", () => {
    expect(skeleton.joints).toHaveLength(25);
    expect(skeleton.joints[0].name).toBe("wrist");
    expect(jointNamesOf("thumb")).toEqual(["thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"]);
    skeleton.joints.forEach((joint, index) => expect(joint.parent).toBeLessThan(index));
  });

  it("is solid where the bones are and empty well away from the hand", () => {
    expect(field.evaluate(0, 50, -2)).toBeLessThan(0);
    field.frames.index.joints.slice(1, 4).forEach(({ x, y, z }) => expect(field.evaluate(x, y, z)).toBeLessThan(0));
    expect(field.evaluate(0, 50, 60)).toBeGreaterThan(0);
    expect(field.evaluate(-150, 0, 0)).toBeGreaterThan(0);
  });

  it("poses: pointing curls the other fingers towards the palm and keeps the flesh on the posed bones", () => {
    const turns = poser.turnsOf(HAND_POSES.point);
    const posed = poseSkeleton(skeleton, turns);
    const middleTip = jointIndex(skeleton, "middle-finger-tip");
    const indexTip = jointIndex(skeleton, "index-finger-tip");
    const posedField = handField(RIGHT_HAND, turns);
    const middleJoint = posed.positions[jointIndex(skeleton, "middle-finger-phalanx-intermediate")];

    expect(posed.positions[middleTip].z).toBeLessThan(skeleton.joints[middleTip].position.z - 20);
    // The pointing finger only relaxes a little.
    expect(distance(posed.positions[indexTip], skeleton.joints[indexTip].position)).toBeLessThan(14);
    expect(posedField.evaluate(middleJoint.x, middleJoint.y, middleJoint.z)).toBeLessThan(0);
  });

  it("meshes into a surface every vertex of which lies on the shape", () => {
    const mesh = meshSurface(field.evaluate, field, 3);

    expect(mesh.indices.length % 3).toBe(0);
    expect(mesh.positions.length / 3).toBeGreaterThan(800);

    for (let vertex = 0; vertex < mesh.positions.length; vertex += 3 * 53) {
      expect(Math.abs(field.evaluate(mesh.positions[vertex], mesh.positions[vertex + 1], mesh.positions[vertex + 2]))).toBeLessThan(0.4);
    }

    // Written for a look in a browser when asked: HAND_PREVIEW=<file> npx jest hand.test
    if (process.env.HAND_PREVIEW) {
      const encode = (array: Float32Array | Uint32Array) => Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString("base64");

      writeFileSync(process.env.HAND_PREVIEW, JSON.stringify({ positions: encode(mesh.positions), normals: encode(mesh.normals), indices: encode(mesh.indices) }));
    }
  });

  it("builds a model in a pose: skin rigged to real joints, creases and colour per vertex, a nail on each digit", () => {
    const model = buildHandModel("test", RIGHT_HAND, { spacing: 3.5, pose: HAND_POSES.card });
    const [skin, nails] = model.parts;
    const weights = skin.mesh.skinWeights as Float32Array;
    const joints = skin.mesh.skinIndices as Uint16Array;
    const distal = new Set(["thumb", "index", "middle", "ring", "pinky"].map((digit) => {
      const names = jointNamesOf(digit as "thumb");

      return jointIndex(skeleton, names[names.length - 2]);
    }));

    expect(model.bindTurns?.some((turn) => turn !== undefined)).toBe(true);

    for (let vertex = 0; vertex < weights.length; vertex += 4 * 31) {
      expect(weights[vertex] + weights[vertex + 1] + weights[vertex + 2] + weights[vertex + 3]).toBeCloseTo(1, 4);
      expect(joints[vertex]).toBeLessThan(25);
    }

    expect(skin.mesh.extras?.crease.data.every((value, index) => index % 3 !== 0 || (value >= 0 && value <= 1))).toBe(true);
    expect(nails.mesh.positions.length).toBeGreaterThan(0);
    expect([...(nails.mesh.skinIndices as Uint16Array)].filter((_, index) => index % 4 === 0).every((joint) => distal.has(joint))).toBe(true);
  });

  it("holds things by the index fingertip's pad and the thumb's, which pinch a card's thickness apart", () => {
    const sockets = handSockets(RIGHT_HAND, skeleton);
    const card = poseSkeleton(skeleton, poser.turnsOf(HAND_POSES.card));
    const point = poseSkeleton(skeleton, poser.turnsOf(HAND_POSES.point));
    const gap = distance(socketAt(card, sockets["thumb-pad"]).position, socketAt(card, sockets["index-pad"]).position);

    expect(gap).toBeGreaterThan(6);
    expect(gap).toBeLessThan(14);
    expect(distance(socketAt(point, sockets["index-pad"]).position, point.positions[jointIndex(skeleton, "index-finger-tip")])).toBeLessThan(8);
  });

  it("knows its slots, and builds nothing for a slot it does not have", () => {
    Object.values(HAND_MODELS).forEach((model) => expect(isHandModel(model)).toBe(true));
    expect(isHandModel("hand.left.wave")).toBe(false);
    expect(() => buildHandSlot("hand.left.wave")).toThrow("No hand slot");
  });
});
