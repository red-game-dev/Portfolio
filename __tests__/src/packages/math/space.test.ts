import { conjugate, cross, fromAxisAngle, fromBasis, IDENTITY, multiply, normalize, rotate, slerp, vec3 } from "@/packages/math/space";

const close = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => {
  expect(a.x).toBeCloseTo(b.x, 5);
  expect(a.y).toBeCloseTo(b.y, 5);
  expect(a.z).toBeCloseTo(b.z, 5);
};

describe("math/space", () => {
  it("turns a vector about an axis, right handed, and back again", () => {
    const quarter = fromAxisAngle(vec3(0, 0, 1), Math.PI / 2);

    close(rotate(quarter, vec3(1, 0, 0)), vec3(0, 1, 0));
    close(rotate(conjugate(quarter), rotate(quarter, vec3(0.3, -2, 5))), vec3(0.3, -2, 5));
  });

  it("chains turns, the right one first", () => {
    const aboutZ = fromAxisAngle(vec3(0, 0, 1), Math.PI / 2);
    const aboutX = fromAxisAngle(vec3(1, 0, 0), Math.PI / 2);

    // x turned about z goes to y, then about x to z.
    close(rotate(multiply(aboutX, aboutZ), vec3(1, 0, 0)), vec3(0, 0, 1));
  });

  it("builds the turn that takes the axes to a basis", () => {
    const x = normalize(vec3(1, 1, 0));
    const y = normalize(vec3(-1, 1, 0));
    const z = cross(x, y);
    const turn = fromBasis(x, y, z);

    close(rotate(turn, vec3(1, 0, 0)), x);
    close(rotate(turn, vec3(0, 1, 0)), y);
    close(rotate(fromBasis(vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)), vec3(2, 3, 4)), vec3(2, 3, 4));
  });

  it("slerps from one turn to the other", () => {
    const half = fromAxisAngle(vec3(0, 1, 0), Math.PI);

    expect(slerp(IDENTITY, half, 0)).toEqual(IDENTITY);
    close(rotate(slerp(IDENTITY, half, 0.5), vec3(1, 0, 0)), vec3(0, 0, -1));
  });
});
