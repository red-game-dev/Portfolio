import { resolvePixelRevealConfig } from "@/packages/effects/pixel-reveal";
import { RasterPixelRevealRenderer } from "@/packages/effects/pixel-reveal-raster";

describe("effects/pixel-reveal-raster RasterPixelRevealRenderer", () => {
  // An 8 by 8 picture: red on the left half, blue on the right.
  const width = 8;
  const picture = Uint8Array.from({ length: width * width * 3 }, (_, index) => {
    const pixel = Math.floor(index / 3);
    const isLeft = pixel % width < width / 2;

    return index % 3 === 0 ? (isLeft ? 240 : 0) : index % 3 === 2 ? (isLeft ? 0 : 240) : 0;
  });
  const source = { width, height: width, pixels: picture };
  const raster = resolvePixelRevealConfig({ binaryCell: 8, blockSizes: [4, 2], theme: { background: "#101010", signal: "#4bffa5", spark: "#eafff3" } });
  const pixelAt = (renderer: RasterPixelRevealRenderer, x: number, y: number) => Array.from(renderer.pixels.subarray((y * width + x) * 3, (y * width + x) * 3 + 3));

  test("draws the finished picture exactly once the reveal is done", () => {
    const renderer = new RasterPixelRevealRenderer(source, raster);

    renderer.draw({ stage: "done", progress: 1, blockSize: 1 }, 0);

    expect(Array.from(renderer.pixels)).toEqual(Array.from(picture));
  });

  test("draws the binary stage in the signal's colour over the background, none of the picture's own colours yet", () => {
    const renderer = new RasterPixelRevealRenderer(source, raster);

    renderer.draw({ stage: "binary", progress: 0.1, blockSize: 4 }, 0);

    const colours: number[][] = Array.from({ length: width * width }, (_, pixel) => pixelAt(renderer, pixel % width, Math.floor(pixel / width)));

    expect(colours.some(([red, green]) => green > 16 && red < green)).toBe(true);
    expect(colours.every(([red, green, blue]) => red <= green && blue <= green)).toBe(true);
  });

  test("draws the mosaic as blocks, each the average of the picture under it", () => {
    const renderer = new RasterPixelRevealRenderer({ width, height: width, pixels: picture.map((value, index) => (index === 0 ? 0 : value)) }, raster);

    renderer.draw({ stage: "pixels", progress: 1, blockSize: 4 }, 0);

    // The top left block lost one bright pixel of sixteen, so it is a little darker, and the whole block alike.
    expect(pixelAt(renderer, 0, 0)).toEqual([225, 0, 0]);
    expect(pixelAt(renderer, 3, 3)).toEqual([225, 0, 0]);
    expect(pixelAt(renderer, 5, 2)).toEqual([0, 0, 240]);
  });

  test("enhances from the top: the full picture above the scanline, the line itself lit", () => {
    const renderer = new RasterPixelRevealRenderer(source, raster);

    renderer.draw({ stage: "enhance", progress: 0.5, blockSize: 2 }, 0);

    expect(pixelAt(renderer, 6, 0)).toEqual([0, 0, 240]);
    expect(pixelAt(renderer, 0, 4)[1]).toBeGreaterThan(200);
  });

  test("draws at any size it is given, sampling the picture", () => {
    const renderer = new RasterPixelRevealRenderer(source, raster);

    renderer.resize({ width: 4, height: 4 });
    renderer.draw({ stage: "done", progress: 1, blockSize: 1 }, 0);

    expect(renderer.pixels).toHaveLength(4 * 4 * 3);
    expect(Array.from(renderer.pixels.subarray(0, 3))).toEqual([240, 0, 0]);
    expect(Array.from(renderer.pixels.subarray(3 * 3, 3 * 3 + 3))).toEqual([0, 0, 240]);
  });
});
