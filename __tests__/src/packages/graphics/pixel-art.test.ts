import { spriteSize, toPixelPaths } from "@/packages/graphics/pixel-art";

describe("graphics/pixel-art", () => {
  test("merges runs on a row and groups pixels by colour", () => {
    const paths = toPixelPaths(["aab.", ".bb."], { a: "#f00", b: "#00f" });

    expect(paths).toEqual([
      { color: "#f00", d: "M0 0h2v1h-2z" },
      { color: "#00f", d: "M2 0h1v1h-1zM1 1h2v1h-2z" },
    ]);
  });

  test("keys without a colour are transparent", () => {
    expect(toPixelPaths(["...."], { a: "#f00" })).toEqual([]);
  });

  test("two keys sharing a colour share a path", () => {
    expect(toPixelPaths(["ab"], { a: "#fff", b: "#fff" })).toEqual([{ color: "#fff", d: "M0 0h1v1h-1zM1 0h1v1h-1z" }]);
  });

  test("size is the widest row by the number of rows", () => {
    expect(spriteSize(["abc", "a"])).toEqual({ width: 3, height: 2 });
  });
});
