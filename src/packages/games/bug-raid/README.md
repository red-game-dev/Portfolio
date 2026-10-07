# games/bug-raid

A small arcade game: bugs walk down towards a production strip, the player squashes them, and every bug that gets through costs a life. Waves speed the spawns and the bugs up until the run ends.

## Structure

| Path | Role |
|---|---|
| `config/` | `BugRaidConfig` defaults (lives, spawn and wave timing, bug kinds), `BugRaidTheme`, and `resolveBugRaidConfig` for host overrides |
| `domain/types.ts` | Bug, splat, cursor, state and snapshot types; the `BugRaidRenderer` port |
| `core/BugRaidSimulation.ts` | The rules. No DOM and no clock of its own |
| `core/BugRaidGame.ts` | Extends `FrameLoop`. Wires the simulation to a renderer, forwards input and publishes snapshots |
| `renderers/CanvasBugRaidRenderer.ts` | Extends `CanvasRenderer`. Draws bugs from sprites painted once per kind |
| `utils/` | Weighted kind picking, spawn interval, in place compaction, geometry |

Three bug kinds ship by default: `bug` (one hit), `regression` (two hits, slower) and `flaky` (jumps sideways). Kinds are data, so a host can retune or reweight them through `config.kinds`.

## Input

Input is game coordinates, never DOM events, so any device maps onto it:

- `strike(x, y)` for a mouse click or a tap, with `strikeSlop` of extra reach so fingers work as well as a cursor.
- `aim(stepsX, stepsY)` and `strikeAtCursor()` for keyboard play. The cursor is only drawn once it has been used.

## Performance

- Bugs are painted once per kind into a sprite at device resolution. A frame is one grid path, a few `drawImage` calls and one line of text.
- Bugs and splats are updated in place; the hot loop allocates nothing.
- The UI hears about score, lives, wave and status through `onChange`, which fires only when one of them changes, so a React host re-renders a few times a game instead of every frame.
- The loop stops by itself when the game ends, and `pause` stops it while the game is off screen.

## Usage

```ts
import { BugRaidGame } from "@/packages/games/bug-raid";

const game = BugRaidGame.forCanvas(canvas.getContext("2d", { alpha: false })!, {
  onChange: ({ status, score }) => status === "over" && saveBest(score),
});

game.resize({ width, height }, devicePixelRatio);
game.play();
canvas.addEventListener("pointerdown", (event) => game.strike(event.offsetX, event.offsetY));
```

A seeded random and a `ManualScheduler` replay a game exactly, which is how the tests work.
