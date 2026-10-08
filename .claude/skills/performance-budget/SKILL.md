---
name: performance-budget
description: Use when touching animation, scroll effects, canvases, backdrops, images, fonts or anything that adds to the page bundle.
---

# Performance budget

The rules are in "Performance" and "Loading flow and dialogs" in CLAUDE.md. The checklist:

1. Scroll: one shared `ScrollFrame`. No `window` scroll listener of your own, no CSS variables on `:root`; continuous values go into variables on the element that draws them.
2. On and off: `useInView`, which costs nothing while scrolling. Loops pause off screen (`once: false`) and reset when they turn off.
3. Canvas: `useCanvasEngine`, built near the screen, sized by `ResizeObserver` at the device pixel ratio. Engines not needed on first paint import their package inside `create`, with only `import type` at the top.
4. Animate `transform` and `opacity` only. No layout properties, no `box-shadow` animation, no `backdrop-filter` over scrolling content.
5. Images: `src/components/Image`, `.webp` with a `.jpg` fallback, a quality listed in `images.qualities`.
6. Bundle: anything not needed on first paint is a dynamic import. Check with `ANALYZE=true npm run build` when you add a dependency or a large module to page code.
7. Phones get every feature desktop gets; the backdrop steps its sharpness down only when `watchFrameBudget` sees slow frames.

Verify with the verify-on-preview skill, including Lighthouse at phone width.
