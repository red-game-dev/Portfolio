# Packages

Self-contained modules that know nothing about this portfolio. Each one lives at `src/packages/<domain>/<name>`, exposes its public API from `index.ts`, and could be published as its own npm package with no change beyond its import specifiers.

## Rules

Enforced by ESLint (`no-restricted-imports` override in `.eslintrc.json`):

- A package never imports app code: no `@/components`, `@/config`, `@/data`, `@/hooks`, `@/layouts`, `@/pages`, `@/services`, `@/styles` or `@/types`.
- A package imports another package only through its entry point (`@/packages/<domain>/<name>`), never a file inside it.
- No React, styled-components or twin.macro. Framework bindings live in `src/components/*`, so a package works the same from a game loop, a worker or another framework.

Inside a package the folders follow one vocabulary, so any of them reads the same:

| Folder | Holds |
|---|---|
| `config/` | Defaults and the resolver that merges host overrides over them |
| `domain/` | Types, errors and the interfaces (ports) other layers depend on |
| `core/` | The classes that do the work |
| `guards/` | Runtime shape checks for data crossing a boundary |
| `validators/` | Business rules, returning every error instead of stopping at the first |
| `mappers/` | One-way transforms from one shape to another |
| `services/` | Orchestration of the above for a caller |
| `sources/`, `schedulers/`, `renderers/` | Swappable implementations of a port |
| `utils/` | Small pure functions with no state |

## Catalogue

| Package | What it gives you |
|---|---|
| `accessibility/motion` | The reduced motion preference, safe to call during server rendering |
| `accessibility/roving` | `rovingTarget`, where arrows, Home and End move focus in a row of tabs or cards |
| `animation/frame-loop` | `FrameLoop` base class with fixed rate stepping and clamping, plus `AnimationFrameScheduler`, `TimeoutScheduler` and `ManualScheduler` |
| `core/content` | `ContentSource` port, `InMemoryContentSource`, and the `ContentService` base that runs source, guard, validator and mapper in order |
| `core/domain` | `Validator` and `Mapper` base classes, `ValidationError`, primitive guards |
| `effects/backdrop` | A scene engine for full page backgrounds: crossfades between scenes and plays a transition keyed by the pair of scenes it moves between |
| `effects/binary-rain` | Falling binary rain that assembles a message, built on `frame-loop` and `graphics/canvas` |
| `effects/pixel-reveal` | An image materialising from binary to pixels to full resolution, built on `frame-loop` and `graphics/canvas` |
| `encoding/binary` | Text to binary, same length masks, and the frame by frame decode used for text reveals |
| `insights/activity` | `activityStats`: active days, day and week streaks (across years), perfect weeks, the busiest month and each year's longest run, from a contribution calendar |
| `games/bug-raid` | A playable arcade game on `frame-loop` and `graphics/canvas`, with pointer, touch and keyboard input |
| `games/live-table` | A live dealer round (place your bets, final bets, no more bets, results) with other players throwing face down, as a tested `LiveTableSimulation`, a `LiveTableGame` on `frame-loop` and a canvas felt renderer |
| `graphics/canvas` | `CanvasRenderer` base for DPR aware surfaces and `GlyphAtlas` for GPU friendly text drawing |
| `graphics/pixel-art` | Pixel maps to one SVG path per colour, for crisp sprites at any size |
| `insights/ai-usage` | Domain model, guard, validators, mapper and service for an AI usage breakdown, independent of any icon library or content store |
| `insights/career` | `TenureCalculator`: years in a role from date ranges, overlaps merged |
| `insights/skills` | Years of real use per skill from roles and projects, with a rarity policy |
| `interaction/terminal` | A command registry, input parser and session for a text terminal, with no rendering of its own |
| `math/hex-grid` | Pointy topped hex grid geometry and a snaking route through it, for map layouts |
| `math/random` | Seedable random source for repeatable visuals and tests |

Tests mirror this tree under `__tests__/src/packages/`.
