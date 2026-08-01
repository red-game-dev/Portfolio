# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page personal portfolio (Redeemer Pace) built on Next.js **Pages Router**, deployed to Vercel at <https://redgame.dev>. One route (`src/pages/index.tsx`) renders every section; navigation is anchor-based scrolling, not routing.

## Commands

```bash
npm run dev                                  # dev server (localhost:3000)
npm run build && npm start                   # production build / serve
npm run lint                                 # next lint --fix over src/ and __tests__/src/ (dirs set in next.config.js)
npm test                                     # jest --watch (watch mode only)
npx jest __tests__/src/pages/index.test.tsx --watchAll=false   # single test file
npx jest -t "it works" --watchAll=false      # single test by name
ANALYZE=true npm run build                   # bundle analysis (@next/bundle-analyzer, does not auto-open)
```

`npm install` pulls `@fortawesome/pro-*` packages, which require an authenticated FontAwesome Pro npm registry token. It lives in the machine's global `~/.npmrc` (`@fortawesome:registry` + `_authToken`) — deliberately **not** a project `.npmrc`, since `.gitignore` does not exclude one and this repo is public.

Use Node 22+ (`.nvmrc` pins 22.6.0, `engines` allows `22.x || 24.x`). Node 23 is not a Vercel target and triggers an `Exit handler never called!` bug in npm 10.9 that aborts installs midway and leaves `node_modules` corrupt; `rm -rf node_modules` and reinstall on 22/24 to recover. Run `nvm use` before any npm command — the global default here is 23.

## Verifying changes

**Verify against the deployed Vercel preview using the Playwright MCP tools — not a local dev server or local build.** Push the branch, let the preview deploy, then drive Playwright against the preview URL and read its console. Local runs are slow, crash-prone on this machine, and do not reflect what actually ships.

`next dev` and `next build` share `.next`, and a dev server started over a production build dies with `ENOENT: .next/fallback-build-manifest.json`. If you do run locally, `rm -rf .next` between the two.

`.playwright-mcp/` holds console logs and page snapshots from those runs and is gitignored.

Hydration mismatches only surface in the browser console, so they are invisible to `tsc`, `next lint`, `next build` and jest — all four can be green while the page is broken at runtime. The console check is the only thing that catches them.

## Architecture

### Content is data, not markup

All site content lives in `src/data/resume.ts` as the `portfolioData` object (~1000 lines), typed by `PortfolioData` using the interfaces in `types/*.d.ts`. `src/pages/index.tsx` is purely composition: it slices `portfolioData` and passes the pieces into section components. **To change what the site says, edit `src/data/resume.ts`** — components should stay content-free.

`src/components/SEO` derives all JSON-LD (profile, FAQ, per-project `NewsArticle`, per-service `Product`) from the same `portfolioData`, so adding a project or service automatically extends structured data.

### Section ids and scroll-spy

Each section component renders `id="section-*"` on its outer element. `src/hooks/useCollision.ts` polls scroll position for a given element id and returns whether it is on screen; `src/components/Menu` uses one `useCollision` call per section to highlight the active dot, and `Skills` components use it to trigger progress-bar animation.

Skill section ids are **derived from the intro title** by `toSkillsSectionId()` in `src/components/Skills/index.tsx`, which strips every non-alphanumeric character (`"AI Tools & Enablement"` → `section-skills-AIToolsEnablement`). `Menu` and `SEO` hardcode the resulting ids, so **renaming a skills section title in `resume.ts` silently breaks the matching nav highlight and the SEO breadcrumb** — grep for the old id when you do.

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

### State: Recoil, one folder per feature

`RecoilRoot` is in `src/pages/_app.tsx`. The convention is per-component state colocation:

```
src/components/Modal/atoms/ModalAtom.ts          # atom<T>({ key, default })
src/components/Modal/hooks/useModalStateHook.ts  # wraps useRecoilState, returns named getters/setters
src/components/Modal/index.tsx                   # consumes the hook
```

Components call the `use*StateHook`, never `useRecoilState` directly. Currently two features use this: `AppLoader` (`LoadingAtom`, `ReadyAtom`) and `Modal`.

### Loading and modal flow

`Layout` (dynamically imported with `suspense: true` from `index.tsx`) renders `<Modal />` and `<AppLoader />` outside the content container and hides the container while `isLoading`. `AppLoader` flips `isLoading` off after 1s and `isReady` on after 3s via `setTimeout` — the intro animation is time-based, not load-event-based. Project cards call `setModal({ type: ModalType.PROJECT, ... })`; `Modal` renders `ProjectModal` when `modalContent.type === "project"` and closes via the `useClickOutside` hook.

### Images

`src/components/Image` wraps `next/image` and swaps to `fallbackSrc` on error. Project images are referenced as `.webp` with the `.jpg` sibling as fallback (`image.replace(".webp", ".jpg")`), so `public/images/` keeps both formats per asset.

## Conventions

Enforced by `.eslintrc.json` (typescript-eslint `recommended-requiring-type-checking` + `jsx-a11y` + `styled-components-a11y`):

- Double quotes, semicolons required, `curly` always, `eqeqeq` smart.
- `import/order`: react first → other external → `@/*` internal, blank line between groups, alphabetized case-insensitively.
- Path aliases (`tsconfig.json`): `@/components/*`, `@/pages/*`, `@/layouts/*`, `@/hooks/*`, `@/data/*`, `@/styles/*` map into `src/`, but **`@/types/*` maps to the root-level `types/` directory**, not `src/types`.
- TS `strict: true`; several unsafe-* rules are deliberately off, but `no-floating-promises`/`no-explicit-any` are too — don't assume they'll catch mistakes.
- Commits follow `feat:` / `fix:` / `chore:` / `docs:` / `refactor:` prefixes. **Do not add `Co-Authored-By` trailers.**

## Gotchas

- `src/pages/_document.tsx` collects styled-components styles via `ServerStyleSheet` and loads Roboto (which `globals.css` asks for). It replaced a misnamed, malformed `_documents.tsx` whose `enhanceApp` returned a whole `<Html>` tree — that file was never picked up by Next, so before this the app shipped no SSR styles and never loaded its font. Keep the standard `enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />)` shape.
- Test coverage is a placeholder (`__tests__/src/pages/index.test.tsx` asserts `1 === 1`) and `__tests__/setups/jest.setup.js` is empty. Jest is wired up (jsdom, `next/jest`, tsconfig path mapping, style/file mocks in `__tests__/__mocks__/`) but nothing real is tested yet.
- `.env.production` and `.env.test` are committed and define `HOST`, `DEBUG`, `ANALYZE`. There is no `.env.development`, so `process.env.HOST` is undefined under `npm run dev` and `SEO`'s canonical URL falls back to `"#"`. Only `HOST` and `DEBUG` are exposed to the client (via `env` in `next.config.js`).
- `next.config.js` sets `trailingSlash: true` and strips all `console.*` except `console.error` from production builds.
- Lighthouse reports live in `analyze/*.pdf`.
