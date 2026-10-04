# effects/binary-rain

Falling streams of `0` and `1` that assemble a short message, in the style of film "digital rain".

## Structure

| Path | Role |
|---|---|
| `config/` | `RainConfig` defaults (rates, speeds, glow radii, theme) and `resolveRainConfig` for host overrides |
| `domain/types.ts` | Grid, stream, column, message cell and state types; the `RainRenderer` and `GlyphSource` ports |
| `core/RainSimulation.ts` | State machine: streams fall, glyphs flicker, letters lock. No DOM and no clock of its own |
| `core/BinaryRainEngine.ts` | Extends `FrameLoop`. Wires a simulation to a renderer and owns resize, decode and still frames |
| `renderers/CanvasRainRenderer.ts` | Extends `CanvasRenderer`. Draws through a `GlyphAtlas` |
| `sources/` | `CharacterGlyphSource` for any character set, `BinaryGlyphSource` for `0` and `1` |
| `utils/` | Grid sizing, message layout, state queries |

Every collaborator is injected: renderer, glyph source, random source and scheduler. A seeded random and a `ManualScheduler` replay a run exactly, which is how the tests work.

## Performance

- Glyphs are rasterised once per glyph and style into an atlas at device resolution, glow included. A frame is only `drawImage` calls, with no text shaping and no shadow blur.
- The trail fades through `globalAlpha` on one sprite per glyph, so the atlas stays small.
- Draw positions are whole CSS pixels on an integer cell grid, so sprites land on device pixels without resampling.
- Locked cells live in a `Uint8Array`, so the per glyph check in the hot loop is an array read.
- State is mutated in place; a frame allocates nothing.
- The loop runs at 30 fps by default, clamps long gaps to one step, and does not run at all in static mode.
- Pass a context created with `{ alpha: false }`: the renderer fills its own background, and an opaque canvas spares the compositor a blend.

## Usage

```ts
import { BinaryRainEngine } from "@/packages/effects/binary-rain";

const engine = BinaryRainEngine.forCanvas(canvas.getContext("2d", { alpha: false })!, {
  message: ["33,000+ prompts", "Feb to Oct 2026"],
  isStatic: prefersReducedMotion(),
  config: { theme: { trail: "#4bffa5", background: "#0a0f0c" } },
});

engine.resize(width, height, devicePixelRatio);
engine.start();   // begin the loop, for example when the canvas scrolls into view
engine.decode();  // assemble the message out of the rain, once
engine.stop();    // pause, for example when it scrolls out of view
```

To render somewhere else (WebGL, DOM, a test spy) implement `RainRenderer` and use `new BinaryRainEngine(renderer, options)`. To use another alphabet pass `glyphs: new CharacterGlyphSource("0123456789ABCDEF")`.
