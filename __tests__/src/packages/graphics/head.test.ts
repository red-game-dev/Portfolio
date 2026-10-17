import { ADULT_HEAD, buildHeadModel, buildHeadSlot, HEAD_MODELS, headField, isHeadModel } from "@/packages/graphics/head";

const field = headField();

describe("graphics/head", () => {
  it("is solid inside the skull and the neck, and empty well away from the head", () => {
    expect(field.skin(0, 140, -20)).toBeLessThan(0);
    expect(field.skin(0, -40, -20)).toBeLessThan(0);
    expect(field.skin(0, 140, 140)).toBeGreaterThan(0);
    expect(field.skin(200, 100, 0)).toBeGreaterThan(0);
  });

  it("brings the nose furthest forward, sets each eye back under its brow and lids, and keeps the mouth a line", () => {
    const { nose, eyes, mouth, brow } = ADULT_HEAD;
    const frontAt = (x: number, y: number) => {
      let z = 140;

      while (z > -50 && field.skin(x, y, z) > 0) {
        z -= 0.5;
      }

      return z;
    };

    expect(frontAt(0, nose.base + 8)).toBeGreaterThan(frontAt(0, brow));
    expect(frontAt(0, nose.base + 8)).toBeGreaterThan(frontAt(0, mouth.y + 4));
    // The eye's front sits behind the brow's, its upper lid over its top.
    expect(field.eyes[0].z + field.eyeRadius).toBeLessThan(frontAt(eyes.apart, brow));
    expect(field.skin(eyes.apart, eyes.y + field.eyeRadius * 0.7, field.eyes[0].z + field.eyeRadius * 0.75)).toBeLessThan(0);
    // The mouth's line is a hollow between the lips.
    expect(field.skin(0, mouth.y, frontAt(0, mouth.y + 4) - 0.5)).toBeGreaterThan(field.skin(0, mouth.y + 4, frontAt(0, mouth.y + 4) - 0.5));
  });

  it("keeps the hair on the skull above the hairline, outside the skin", () => {
    expect(field.hair(0, 222, 10)).toBeLessThan(0);
    expect(field.hair(0, 120, 70)).toBeGreaterThan(0);
    expect(field.hair(0, 140, -20)).toBeGreaterThan(0);
  });

  it("builds a head of skin coloured redder at the lips, hair, and eyes looking forward", () => {
    const model = buildHeadModel("test", ADULT_HEAD, { spacing: 4 });
    const [skin, hair, eyes] = model.parts;
    const colors = skin.mesh.colors as Float32Array;
    let lipRed = 0;
    let lipVertices = 0;

    for (let vertex = 0; vertex < skin.mesh.positions.length; vertex += 3) {
      const [x, y, z] = [skin.mesh.positions[vertex], skin.mesh.positions[vertex + 1], skin.mesh.positions[vertex + 2]];

      if (field.lips(x, y, z) < 0.5) {
        lipRed += colors[vertex] - colors[vertex + 1];
        lipVertices += 1;
      }
    }

    expect(model.parts.map((part) => part.name)).toEqual(["skin", "hair", "eyes"]);
    expect(skin.mesh.positions.length).toBeGreaterThan(3000);
    expect(hair.mesh.positions.length).toBeGreaterThan(1000);
    expect(lipVertices).toBeGreaterThan(0);
    expect(lipRed / lipVertices).toBeGreaterThan(0.1);
    // The darkest of the eyes' colours, the pupils, look forward.
    const eyeColors = eyes.mesh.colors as Float32Array;
    const darkest = Array.from({ length: eyeColors.length / 3 }, (_, vertex) => vertex).sort((one, two) => eyeColors[one * 3] - eyeColors[two * 3])[0];

    expect(eyes.mesh.normals[darkest * 3 + 2]).toBeGreaterThan(0.9);
  });

  it("knows its slot, and builds nothing for a slot it does not have", () => {
    expect(isHeadModel(HEAD_MODELS.customer)).toBe(true);
    expect(isHeadModel("head.cashier")).toBe(false);
    expect(() => buildHeadSlot("head.cashier")).toThrow("No head slot");
  });
});
