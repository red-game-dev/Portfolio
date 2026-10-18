import { writeFileSync } from "fs";

import {
  buildHandModel, buildHandSlot, createHandPoser, HAND_GRIPS, HAND_MODELS, HAND_POSES, handField, handSkeleton, handSockets, isHandModel, jointNamesOf,
  RIGHT_HAND,
} from "@/packages/graphics/hand";
import type { HandGrip } from "@/packages/graphics/hand";
import { skinDetails } from "@/packages/graphics/hand/core/details";
import { mapPlace, skinMap, skinMapArea } from "@/packages/graphics/hand/core/skinMap";
import { meshSurface } from "@/packages/graphics/sdf";
import { jointIndex, poseSkeleton, socketAt } from "@/packages/graphics/stage3d";
import { add, cross, distance, normalize, scale, sub, vec3 } from "@/packages/math/space";

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

    const vertices = skin.mesh.positions.length / 3;

    expect(skin.mesh.extras?.crease.data.every((value, index) => index % 4 !== 0 || (value >= 0 && value <= 1))).toBe(true);
    expect(skin.mesh.uvs).toHaveLength(vertices * 2);
    expect(skin.mesh.extras?.mapped.data.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(skin.material.detail && model.textures?.[skin.material.detail]).toBeTruthy();
    expect(nails.mesh.positions.length).toBeGreaterThan(0);
    expect([...(nails.mesh.skinIndices as Uint16Array)].filter((_, index) => index % 4 === 0).every((joint) => distal.has(joint))).toBe(true);
  });

  it("maps veins up the gaps between the metacarpals and across the back of the hand, none past the knuckles, and hair thinning towards them", () => {
    const area = skinMapArea(RIGHT_HAND);
    const map = skinMap(RIGHT_HAND);
    const texelAt = (x: number, y: number) => {
      const [u, v] = mapPlace(area, x, y);
      const at = (Math.floor(v * map.height) * map.width + Math.floor(u * map.width)) * 4;

      return { raise: map.data[at], blue: map.data[at + 1], hair: map.data[at + 2] };
    };
    const { index, middle } = RIGHT_HAND.fingers;
    // Up the gap between the index and middle metacarpals, and over the middle metacarpal beside it.
    const halfway = (a: number, b: number, c: number, d: number) => (a + b + c + d) / 4;
    const inGap = texelAt(
      halfway(index.base.x, middle.base.x, index.knuckle.x, middle.knuckle.x),
      halfway(index.base.y, middle.base.y, index.knuckle.y, middle.knuckle.y),
    );
    const overBone = texelAt((middle.base.x + middle.knuckle.x) / 2 + 3, (middle.base.y + middle.knuckle.y) / 2);

    expect(map.data).toHaveLength(map.width * map.height * 4);
    expect(inGap.raise).toBeGreaterThan(80);
    expect(inGap.blue).toBeGreaterThan(50);
    expect(overBone.raise).toBeLessThan(40);
    expect(texelAt(middle.knuckle.x, middle.knuckle.y + 4).raise).toBe(0);
    expect(texelAt(0, -60).hair).toBeGreaterThan(texelAt(0, middle.knuckle.y - 4).hair * 3);
  });

  it("wrinkles the back of a joint held straight, and smooths it as the joint bends and the skin stretches", () => {
    const depthOver = (turns: ReturnType<typeof poser.turnsOf>) => {
      const posed = handField(RIGHT_HAND, turns);
      const frame = posed.frames.index;
      const back = normalize(add(frame.backs[1], frame.backs[2]));
      const point = add(frame.joints[2], scale(back, frame.radii[2] - 0.3));

      return skinDetails(new Float32Array([point.x, point.y, point.z]), new Float32Array([back.x, back.y, back.z]), posed, skinMapArea(RIGHT_HAND)).creases;
    };
    const straight = depthOver(poser.turnsOf(HAND_POSES.point));
    const bent = depthOver(poser.turnsOf(HAND_POSES.card));

    expect(straight[3]).toBe(1);
    expect(straight[0]).toBeGreaterThan(0.6);
    expect(bent[0]).toBeLessThan(straight[0] * 0.5);
  });

  it("knows how far its flesh reaches in a pose, so what it holds can keep it clear of a surface", () => {
    const posed = handField(RIGHT_HAND, poser.turnsOf(HAND_POSES.card));
    const mesh = meshSurface(posed.evaluate, posed, 3);

    [vec3(1, 0, 0), vec3(-1, 0, 0), vec3(0, 1, 0), vec3(0, -1, 0), vec3(0, 0, 1), vec3(0, 0, -1), normalize(vec3(1, 1, -1)), normalize(vec3(-1, 0.5, 1))]
      .forEach((direction) => {
        let furthest = Number.NEGATIVE_INFINITY;

        for (let vertex = 0; vertex < mesh.positions.length; vertex += 3) {
          furthest = Math.max(furthest, mesh.positions[vertex] * direction.x + mesh.positions[vertex + 1] * direction.y + mesh.positions[vertex + 2] * direction.z);
        }

        expect(posed.reach(direction)).toBeGreaterThan(furthest - 0.5);
        expect(posed.reach(direction)).toBeLessThan(furthest + 4);
      });
  });

  // A grip's thing sampled through its whole volume against the hand in the grip's pose: how much of the hand is
  // inside it, how near the thumb comes to it (on its face, or against its edge as a phone held from the bottom has it)
  // and the nearest finger to its back.
  const heldBy = (grip: HandGrip) => {
    const held = handField(RIGHT_HAND, poser.turnsOf(grip.pose));
    const { width, height, thickness } = grip.size;
    const towardsBack = scale(grip.face, -1);
    const across = normalize(cross(grip.along, towardsBack));
    const layers = thickness > 3 ? [-0.5, -0.25, 0, 0.25, 0.5] : [0];
    const limit = thickness > 3 ? 0 : thickness / 2;
    const groups = new Float64Array(held.groups.length);
    const thumb = held.groups.findIndex((group) => group.name === "thumb");
    const fingers = held.groups.flatMap((group, index) => (["palm", "index", "middle", "ring", "pinky"].includes(group.name) ? [index] : []));
    let inside = 0;
    let thumbFront = Number.POSITIVE_INFINITY;
    let thumbBack = Number.POSITIVE_INFINITY;
    let fingerGap = Number.POSITIVE_INFINITY;

    for (let a = -width / 2; a <= width / 2; a += 1.5) {
      for (let b = -height / 2; b <= height / 2; b += 1.5) {
        const middle = add(grip.centre, add(scale(grip.along, a), scale(across, b)));

        layers.forEach((layer) => {
          const point = add(middle, scale(towardsBack, layer * thickness));

          inside += held.evaluate(point.x, point.y, point.z) < limit ? 1 : 0;
        });

        const front = sub(middle, scale(towardsBack, thickness / 2));
        const back = add(middle, scale(towardsBack, thickness / 2));

        held.groupDistances(front.x, front.y, front.z, groups);
        thumbFront = Math.min(thumbFront, groups[thumb]);
        held.groupDistances(back.x, back.y, back.z, groups);
        thumbBack = Math.min(thumbBack, groups[thumb]);
        fingers.forEach((finger) => {
          fingerGap = Math.min(fingerGap, groups[finger]);
        });
      }
    }

    return { inside, thumbGap: Math.min(thumbFront, thumbBack), thumbFront, thumbBack, fingerGap };
  };

  it("holds a card and a phone with no flesh inside them, the thumb against them and a finger on the back", () => {
    Object.values(HAND_GRIPS).forEach((grip) => {
      const { inside, thumbGap, fingerGap } = heldBy(grip);

      expect(inside).toBe(0);
      expect(thumbGap).toBeLessThan(1.5);
      expect(fingerGap).toBeLessThan(1.6);
    });
  });

  it("holds a phone with the thumb on its screen, where it shows, and never round its back", () => {
    const { thumbFront, thumbBack } = heldBy(HAND_GRIPS.phone);

    expect(thumbFront).toBeLessThan(1);
    expect(thumbBack).toBeGreaterThan(4);
  });

  it("presses keys with the index fingertip's pad", () => {
    const sockets = handSockets(RIGHT_HAND, skeleton);
    const point = poseSkeleton(skeleton, poser.turnsOf(HAND_POSES.point));

    expect(distance(socketAt(point, sockets["index-pad"]).position, point.positions[jointIndex(skeleton, "index-finger-tip")])).toBeLessThan(8);
  });

  it("knows its slots, and builds nothing for a slot it does not have", () => {
    Object.values(HAND_MODELS).forEach((model) => expect(isHandModel(model)).toBe(true));
    expect(isHandModel("hand.left.wave")).toBe(false);
    expect(() => buildHandSlot("hand.left.wave")).toThrow("No hand slot");
  });
});
