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
| `ai/ask` | The question answering domain: `isAskBody`, `AskRequestValidator` and `AskRequestMapper` for what arrives, `PromptMapper` for the engine request, `AnswerCache` and `SourceSplitter`, `AskService` (refuses before any model call, coalesces a burst of the same question, turns engine events into ask events, prices, caches and logs), the wire format and one status map |
| `ai/engine` | Text generation on any provider: the `ModelProvider` port, `StreamingProvider` with `AnthropicProvider` and `OpenAICompatibleProvider`, request and event mappers, stream guards, `RouteValidator`, and `AiEngine` (ordered routes per tier, skip on refusal, fallback tiers, usage priced per route, always a report) |
| `http/api-client` | `ApiClient` on fetchff for JSON and streamed bodies with typed results: one global client and instances that inherit from it |
| `server/kv` | `KeyValueStore` with `MemoryStore`, `UpstashStore` (pipelined, through the official client) and `ResilientStore` (memory for a cooldown when the shared store fails) |
| `server/quota` | `SlidingWindowLimiter` and `DailyQuota` over a shared counter |
| `accessibility/motion` | The reduced motion preference, safe to call during server rendering |
| `accessibility/roving` | `rovingTarget`, where arrows, Home and End move focus in a row of tabs or cards (Home and End can be left to the browser) |
| `browser/storage` | `readStored` and `writeStored`: guarded localStorage that validates what it reads and survives private windows and full quotas |
| `browser/images` | `decodeImage`: each image fetched and decoded once a visit however many things ask for it, retried after a failure |
| `settings/preferences` | `PreferenceStore`: a host's preferences kept to a schema of choices and switches (each with what it starts as), read back from any storage and checked against its setting, set from a value or a typed word (`parseValue`), reset one or all, every change heard by every reader as a new frozen set of values |
| `browser/store` | Storage adapters chosen by need (`createStore`: IndexedDB for large or lasting data, localStorage for small, memory when neither works) and a versioned, validated `Repository` that migrates old data and never throws |
| `animation/frame-loop` | `FrameLoop` base class with fixed rate stepping and clamping, plus `AnimationFrameScheduler`, `TimeoutScheduler` and `ManualScheduler`, and `QualityGovernor`, which steps a renderer's quality down when frames run slow and back up after a long fast stretch |
| `core/content` | `ContentSource` port, `InMemoryContentSource`, and the `ContentService` base that runs source, guard, validator and mapper in order |
| `core/domain` | `Validator` and `Mapper` base classes, `ValidationError`, primitive guards |
| `effects/backdrop` | A scene engine for full page backgrounds: crossfades between scenes and plays a transition keyed by the pair of scenes it moves between; scenes from matrix rain to a starfield, transitions from a collapse to a warp |
| `effects/binary-rain` | Falling binary rain that assembles a message, built on `frame-loop` and `graphics/canvas` |
| `effects/pixel-reveal` | An image materialising from binary to pixels to full resolution, built on `frame-loop` and `graphics/canvas` |
| `encoding/binary` | Text to binary, same length masks, and the frame by frame decode used for text reveals |
| `encoding/hash` | `hashText`: a stable, non cryptographic polynomial hash of text, the same on the server and in every browser, and `hexHash` for one written as so many hex digits |
| `graphics/rig` | A small sprite engine: a `RigModel` (layers back to front, each with optional bounds, cache keys and motion), skins as data, an `Animator` for one shot and repeating cues, a `RigRenderer` that paints each layer once per skin and step into a `SpriteCache` and blits it, and a `RigActor` on `frame-loop` |
| `insights/activity` | `activityStats`: active days, day and week streaks (across years), perfect weeks, the busiest month and each year's longest run, from a contribution calendar |
| `finance/ledger` | A double entry `Ledger` in many currencies: integer minor units, transactions checked to balance in every currency before they are written, balances on each account's normal side, exchange through trading accounts, books closed into an opening balance, and plain data to keep and replay |
| `games/bug-raid` | A playable arcade game on `frame-loop` and `graphics/canvas`, with pointer, touch and keyboard input |
| `games/heroes` | MMO hero classes as data (sovereign, archmage, strategist, paladin, artificer, rune knight, captain, ranger, warsmith, battlemage) on one player, painted by `HeroPainter` and run as a rig model |
| `games/launch` | A real launch: a tested `LaunchSimulation` (hold to charge or tap to launch, a climb on a real ascent profile from a real pad with the Sun where it really is, each rocket's moments called out, orbit, and a self destruct that counts down, explodes and launches another), a `LaunchGame` on `frame-loop` that runs only while the rocket moves, and a canvas renderer (pad, three kinds of rocket with staging, smoke, clouds, the real Earth below on the GPU globe) |
| `games/voyage` | The voyage on `games/engine`: the real solar system as content (`SolarSystemSource`, guarded, validated and laid out by `SystemService`), a tested `VoyageSimulation` of one system per file (orbits on the mission clock, gravity, air, heat and the ship's systems, landings, damage, the star's weather and comets, black hole capture, universes), living universes made from the run's seed (stars of real classes in galaxies of real kinds, black holes of 5 to 30 Suns with real pull and tides, close and wide pairs and triples, worlds of the kinds found round other stars spaced so no two share an orbit, mazes of systems joined by gates, peoples who host a ship or fire on it), wrecks to salvage and ships that break down, an economy (`Hangar`: a hold, a Red Coin and Void Shard ledger, plans, crafting, 25 ship levels from rocket to intergalactic starship, one click suggestions, a profile repository), a career (missions, ranks, a codex with real figures, a daily voyage seeded from the date, a ghost of the day's best run), a `VoyageGame` that flies the camera, steers by a pointer or keys, zooms and opens a map, telemetry in real units, and a renderer over three canvases with globes from `graphics/globe` and black holes lensed through `graphics/webgl`; its `landing` folder is the way down on a world (`planLanding` picks each world's real method from its air and gravity and takes it only once `flyAhead` has flown it to a soft touchdown, `stepDescent` flies entry, parachutes, drag plates, retro burns and powered descents through the real physics, guidance flies the burn or hands it to a pilot at the low gate, `rehearse` times it) |
| `games/engine` | A small entity component engine: sparse set `ComponentStore`s, a `World` with deferred despawn, a typed `EventBus`, a fixed step `SystemPipeline` with interpolation, a spring `Camera` with look ahead, zoom and shake, a `SpatialHash`, a `Pool` and a layered `RenderPipeline` |
| `games/live-table` | A live dealer round (place your bets, final bets, no more bets, results) with other players throwing face down, as a tested `LiveTableSimulation`, a `LiveTableGame` on `frame-loop` and a canvas felt renderer; and the dealer as a rig model (`createDealerModel`): body and head layers, outfits as data |
| `graphics/colour` | `hexToRgb`, `rgbToHex`, `hexWithAlpha`, `hslToHex`, `rgbChannels` for CSS custom properties, `mixRgb`, `rgba`, `rgbCss`, and lighting by `scaleRgb` and `shadeHex` |
| `graphics/landscape` | A world seen from its ground: `skyLight` (the sky for the sun's height, the air's colour and how thin it is), `ridgeline` (seeded lines of land by relief) and `LandscapePainter` (sky, stars, sun, planets and moons in the sky, land in layers with distance haze, sea, dunes, craters, ice, forest, boulders) |
| `graphics/canvas` | `CanvasRenderer` base for DPR aware surfaces, `GlyphAtlas` for GPU friendly text drawing, and `SpriteCache`: detailed artwork painted once per frame key at device resolution and blitted after |
| `graphics/globe` | Planets and stars drawn on the GPU every frame, only the part on screen: real maps or noise recipes, day and night, city lights, clouds, glint, air, aurora, craters and rings with shadows, and stars with granulation, sunspots, corona and flares (`WebGLGlobeRenderer`), posed from their light by `globeFrame`, with `CanvasGlobeRenderer` as the fallback |
| `graphics/webgl` | `LensingPresenter`: a WebGL pass that bends a canvas round point lenses (deflection, shadow, photon ring, mirrored edges), hidden while there is nothing to bend and absent where WebGL is |
| `graphics/pixel-art` | Pixel maps to one SVG path per colour, for crisp sprites at any size |
| `insights/ai-usage` | Domain model, guard, validators, mapper and service for an AI usage breakdown, independent of any icon library or content store |
| `insights/career` | `TenureCalculator`: years in a role from date ranges, overlaps merged; `formatPeriod` and `splitTitle` for how a role is written |
| `insights/repo-growth` | A repository's lines per district after each commit, guarded, validated and mapped to heights against the tallest district (`RepoGrowthService`), with `frameIndexAt` and `heightBetween` for playback |
| `insights/skills` | Years of real use per skill from roles and projects, with a rarity policy |
| `interaction/focus` | Where an event lands relative to part of the page: `isInside`, `focusLeaves` for a blur that leaves a container, `isTypingTarget` for a key typed into a field, `closestTo`, and `listenOutside`, which hears presses outside a part of the page until stopped |
| `interaction/gestures` | Pointer gestures as small state machines with no DOM of their own: `PressTimer` (a tap or a hold), `SwipeTracker` (a finger or pen swiping a step back or forward), `DragTracker` (how far a drag moved since the last reading) and `PinchTracker` (whether two fingers are down and how much they spread), plus `localPoint` and `isPointerlessClick` for a keyboard's or assistive technology's click |
| `interaction/keys` | `KeyMap`: key presses turned into named intents, letters in either case, physical keys where a layout needs them, modifiers left to the browser where asked, presses it should not take (typing) skipped, and the event handled (default prevented, propagation stopped) as configured; `HeldKeys` for keys held down, read as intents and axes without allocating; `ARROW_STEPS` and `HORIZONTAL_ARROWS` |
| `interaction/scroll-frame` | `ScrollFrame`: one scroll and resize listener for a whole page, reading layout for every subscriber before any of them writes, at most once a frame, and listening only while it has subscribers |
| `interaction/terminal` | A command registry, input parser and session for a text terminal, with no rendering of its own |
| `interaction/zoom` | `ZoomInput`: one zoom from a wheel, a pinch (through `gestures`) and keys, each answered as a factor so the host keeps its own range |
| `physics/kepler` | Where things are in the real sky: Kepler's equation on JPL's elements (`heliocentricPosition`), Julian days, poles and seasons (`poleVector`, `subsolarLatitude`), the point on Earth under the Sun (`earthSubsolarPoint`, or from the almanac with `sunSubsolarPoint`) and the Sun's height anywhere (`solarElevation`) |
| `physics/newtonian` | Newtonian physics as pure functions: a `GravityField` floored at each surface, with black holes pulling by the Paczynski-Wiita law (the innermost stable orbit at three Schwarzschild radii), symplectic integration and exponential damping, orbital speeds and surface gravity, tidal pull, time dilation, and an exponential atmosphere with drag and entry heating |
| `math/angles` | `TAU`, `DEG` and `RAD` for turns, degrees and radians, `wrapDegrees` and `wrapRadians`, the shortest turn between two headings (`angleBetween`) and a heading part of the way to another (`lerpAngle`) |
| `math/clamp` | `clamp` and `clamp01`, and `wrap` for values that go round like a clock or a compass |
| `math/easing` | `easeInOut`, `easeIn`, `smoothstep`, `lerp` and `pulse` (up and back down, the shape of a flash), shared by the backdrop, the landscape and the games |
| `math/grid` | `balancedColumns`: how many columns to lay cards in so the last row is as full as it can be |
| `math/hex-grid` | Pointy topped hex grid geometry and a snaking route through it, for map layouts |
| `math/random` | Seedable random source for repeatable visuals and tests, and draws from any source: `randomBetween`, `randomInt`, `pick` (one item of a list) and `pickWeighted` (one item as likely as its weight) |
| `math/round` | `roundTo`: a number rounded to so many decimal places, for readings and coordinates |
| `math/stats` | `sum`, `sumBy` and `median` |
| `text/format` | `fill` for `{name}` templates, `collapseWhitespace` and `capitalise`; numbers (`formatNumber`), clocks and dates (`formatDuration`, `formatHours`, `formatLocalTime`, `formatDateTime`, `utcDay`, `twoDigits`) and places (`formatLatLon`) |

Tests mirror this tree under `__tests__/src/packages/`.
