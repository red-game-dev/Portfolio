---
description: Push the current branch, wait for its Vercel preview, and verify the change there
---

Verify the current branch on its deployed preview, following the verify-on-preview skill step by step.

1. Run the fast checks and stop on a failure: `npx tsc --noEmit`, `npm run lint`, `npx jest --watchAll=false`.
2. Push the branch if it has unpushed commits, then wait for the Vercel status on the head commit and take the preview URL.
3. Drive the preview with the Playwright tools at phone and desktop width, exercising what this branch changed ($ARGUMENTS if given, otherwise read `git log origin/main..HEAD` to know what changed).
4. Read the console, take screenshots, and run Lighthouse if layout, images, fonts or animation changed.

Report: the preview URL, what you checked, what passed, what failed with evidence, and what you could not verify.
