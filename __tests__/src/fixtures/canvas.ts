/* eslint-disable max-classes-per-file -- the canvas, its contexts and a gradient are one family of doubles, kept together */
// Typed stand ins for the 2D canvas jsdom does not have. Every drawing call is accepted, noted by name and dropped, so a
// test reads what was drawn, or overrides only the calls it watches (Object.assign onto an instance) and the rest stays
// the real type. What no test reads back (pixels, the transform as a matrix, bitmaps) throws, so one that comes to need
// it says so.

const notInTheFake = (what: string): never => {
  throw new Error(`The test canvas has no ${what}.`);
};

export class FakeGradient implements CanvasGradient {
  public addColorStop(): void {
    return undefined;
  }
}

// Wide enough to lay text out: six pixels a character, nothing above or below the line.
const metricsOf = (text: string): TextMetrics => ({
  actualBoundingBoxAscent: 0,
  actualBoundingBoxDescent: 0,
  actualBoundingBoxLeft: 0,
  actualBoundingBoxRight: text.length * 6,
  alphabeticBaseline: 0,
  emHeightAscent: 0,
  emHeightDescent: 0,
  fontBoundingBoxAscent: 0,
  fontBoundingBoxDescent: 0,
  hangingBaseline: 0,
  ideographicBaseline: 0,
  width: text.length * 6,
});

// What the screen's and the offscreen context share: the styles as plain fields, the calls as no-ops.
class FakeDrawing {
  public globalAlpha = 1;
  public globalCompositeOperation: GlobalCompositeOperation = "source-over";
  public fillStyle: string | CanvasGradient | CanvasPattern = "#000000";
  public strokeStyle: string | CanvasGradient | CanvasPattern = "#000000";
  public filter = "none";
  public imageSmoothingEnabled = true;
  public imageSmoothingQuality: ImageSmoothingQuality = "low";
  public lineCap: CanvasLineCap = "butt";
  public lineDashOffset = 0;
  public lineJoin: CanvasLineJoin = "miter";
  public lineWidth = 1;
  public miterLimit = 10;
  public shadowBlur = 0;
  public shadowColor = "rgba(0, 0, 0, 0)";
  public shadowOffsetX = 0;
  public shadowOffsetY = 0;
  public direction: CanvasDirection = "inherit";
  public font = "10px sans-serif";
  public fontKerning: CanvasFontKerning = "auto";
  public fontStretch: CanvasFontStretch = "normal";
  public fontVariantCaps: CanvasFontVariantCaps = "normal";
  public letterSpacing = "0px";
  public textAlign: CanvasTextAlign = "start";
  public textBaseline: CanvasTextBaseline = "alphabetic";
  public textRendering: CanvasTextRendering = "auto";
  public wordSpacing = "0px";
  // Every drawing call by name, in order, for a test that watches what was drawn.
  public readonly calls: string[] = [];
  private dash: number[] = [];

  public drawImage(): void {
    this.calls.push("drawImage");
  }

  public beginPath(): void {
    this.calls.push("beginPath");
  }

  public clip(): void {
    this.calls.push("clip");
  }

  public fill(): void {
    this.calls.push("fill");
  }

  public isPointInPath(): boolean {
    this.calls.push("isPointInPath");

    return false;
  }

  public isPointInStroke(): boolean {
    this.calls.push("isPointInStroke");

    return false;
  }

  public stroke(): void {
    this.calls.push("stroke");
  }

  public createConicGradient(): CanvasGradient {
    this.calls.push("createConicGradient");

    return new FakeGradient();
  }

  public createLinearGradient(): CanvasGradient {
    this.calls.push("createLinearGradient");

    return new FakeGradient();
  }

  public createPattern(): CanvasPattern | null {
    this.calls.push("createPattern");

    return null;
  }

  public createRadialGradient(): CanvasGradient {
    this.calls.push("createRadialGradient");

    return new FakeGradient();
  }

  public createImageData(): ImageData {
    this.calls.push("createImageData");

    return notInTheFake("pixels");
  }

  public getImageData(): ImageData {
    this.calls.push("getImageData");

    return notInTheFake("pixels");
  }

  public putImageData(): void {
    this.calls.push("putImageData");
  }

  public arc(): void {
    this.calls.push("arc");
  }

  public arcTo(): void {
    this.calls.push("arcTo");
  }

  public bezierCurveTo(): void {
    this.calls.push("bezierCurveTo");
  }

  public closePath(): void {
    this.calls.push("closePath");
  }

  public ellipse(): void {
    this.calls.push("ellipse");
  }

  public lineTo(): void {
    this.calls.push("lineTo");
  }

  public moveTo(): void {
    this.calls.push("moveTo");
  }

  public quadraticCurveTo(): void {
    this.calls.push("quadraticCurveTo");
  }

  public rect(): void {
    this.calls.push("rect");
  }

  public roundRect(): void {
    this.calls.push("roundRect");
  }

  public getLineDash(): number[] {
    this.calls.push("getLineDash");

    return [...this.dash];
  }

  public setLineDash(segments: number[]): void {
    this.calls.push("setLineDash");
    this.dash = [...segments];
  }

  public clearRect(): void {
    this.calls.push("clearRect");
  }

  public fillRect(): void {
    this.calls.push("fillRect");
  }

  public strokeRect(): void {
    this.calls.push("strokeRect");
  }

  public isContextLost(): boolean {
    this.calls.push("isContextLost");

    return false;
  }

  public reset(): void {
    this.calls.push("reset");
  }

  public restore(): void {
    this.calls.push("restore");
  }

  public save(): void {
    this.calls.push("save");
  }

  public fillText(): void {
    this.calls.push("fillText");
  }

  public measureText(text: string): TextMetrics {
    this.calls.push("measureText");

    return metricsOf(text);
  }

  public strokeText(): void {
    this.calls.push("strokeText");
  }

  public getTransform(): DOMMatrix {
    this.calls.push("getTransform");

    return notInTheFake("transform matrix");
  }

  public resetTransform(): void {
    this.calls.push("resetTransform");
  }

  public rotate(): void {
    this.calls.push("rotate");
  }

  public scale(): void {
    this.calls.push("scale");
  }

  public setTransform(): void {
    this.calls.push("setTransform");
  }

  public transform(): void {
    this.calls.push("transform");
  }

  public translate(): void {
    this.calls.push("translate");
  }
}

// The screen's context, on a real (jsdom) canvas element, so its width and height are a canvas's.
export class FakeContext2D extends FakeDrawing implements CanvasRenderingContext2D {
  public readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement = document.createElement("canvas")) {
    super();
    this.canvas = canvas;
  }

  public getContextAttributes(): CanvasRenderingContext2DSettings {
    return {};
  }

  public drawFocusIfNeeded(): void {
    return undefined;
  }
}

// An offscreen canvas of a size, handing out one offscreen context.
export class FakeOffscreenCanvas extends EventTarget implements OffscreenCanvas {
  public width: number;
  public height: number;
  public oncontextlost: ((this: OffscreenCanvas, event: Event) => unknown) | null = null;
  public oncontextrestored: ((this: OffscreenCanvas, event: Event) => unknown) | null = null;
  public readonly context: FakeOffscreenContext2D;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
    this.context = new FakeOffscreenContext2D(this);
  }

  public convertToBlob(): Promise<Blob> {
    return Promise.resolve(new Blob());
  }

  public getContext(contextId: "2d", options?: unknown): OffscreenCanvasRenderingContext2D | null;
  public getContext(contextId: "bitmaprenderer", options?: unknown): ImageBitmapRenderingContext | null;
  public getContext(contextId: "webgl", options?: unknown): WebGLRenderingContext | null;
  public getContext(contextId: "webgl2", options?: unknown): WebGL2RenderingContext | null;
  public getContext(contextId: OffscreenRenderingContextId, options?: unknown): OffscreenRenderingContext | null;
  public getContext(contextId: OffscreenRenderingContextId): OffscreenRenderingContext | null {
    return contextId === "2d" ? this.context : null;
  }

  public transferToImageBitmap(): ImageBitmap {
    return notInTheFake("bitmap");
  }
}

export class FakeOffscreenContext2D extends FakeDrawing implements OffscreenCanvasRenderingContext2D {
  public readonly canvas: OffscreenCanvas;

  constructor(canvas: OffscreenCanvas) {
    super();
    this.canvas = canvas;
  }
}

// A drawable surface for a sprite cache or a rig, as the rig's createSurface hands one out.
export const fakeSurface = (width: number, height: number) => {
  const surface = new FakeOffscreenCanvas(width, height);

  return { surface, context: surface.context };
};
