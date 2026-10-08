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
| `sources/`, `schedulers/`, `renderers/`, `models/` | Swappable implementations of a port |
| `utils/` | Small pure functions with no state |

## Catalogue

| Package | What it gives you |
|---|---|
| `ai/ask` | Question answering on any AI provider, for many instances at once: an `AnswerModel` port with `AnthropicMessagesModel` and `OpenAICompatibleModel` (OpenAI, Gemini, Groq, OpenRouter and other Chat Completions APIs) as adapters; an `AskService` that tries ordered routes per depth (retrying a busy one, skipping a refusing one), refuses before any model call, lets one request answer a burst of identical questions, prices each answer from reported usage and streams events (model, text, cited sources, done or error); `SlidingWindowLimiter`, `SpendBudget` and `AnswerCache` over shared store ports, with `MemoryStore`, `UpstashRestStore` (Redis over REST, pipelined) and `ResilientStore` (falls back for a cooldown when the shared store fails); NDJSON encode and read for the wire |
| `accessibility/motion` | The reduced motion preference, safe to call during server rendering |
| `accessibility/roving` | `rovingTarget`, where arrows, Home and End move focus in a row of tabs or cards |
| `browser/storage` | `readStored` and `writeStored`: guarded localStorage that validates what it reads and survives private windows and full quotas |
| `animation/frame-loop` | `FrameLoop` base class with fixed rate stepping and clamping, plus `AnimationFrameScheduler`, `TimeoutScheduler` and `ManualScheduler` |
| `core/content` | `ContentSource` port, `InMemoryContentSource`, and the `ContentService` base that runs source, guard, validator and mapper in order |
| `core/domain` | `Validator` and `Mapper` base classes, `ValidationError`, primitive guards |
| `effects/backdrop` | A scene engine for full page backgrounds: crossfades between scenes and plays a transition keyed by the pair of scenes it moves between |
| `effects/binary-rain` | Falling binary rain that assembles a message, built on `frame-loop` and `graphics/canvas` |
| `effects/pixel-reveal` | An image materialising from binary to pixels to full resolution, built on `frame-loop` and `graphics/canvas` |
| `encoding/binary` | Text to binary, same length masks, and the frame by frame decode used for text reveals |
| `graphics/rig` | A small sprite engine: a `RigModel` (layers back to front, each with optional bounds, cache keys and motion), skins as data, an `Animator` for one shot and repeating cues, a `RigRenderer` that paints each layer once per skin and step into a `SpriteCache` and blits it, and a `RigActor` on `frame-loop` |
| `insights/activity` | `activityStats`: active days, day and week streaks (across years), perfect weeks, the busiest month and each year's longest run, from a contribution calendar |
| `games/bug-raid` | A playable arcade game on `frame-loop` and `graphics/canvas`, with pointer, touch and keyboard input |
| `games/heroes` | MMO hero classes as data (sovereign, archmage, strategist, paladin, artificer, rune knight, captain, ranger, warsmith, battlemage) on one player, painted by `HeroPainter` and run as a rig model |
| `games/live-table` | A live dealer round (place your bets, final bets, no more bets, results) with other players throwing face down, as a tested `LiveTableSimulation`, a `LiveTableGame` on `frame-loop` and a canvas felt renderer; and the dealer as a rig model (`createDealerModel`): body and head layers, outfits as data |
| `graphics/colour` | `hexToRgb`, `rgbChannels` for CSS custom properties, `mixRgb` and `rgba` |
| `graphics/canvas` | `CanvasRenderer` base for DPR aware surfaces, `GlyphAtlas` for GPU friendly text drawing, and `SpriteCache`: detailed artwork painted once per frame key at device resolution and blitted after |
| `graphics/pixel-art` | Pixel maps to one SVG path per colour, for crisp sprites at any size |
| `insights/ai-usage` | Domain model, guard, validators, mapper and service for an AI usage breakdown, independent of any icon library or content store |
| `insights/career` | `TenureCalculator`: years in a role from date ranges, overlaps merged; `formatPeriod` and `splitTitle` for how a role is written |
| `insights/skills` | Years of real use per skill from roles and projects, with a rarity policy |
| `interaction/scroll-frame` | `ScrollFrame`: one scroll and resize listener for a whole page, reading layout for every subscriber before any of them writes, at most once a frame, and listening only while it has subscribers |
| `interaction/terminal` | A command registry, input parser and session for a text terminal, with no rendering of its own |
| `math/clamp` | `clamp` and `clamp01` |
| `math/hex-grid` | Pointy topped hex grid geometry and a snaking route through it, for map layouts |
| `math/random` | Seedable random source for repeatable visuals and tests |
| `text/format` | `fill` for `{name}` templates and `collapseWhitespace` for content written across lines |

Tests mirror this tree under `__tests__/src/packages/`.
