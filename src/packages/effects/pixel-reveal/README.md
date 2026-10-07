# effects/pixel-reveal

An image that materialises out of its own data: first as binary glyphs lit by the picture's brightness, then as a mosaic that sharpens step by step while colour comes in, then an "enhance" scanline that sweeps the full resolution picture in.

## Structure

| Path | Role |
|---|---|
| `config/` | Stage durations, glyph cell size, mosaic steps and theme, with `resolvePixelRevealConfig` |
| `domain/types.ts` | Stage and frame types; the `PixelRevealRenderer` port |
| `utils/timeline.ts` | `frameAt`: time since start to stage, progress and block size. Pure |
| `utils/luminance.ts` | Brightness per pixel and the stateless glyph flicker |
| `core/PixelRevealEngine.ts` | Extends `FrameLoop`. Plays once, reports stage changes and completion |
| `renderers/CanvasPixelRevealRenderer.ts` | Extends `CanvasRenderer`. Draws each stage from cached artwork |

## Performance

- Glyphs come from a `GlyphAtlas`, glow baked in. The binary stage is one `drawImage` per cell.
- Each mosaic step is the picture shrunk once to one pixel per block, then drawn back up with smoothing off. A frame draws it in a single call.
- The brightness grid is read once per resize, not per frame.
- The loop runs at 30 fps, only while playing, and stops itself at the end. Static mode draws the final picture and never starts it.

## Usage

```ts
import { PixelRevealEngine } from "@/packages/effects/pixel-reveal";

const engine = PixelRevealEngine.forCanvas(canvas.getContext("2d", { alpha: false })!, { image, width: 450, height: 600 }, {
  isStatic: prefersReducedMotion(),
  onDone: () => showRealImage(),
});

engine.resize({ width: 160, height: 213 }, devicePixelRatio);
engine.play();
```

A cross origin image that cannot be read back still plays, with an even brightness field for the binary stage.
