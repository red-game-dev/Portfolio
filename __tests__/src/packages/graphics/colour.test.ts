import { hexToRgb, mixRgb, rgba, rgbChannels } from "@/packages/graphics/colour";

describe("colour", () => {
  it("reads six and three digit hex", () => {
    expect(hexToRgb("#4bffa5")).toEqual([75, 255, 165]);
    expect(hexToRgb("fff")).toEqual([255, 255, 255]);
    expect(rgbChannels("#ffc45c")).toBe("255, 196, 92");
  });

  it("mixes and formats", () => {
    expect(mixRgb([0, 0, 0], [255, 100, 50], 0.5)).toEqual([128, 50, 25]);
    expect(rgba([1, 2, 3], 0.5)).toBe("rgba(1, 2, 3, 0.500)");
  });
});
