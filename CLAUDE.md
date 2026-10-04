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
npm test                                     # jest --watch (watch mode only)
npx jest __tests__/src/pages/index.test.tsx --watchAll=false   # single test file
npx jest -t "it works" --watchAll=false      # single test by name
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

All site content lives in `src/data/resume.ts` as the `portfolioData` object (~1500 lines), typed by `PortfolioData` using the interfaces in `types/*.d.ts`. `src/pages/index.tsx` is purely composition: it slices `portfolioData` and passes the pieces into section components. **To change what the site says, edit `src/data/resume.ts`**. Components should stay content-free.

`src/components/SEO` derives all JSON-LD (profile, FAQ, per-project `NewsArticle`, per-service `Product`) from the same `portfolioData`, so adding a project or service automatically extends structured data. It is mounted once in `src/pages/_app.tsx` (not `index.tsx`) with `url={process.env.HOST || "#"}`; the page title template and meta description live in `src/data/seo.ts`.

### Section ids and scroll-spy

Each section component renders `id="section-*"` on its outer element. `src/hooks/useCollision.ts` attaches a `window` scroll listener for a given element id and returns whether it is on screen (it reports `false` until the first scroll event). `src/components/Menu` uses one `useCollision` call per tracked section to highlight the active nav item, and `Skills` components use it to trigger progress-bar animation.

Skill section ids are **derived from the intro title** by `toSkillsSectionId()` in `src/components/Skills/index.tsx`, which strips every non-alphanumeric character (`"AI Tools & Enablement"` → `section-skills-AIToolsEnablement`). `Menu` and `SEO` hardcode the resulting ids, so **renaming a skills section title in `resume.ts` silently breaks the matching nav highlight and the SEO breadcrumb**, so grep for the old id when you do.

`Menu` only tracks some skills sections (tech, tools, AI, design, language, expertise), plus the "How I use AI" section through `SECTION_IDS`. When no tracked section is on screen, "Beginning" is highlighted, so a new skills section needs its own `useCollision` call in `Menu` or the nav falls back to "Beginning" while it is in view.

### Styling: twin.macro + styled-components + Tailwind

Tailwind classes are compiled at build time through `twin.macro` (a babel macro; see `.babelrc.js` and `babel-plugin-macros.config.js`) into styled-components. Two idioms are used throughout:

```tsx
const Section = tw.div`relative px-[30px] py-[50px]`;              // static

const List = styled.ul(({ isCircle }: ListProps) => [               // prop-driven variants
  tw`list-none text-sm p-0`,
  isCircle && tw`flex flex-row flex-wrap justify-evenly`,
]);
```

Keyframes (`wave`, `bounceIn`, `loading`, `border-transition`, …) are plain CSS in `src/styles/globals.css` and referenced from arbitrary Tailwind values, e.g. ``tw`animate-[wave 1s linear infinite]` ``. `tailwind.config.js` also registers custom `child`/`child-hover` variants and a `bg-wave` gradient.

### State: React Context, one folder per feature

There is no state library. `src/pages/_app.tsx` wraps the page in `AppLoaderProvider` then `ModalProvider`, and each feature colocates its state:

```
src/components/Modal/context/ModalContext.tsx    # createContext + Provider holding useState, value memoized
src/components/Modal/hooks/useModalStateHook.ts  # useContext, throws if used outside the provider
src/components/Modal/index.tsx                   # consumes the hook
```

Components call the `use*StateHook`, never `useContext` directly. Currently two features use this: `AppLoader` (`isLoading`, `isReady`) and `Modal` (`modalContent`, `setModal`).

### Loading and modal flow

`Layout` (a plain import in `index.tsx`) renders `<Modal />` and `<AppLoader />` outside the content container and hides the container while `isLoading`. `AppLoader` flips `isLoading` off after 1s and `isReady` on after 3s via `setTimeout`, so the intro animation is time-based, not load-event-based. Project cards call `setModal({ type: ModalType.PROJECT, ... })`; `Modal` renders `ProjectModal` when `modalContent.type === "project"` and closes via the `useClickOutside` hook.

### Packages, services and config

Reusable logic lives in `src/packages/<domain>/<name>` (frame loop, canvas glyph atlas, binary rain, binary encoding, content service base, AI usage domain). Packages never import app code, React or twin.macro, and other packages only through their `index.ts`; an ESLint override in `.eslintrc.json` enforces all three. `src/packages/README.md` lists them and the folder vocabulary (`config/`, `domain/`, `core/`, `guards/`, `validators/`, `mappers/`, `services/`, `utils/`).

Content that crosses a boundary goes through `ContentService` (`core/content`): a `ContentSource` returns `unknown`, then a guard, a `Validator` and a `Mapper` run in that order. `src/services/<feature>/` is the composition root that plugs a site specific source (for example `PortfolioAiUsageSource`) into a generic package service. `index.tsx` calls `aiUsageService.getView()` at module scope, so invalid content (task shares not adding up to 100, a missing field) fails the static build.

`src/config/` holds app configuration: `sections.ts` for shared section ids (Menu, SEO and the section import them) and `theme.ts` for runtime colours that twin cannot reach, such as the canvas palette. Per component timings live next to the component in `config.ts`.

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
- Tests cover the packages and services (`__tests__/src/packages/`, `__tests__/src/services/`); components are untested and `__tests__/src/pages/index.test.tsx` is still a placeholder. Every file under `__tests__/` counts as a test suite, so shared test data goes in a `fixtures/` folder, which `jest.config.js` ignores.
- tsc and Jest never run twin.macro, so a Tailwind class twin does not support only fails at build time. To check components without a full build, compile them with Next's bundled Babel: `require("next/dist/compiled/babel/core").transformFileSync(file, { configFile: "./.babelrc.js" })`. The root `@babel/core` is Jest's older copy and refuses `next/babel`.
- `.env.production` and `.env.test` are committed and define `HOST`, `DEBUG`, `ANALYZE`. There is no `.env.development`, so on a fresh clone `process.env.HOST` is undefined under `npm run dev` and `SEO`'s canonical URL falls back to `"#"`. A gitignored local `.env` (loaded by Next in every mode) can define it. Only `HOST` and `DEBUG` are exposed to the client (via `env` in `next.config.js`).
- `next.config.js` sets `trailingSlash: true` and strips all `console.*` except `console.error` from production builds.
- Lighthouse reports live in `analyze/*.pdf`.
