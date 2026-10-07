# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page personal portfolio (Redeemer Pace) built on Next.js **Pages Router**, deployed to Vercel at <https://redgame.dev>. One route (`src/pages/index.tsx`) renders every section; navigation is anchor-based scrolling, not routing.

## Commands

```bash
npm run dev                                  # dev server (localhost:3000), webpack not Turbopack
npm run build && npm start                   # production build / serve
npm run lint                                 # eslint --fix over src/ and __tests__/src/
npx tsc --noEmit                             # typecheck (there is no script for it)
npm test                                     # jest --watch
npm run test:ci                              # every suite once
npm run test:coverage                        # once, with coverage of src/ (data excluded)
npx jest __tests__/src/pages/index.test.tsx --watchAll=false   # single test file
npx jest -t "renders every section" --watchAll=false           # single test by name
ANALYZE=true npm run build                   # bundle analysis (@next/bundle-analyzer, does not auto-open)
```

`npm install` pulls `@fortawesome/pro-*` packages, which require an authenticated FontAwesome Pro npm registry token. It lives in the machine's global `~/.npmrc` (`@fortawesome:registry` + `_authToken`), deliberately **not** a project `.npmrc`, since `.gitignore` does not exclude one and this repo is public.

Use Node 22+ (`.nvmrc` pins 22.6.0, `engines` allows `22.x || 24.x`). Node 23 is not a Vercel target and triggers an `Exit handler never called!` bug in npm 10.9 that aborts installs midway and leaves `node_modules` corrupt; `rm -rf node_modules` and reinstall on 22/24 to recover. Run `nvm use` before any npm command; the global default here is 23.

Without `node_modules`, `npx tsc` and `npx eslint` do not fail cleanly: npx downloads the wrong packages instead (`tsc@2` is an unrelated squatter, and ESLint 9 rejects the legacy `.eslintrc.json`). Install first. `npm run lint` calls ESLint 8 directly because Next 16 removed `next lint`.

## Verifying changes

**Verify against the deployed Vercel preview using the Playwright MCP tools, not a local dev server or local build.** Push the branch, let the preview deploy, then drive Playwright against the preview URL and read its console. Local runs are slow, crash-prone on this machine, and do not reflect what actually ships.

**Both `dev` and `build` pass `--webpack`.** Next 16 defaults to Turbopack, which cannot run Babel macros, and twin.macro is a Babel macro. Dropping the flag breaks every `tw` template literal. This is also why `next/font` is unusable here, so Roboto stays an external stylesheet.

`next dev` and `next build` share `.next`, and a dev server started over a production build dies with `ENOENT: .next/fallback-build-manifest.json`. If you do run locally, `rm -rf .next` between the two.

`.playwright-mcp/` holds console logs and page snapshots from those runs and is gitignored.

Hydration mismatches only surface in the browser console, so they are invisible to `tsc`, ESLint, `next build` and jest. All four can be green while the page is broken at runtime. The console check is the only thing that catches them.

## Architecture

### Content is data, not markup

All site content is the `portfolioData` object exported by `src/data/resume.ts`, which only gathers one file per part of the page from `src/data/portfolio/` (`profile`, `terminal`, `sections`, `services`, `history`, `skills`, `roster`, `projects`, `caseStudies`, `game`, `domains`, `aiUsage`, `navigation`; the view copy sits in `src/data/lens.ts`; blueprints live apart in `src/data/blueprints/` and are loaded on demand, see Blueprints). Its type, `PortfolioData`, is in `types/portfolio.d.ts`, built from the interfaces in `types/*.d.ts`; `types/` never imports data. `src/pages/index.tsx` is purely composition: it slices `portfolioData` and passes the pieces into section components. **To change what the site says, edit the matching file in `src/data/portfolio/`**. Components should stay content-free: labels, templates (`{name}` placeholders, filled by `fill()` from `packages/text/format`) and stop names are content. Skills are lists of names per `SkillGroup`; years come from the forge, never a self score. Section intros are keyed by the closed `SectionIntroKey`.

`src/components/SEO` derives all JSON-LD (profile, FAQ, per-project `NewsArticle`, per-service `Product`) from the same `portfolioData`, so adding a project or service automatically extends structured data. It is mounted once in `src/pages/_app.tsx` (not `index.tsx`) with `url={process.env.HOST || "#"}`; the page title template and meta description live in `src/data/seo.ts`.

### Section ids and scroll-spy

Each section renders `id={SECTION_IDS.x}` on its outer element (the shared `Section` from `src/components/Section`). **Every section id lives in `SECTION_IDS` in `src/config/sections.ts`**, lower case and in page order; a test keeps them unique. The same file holds `AUDIENCE_ANCHORS`, `ROLE_ANCHORS`, `industryAnchor()` and the hash parsers for the first screen's chips. The journey's zone boundaries are in `src/config/zones.ts`, and the trail (`services/journey/trail.ts`) lists every section in page order with its title.

The menus follow `JOURNEY_STOPS` in `src/config/journey.ts`: eight stops (who, offer, history, ai, web3, engineering, igaming, game), each covering a run of sections from `first` to `last`, its `href` derived and its name in `menu.stops` in the content. The SEO breadcrumb is built from the same stops. A test checks the stops cover the trail end to end, so a new section only needs to sit inside a stop's run. `useJourneyNav` (called once in the header for both menus) reads every stop on the shared scroll frame, returns which are on screen as state that changes only when a stop enters or leaves, and writes how far through each stop the reader is as `--nav-progress-<index>` on the header. Large screens show the stops across the header; smaller ones get `MobileMenu`, a real button that opens a full screen `<dialog>` with each stop in its zone's colour (`ZONE_ACCENTS`).

Skill forge station ids are derived from the station title by `skillStationId()` in `src/config/skills.ts`, which strips every non-alphanumeric character (`"AI Tools & Enablement"` → `section-skills-AIToolsEnablement`). Renaming a station title changes its id, so grep for the old id when you do. Stations come from `portfolioData.skills` groups in the order of `FORGE_STATIONS` (languages, frontend, backend, mobile, blockchain, cloud, CMS, tools, testing, integrations, observability, AI, design); each needs a `sections` intro under the same key, and a skill's years come only from roles and projects that list or mention it, so a new skill needs that evidence (or a `SKILL_ALIASES` entry) or it shows as untracked. A long role lists everything it used over its life, so each skill also has a floor (`skillFloors()`): the later of its public release (`SKILL_RELEASES`) and when Red first used it where that is later (`SKILL_FIRST_USED`), and nothing counts before it. A new tool needs its release month there, and a test refuses a floor that names no listed skill. `SKILL_MENTION_EXCLUDE` keeps names out of the prose scan where the prose names them without using them. Skills by Area must not repeat a skill that has a forge bar; a test checks it.

### Tabs

Every row of tabs uses `useTabs` (`src/hooks/useTabs.ts`: roving focus, arrows, Home and End via the tested `rovingTarget` in `packages/accessibility/roving`) and the shared look in `src/components/Tabs`. Content tabs (Skills by Area, the expertise tiles) render every panel and hide the closed ones with `hidden`, so all of it stays in the server HTML. A horizontally scrolling row carries `data-scroll-x`, which tells the project dialog not to treat its arrow keys as travel between regions.

### Styling: twin.macro + styled-components + Tailwind

Tailwind classes are compiled at build time through `twin.macro` (a babel macro; see `.babelrc.js` and `babel-plugin-macros.config.js`) into styled-components. Two idioms are used throughout:

```tsx
const Section = tw.div`relative px-[30px] py-[50px]`;              // static

const List = styled.ul(({ isCircle }: ListProps) => [               // prop-driven variants
  tw`list-none text-sm p-0`,
  isCircle && tw`flex flex-row flex-wrap justify-evenly`,
]);
```

Keyframes used from Tailwind classes (`wave`, `loading`, `border-transition`, `scroll-cue`, …) are plain CSS in `src/styles/globals.css` and referenced from arbitrary values, e.g. ``tw`animate-[wave 1s linear infinite]` ``; keyframes shared between styled components (`caretBlink`, `fadeIn`) are in `src/styles/keyframes.ts`. `tailwind.config.js` also registers custom `child`/`child-hover` variants and a `bg-wave` gradient.

Shared pieces live in components rather than being restyled per section: `Section` and `Anchor` (`src/components/Section`), and the action buttons, filter chip and tag pill (`src/components/Controls`; an action takes its colour from `--action` where a parent sets one). A component whose styles outgrow it keeps them in a sibling `<Component>.styles.ts` (the mobile menu, the architecture drawing, the region dialog, the glance views), leaving the component its markup and behaviour. Animate `transform` and `opacity`, never layout properties such as `bottom` or paint heavy ones such as `box-shadow`, and avoid `backdrop-filter` on anything that sits over scrolling content.

### State: React Context, one folder per feature

There is no state library. `src/pages/_app.tsx` wraps the page in `AppLoaderProvider`, `LensProvider` then `GameProvider`, and each feature colocates its state:

```
src/components/Game/context/GameContext.tsx    # createContext + Provider holding useState, value memoized
src/components/Game/hooks/useGameStateHook.ts  # useContext, throws if used outside the provider
```

Components call the `use*StateHook`, never `useContext` directly. `AppLoader` holds `isLoading` and `isReady`. `Game` holds the visitor's run: the chosen character and Bug Raid best (kept in `localStorage` under `redgame.game`, read after mount so hydration matches), plus this visit's bosses defeated, zones crossed and duels won, which the HUD and the finale read. Every `localStorage` read and write goes through `readStored(key, guard)` and `writeStored` from `packages/browser/storage`, which survive blocked storage and validate what they read. State that belongs in the URL hash (the industry filter, the case study audience, the map's games link) uses `useHashState` or the read only `useHashValue`, which keep every reader of the hash in step.

### Audience views (lenses)

The page has three views: `recruiter`, `product` and `engineer` (`src/config/lenses.ts`). `LENS_SETTINGS` sets each view's immersion: zone transitions soft (crossfade) or full, decode off, headings only or all, and the game layer (HUD, boss health, the fight, character select, the live table). Every view, on every screen, gets the animated world, the game layer and the switch effects; views differ in wording, depth, decoding and the full zone crossings. Components read `useLensStateHook()` for `lens` and `settings`; `data-lens` is also set on the root.

Status runs `pending` (storage not read yet), `choosing`, `entering`, `chosen`. A `?view=` link wins, then the choice remembered in `localStorage` (`redgame.lens`); otherwise `LensGate` (`src/components/Lens`) shows a character select after the loader and plays that view's entrance. The server and first client render are always `engineer`, the full page, so hydration matches whatever was chosen. `LensSwitch` in the header changes view by going back to the top and playing that view's entrance, so the reader sees the immersion they picked.

Every section renders for every view; only depth and wording change. A section intro can carry `lenses: { recruiter, product }` descriptions, rendered by `SectionText`; titles never change, since the menu and the trail use them. History entries carry a `productOutcome`, boss fights read as problem, decisions and takeaway outside the full view, and `Glance` adds a fact sheet (recruiter) or product playbook (product) after the cover (its `GlanceSheet` is a dynamic import, so the default engineer view never downloads it, and the lens entrance is fetched the same way when a choice is near), pulling skill years from the forge and levels from the roster rather than typing numbers twice. The recruiter's glance has a Hiring for row (`hires` in `src/data/lens.ts`): each role leads with a fit line drawn from what the page already says and swaps the role years and skills, and the pick lives in the hash (`#hiring-<id>`, `hiringAnchor` in `config/sections.ts`) so a shortlist can be shared. Proof figures carry an `id`, and anything that shows one (the product playbook, the terminal) picks it by id, never by its value. The recruiter's entrance shortlists a candidate card whose ticks are the page's own facts (`LENS_CANDIDATE` in `Layout`).

### Blueprints

`src/components/Blueprint` draws kinds of architecture from `src/data/blueprints/`, one file per section (`ai`, `chain`, `platform`, `casino`, `mmo`, each a default export), plus `ventures.ts` for Red's own ventures, whose project map dialog names its drawing by `deepDive.blueprintId`. Only `labels.ts` is part of `portfolioData`. **Neither the drawings nor the code that draws them are in the page bundle**: a section renders `<BlueprintSection section="chain" />`, which fetches that section's file and `BlueprintList` together once it is within a screen of view (`loadSectionBlueprints` in `src/data/blueprints/index.ts`), and a dialog renders `<VentureBlueprint id />` on open. `src/components/Blueprint/index.tsx` exports only those two loaders, so never import `Blueprint`, `BlueprintList` or `BlueprintTabs` from page code, or the whole family lands back in the main chunk. Blueprints are therefore not in the server HTML. Tests read every drawing through the static `src/data/blueprints/all.ts`, which the page must never import. A new section of drawings needs its file, a case in the loader's switch and an entry in `all.ts`. Blueprints never name an employer, only the shape of the system, and a test enforces it. Each has three tabs: Overview (role, scale, stack), Architecture and Product flow (wireframes and user journeys). An architecture is groups placed on a grid (`place: { col, row, colSpan, rowSpan }` on wide screens; narrow screens stack in array order) with nodes inside, and edges between node or group ids. Wires are routed from the measured boxes (`utils/route.ts`, tested), measured from layout offsets rather than bounding rects so a tab switch that scales or flips the drawing does not skew them. A drawing is always a diagram: where it has less room than `minWideWidth()` (`utils/layout.ts`, which grows with the densest frame) it is laid out at that width and either scaled down to fit (the default, the whole system at a glance) or zoomed in to pan sideways. The wires are also listed as text for screen readers. A test keeps every drawing within 800px, the room a dialog has. In sections a blueprint bleeds up to 1200px wide on large screens, leaving 80px each side for the fixed rails; in a dialog it passes `isBleed={false}`. Overviews never identify a company: they say what was proposed and built, with a scale that names no one. A section with several blueprints shows them as tabs (`BlueprintTabs`, short names in `tab`) with an animated switch that belongs to its universe (`ZONE_EFFECTS`): a neural beam for AI, blocks confirming in a wave for Web3, a card dealt and flipped for the casino, a pixel dissolve for the game world, a terminal scan for engineering; a plain fade in the quick view, nothing with reduced motion. Each zone gives the boxes its own look. Engineers open on the architecture, product readers on the product flow, recruiters on the overview. Every architecture carries a note that it is a glance, not the full design. The data test checks every edge joins ids that exist.

### Switches, carousels and games

Anything that switches in place uses `SwitchStage` with `useSwitch` (`src/components/SwitchStage`): call `play(direction)` on every switch and it plays the effect of the zone the stage sits in, read from document order by `zoneOf()` (scan for the matrix, beam for AI, blocks for Web3, a dealt card for the casino, pixels for the game world), or a fade in the quick view; a blueprint passes its own zone. Its direct children animate, and a child that comes back from `hidden` replays, so panels kept in the page need no remount. Skills by Area, the expertise tabs, the blueprint showcases, each blueprint's Overview / Architecture / Product flow switch and every `Carousel` use it. `Carousel` (`src/components/Carousel`) shows a page of cards at a time, keeps every card in the page, and drives Characters I Play and the boss fights.

Canvas games follow Bug Raid's shape in `src/packages/games/<name>`: a pure simulation that only moves through `step()` with injected randomness (tested), a game class on `FrameLoop` that reports changes rather than frames, and a renderer. The live table (iGaming, game views only) keeps readable content in the DOM over its canvas felt. Characters drawn with curves run on the rig engine (`src/packages/graphics/rig`), the way a game engine runs models and sprites: a model lists its layers (bounds, cache key channels, motion), skins are data, an `Animator` plays cues (talk, blink), and `RigRenderer` paints each layer once per skin and step into a `SpriteCache` and only blits it after; cheap procedural layers set `cache: false` and paint live. The live dealer (`createDealerModel`) and the MMO heroes on the character cards (`createHeroModel`, class per character in `roster.characters[].hero`) are rig models, and the hero cards share one renderer.

History splits experience into two tabs by `isVenture`: Work (the main lane) and Founded and co-founded (a gold branch). It has a switch of its own rather than the zone's: a `git checkout <branch>` line types out, git answers, and the branch's commits land one by one. A venture belongs in `experience` with `isVenture: true`; when a project already counts its skill years, the experience entry sets `countsForSkills: false` so places are not listed twice.

### Reveals replay

`useInView` has three modes, decided by the tested `nextInView`. It follows whatever element its ref holds after each render, so an element that appears later (a branch rendered only in some views) is still watched. Left at its default it replays: on once `threshold` of the element is on screen, off only once the element has left the screen entirely, so scrolling back to something plays it again and nothing runs backwards while still visible. `once: true` is for one off work such as building a drawing; `once: false` follows the element exactly, for loops that pause off screen. Anything driven by it must reset when it turns off: `useDecodedText` returns to bits, `useAnimationProgress` to 0, the portrait engine rewinds, and duel rounds unplay only when they drop back below the screen.

### Loading flow and dialogs

`Layout` renders `<AppLoader />` over the content, which renders underneath from the start so it is painted and measured by the time the intro lifts; the loader only holds the page still (`useScrollLock`). `AppLoader` flips `isLoading` off after 1s and `isReady` on after 3s, once, from mount, so the intro is time based, not load event based. Canvases still size from a `ResizeObserver`, never a one off read.

Dialogs (the lens chooser, the mobile menu, the terminal's quest dialog, the project region map) are native `<dialog>` elements driven by `useModalDialog(ref, isOpen)`, which calls `showModal()` (focus trapping, Escape and the backdrop for free), holds the page still while open and returns a backdrop click handler. `useScrollLock` counts its holders, so one dialog closing never frees the page while another holds it, and `usePageHeld()` tells work that should pause meanwhile, such as the backdrop. The region and quest dialogs are lazy (`LazyRegionDialog`, `LazyTerminalDialog`): their code loads on first open and they are mounted only while open.

The layout container uses `overflow: clip`, not `hidden`. `hidden` makes it a scroll container and silently breaks `position: sticky` for every section inside it.

### Performance

All scroll reading goes through one shared `ScrollFrame` (`packages/interaction/scroll-frame`, bound to the page by `useScrollFrame` in `src/hooks`): every subscriber reads layout, then every subscriber writes, at most once a frame, from one passive listener. A task's `read` gets `rectOf(id)` with a per frame cache; its `write` should put continuous values (progress) into CSS variables on the element that draws them and only set React state when a discrete answer changes. Never add a `window` scroll listener of its own, and never write variables on `:root`, which restyles the whole document. For on and off states use `useInView` (IntersectionObserver), which costs nothing while scrolling.

Every canvas effect binds through `useCanvasEngine(canvasRef, { create, resize, sizeRef, isEnabled, nearMargin }, deps)`: it builds the engine once the canvas is near the screen, sizes it from a `ResizeObserver` at the device pixel ratio, rebuilds on `deps` and stops it on unmount; starting and stopping while built is the caller's. `create` may be async, and engines that are not needed on first paint import their package inside it (`await import("@/packages/games/bug-raid")`), with only `import type` at the top of the component, so their code stays out of the page bundle. App config that a lazy engine reads must not import that package's values either: Bug Raid takes a partial theme for this reason. Animated components pause off screen (`useInView` with `once: false`), and a frame driven clock (`useAnimationProgress`, with an optional start delay) belongs in the smallest component that shows it.

### Packages, services and config

Reusable logic lives in `src/packages/<domain>/<name>` (frame loop, scroll frame, canvas renderer and glyph atlas, colour, backdrop scenes, binary rain, pixel reveal, Bug Raid, heroes, live table, rig, pixel art, hex grid, clamp, text format, browser storage, terminal, career and skill insights, AI usage domain). Packages never import app code, React or twin.macro, and other packages only through their `index.ts`; an ESLint override in `.eslintrc.json` enforces all three. `src/packages/README.md` lists them and the folder vocabulary (`config/`, `domain/`, `core/`, `guards/`, `validators/`, `mappers/`, `services/`, `utils/`).

Content that crosses a boundary goes through `ContentService` (`core/content`): a `ContentSource` returns `unknown`, then a guard, a `Validator` and a `Mapper` run in that order. `src/services/<feature>/` is the composition root that plugs a site specific source (for example `PortfolioAiUsageSource`) into a generic package service. `index.tsx` calls `aiUsageService.getView()` at module scope, so invalid content (task shares not adding up to 100, a missing field) fails the static build.

`src/services/` also holds the shared readings of the content: `roster` (a character's level is its whole years in the role, at least 1), `contact` (the contact and hire dialogs), `skills` (the forge) and `terminal`, whose commands live in one file per help group under `terminal/commands/` and share a `CommandContext`.

`src/config/` holds app configuration: `sections.ts` for every section id, `journey.ts` for the menu's stops, `zones.ts` for the zone boundaries and `ZONE_ACCENTS`, `social.ts` for profile URLs (`SOCIAL_URLS`), `lenses.ts` for the views, and `theme.ts` for runtime colours that twin cannot reach, such as the canvas palette. Every runtime zone colour is derived from `ZONE_ACCENTS` through `packages/graphics/colour`, and a test keeps `ZONE_ACCENTS` equal to the `--accent` each zone sets in `globals.css`. Per component timings and themes live next to the component in `config.ts`.

Aliases `@/packages/*`, `@/services/*` and `@/config/*` are in `tsconfig.json` alongside the others.

### Images

`src/components/Image` wraps `next/image` and swaps to `fallbackSrc` on error. Project images are referenced as `.webp` with the `.jpg` sibling as fallback (`image.replace(".webp", ".jpg")`), so `public/images/` keeps both formats per asset.

## Conventions

Enforced by `.eslintrc.json` (typescript-eslint `recommended-requiring-type-checking` + `jsx-a11y` + `styled-components-a11y`):

- Double quotes, semicolons required, `curly` always, `eqeqeq` smart.
- `import/order`: react first → other external → `@/*` internal, blank line between groups, alphabetized case-insensitively.
- Path aliases (`tsconfig.json`): `@/components/*`, `@/pages/*`, `@/layouts/*`, `@/hooks/*`, `@/data/*`, `@/styles/*` map into `src/`, but **`@/types/*` maps to the root-level `types/` directory**, not `src/types`.
- TS `strict: true`; several unsafe-* rules are deliberately off, but `no-floating-promises`/`no-explicit-any` are too, so don't assume they'll catch mistakes.
- Commits follow `feat:` / `fix:` / `chore:` / `docs:` / `refactor:` prefixes. **Do not add `Co-Authored-By` trailers.**
- **Never use em dashes.** Not in site content, code comments, docs, or commit messages. Use a comma, a full stop, or a colon.

## Gotchas

- `src/pages/_document.tsx` collects styled-components styles via `ServerStyleSheet` and loads Roboto (which `globals.css` asks for). It replaced a misnamed, malformed `_documents.tsx` whose `enhanceApp` returned a whole `<Html>` tree. That file was never picked up by Next, so before this the app shipped no SSR styles and never loaded its font. Keep the standard `enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />)` shape.
- Tests mirror `src/` under `__tests__/src/`: packages and services, pure logic pulled out of components (journey, menu stops, carousel paging, typewriter, History branches, switch effects), shared hooks and components with React Testing Library, and `pages/index.test.tsx`, which renders the whole page in every view inside its providers and fails on a missing section or any `console.error`. Keep logic testable by putting it in a pure function beside the component. Jest compiles through Next's bundled Babel (`__tests__/setups/babelTransform.js` with `.babelrc.js`), so twin.macro runs in tests too; `jest.setup.js` stubs the observers, `matchMedia`, the dialog API and canvas. A test that needs things on screen swaps in its own `IntersectionObserver`. Every file under `__tests__/` counts as a test suite, so shared test data goes in a `fixtures/` folder, which `jest.config.js` ignores.
- tsc never runs twin.macro, so a Tailwind class twin does not support only fails when the file is compiled (a test that imports it, or the build). To check a component directly, compile it with Next's bundled Babel: `require("next/dist/compiled/babel/core").transformFileSync(file, { configFile: "./.babelrc.js" })`. The root `@babel/core` is Jest's older copy and refuses `next/babel`. Twin 2.8 lags Tailwind 3: `border-x-*` and `cursor-crosshair` do not exist, `keyframes` must come from `styled-components`, and underscores inside arbitrary values (`grid-cols-[1fr_2fr]`) are not turned into spaces, so the class is dropped without any error. Put such values in a `css` block.
- `.env.production` and `.env.test` are committed and define `HOST`, `DEBUG`, `ANALYZE`. There is no `.env.development`, so on a fresh clone `process.env.HOST` is undefined under `npm run dev` and `SEO`'s canonical URL falls back to `"#"`. A gitignored local `.env` (loaded by Next in every mode) can define it. Only `HOST` and `DEBUG` are exposed to the client (via `env` in `next.config.js`).
- `next.config.js` sets `trailingSlash: true` and strips all `console.*` except `console.error` from production builds.
- An image `quality` must be listed in `images.qualities` in `next.config.js` (55 and 75 now); Next 16 quietly serves the nearest listed one otherwise. Jest does not read that config, so the page test passes it through `ImageConfigContext`.
- Lighthouse reports live in `analyze/*.pdf`.
