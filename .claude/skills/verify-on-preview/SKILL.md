---
name: verify-on-preview
description: How a change is accepted on this repo. Use after any change that affects what ships, before saying it works.
---

# Verify on the preview

Type checks, lint, jest and the build can all pass while the page is broken: hydration mismatches only show in the browser console. A change is accepted on the deployed Vercel preview, never on a local build.

1. Run the fast checks first: `npx tsc --noEmit`, `npm run lint`, `npx jest --watchAll=false`. Compile any changed component that uses twin.macro with Next's Babel (see Gotchas in CLAUDE.md).
2. Commit and push the branch. Wait for the Vercel status on the commit:
   `gh api repos/red-game-dev/Portfolio/commits/<sha>/status --jq '.statuses[] | select(.context=="Vercel") | .state'`
   then take the preview URL from the deployment's `environment_url`.
3. With the Playwright tools, open the preview at phone width (390x844) and at desktop width (1440x900). Wait out the 3 second intro.
4. Exercise the change itself, not just the page load: scroll to it, click it, switch views (`?view=recruiter`, `?view=product`, `?view=engineer`).
5. Read the console at warning level. Any hydration warning or error you did not expect is a failure.
6. Take a screenshot of the change at phone width and look at it.
7. For a change to layout, images, fonts or animation, run Lighthouse on the preview (chrome devtools `lighthouse_audit`). Hold: accessibility 100, best practices 90+, SEO 90+, performance 90+ on desktop and 70+ on mobile.

Report what you verified and how, and say plainly what you could not verify.
