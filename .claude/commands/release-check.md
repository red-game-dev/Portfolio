---
description: Everything that must be green before a branch is merged, in one report
---

Run the release checks for the current branch and report them together.

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npx jest --watchAll=false` (note the count of passing and skipped tests)
4. Compile every changed `.tsx` under `src/components` with Next's Babel (see Gotchas in CLAUDE.md), so a Tailwind class twin does not support is caught.
5. `git diff --stat origin/main...HEAD`, and whether the branch carries another open PR's commits.
6. If `package.json` changed: name each new dependency and why it is needed.
7. The verify-on-preview skill on the branch's preview, including Lighthouse against its thresholds.

End with one line per check (pass, fail, or not run and why) and the manual steps left for Red, such as keys to add or settings to change.
