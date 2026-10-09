import { hexToRgb, hexWithAlpha, hslToHex, mixRgb, rgba, rgbChannels, rgbCss, rgbToHex, scaleRgb, shadeHex } from "@/packages/graphics/colour";

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

  it("lights a colour, as RGB or as CSS with or without alpha", () => {
    expect(scaleRgb([200, 100, 50], 0.5)).toEqual([100, 50, 25]);
    expect(rgbCss([1, 2, 3])).toBe("rgb(1, 2, 3)");
    expect(shadeHex("#ffffff", 0.5)).toBe("rgb(128, 128, 128)");
    expect(shadeHex("#ffffff", 1, 0.5)).toBe("rgba(255, 255, 255, 0.500)");
  });

  it("writes hex, with channels rounded and held within a byte, and an alpha byte on the end", () => {
    expect(rgbToHex([75, 255, 165])).toBe("#4bffa5");
    expect(rgbToHex([-4, 255.4, 300])).toBe("#00ffff");
    expect(hexWithAlpha("#4bffa5", 0.5)).toBe("#4bffa580");
    expect(hexWithAlpha("#4bffa5", 0)).toBe("#4bffa500");
    expect(hexWithAlpha("#4bffa5", 1)).toBe("#4bffa5ff");
    expect(hslToHex(120, 1, 0.5)).toBe("#00ff00");
    expect(hslToHex(-120, 1, 0.5)).toBe("#0000ff");
  });
});
