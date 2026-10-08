---
name: blueprint-authoring
description: Adding or changing an architecture blueprint, wireframe or user journey drawn by src/components/Blueprint.
---

# Blueprints

The full model is in "Blueprints" in CLAUDE.md. When you add or change one:

1. Put it in its section's file under `src/data/blueprints/` (or `ventures.ts` for Red's own ventures), and add a new section to the loader's switch and to `all.ts`. Never import `Blueprint`, `BlueprintList` or `BlueprintTabs` from page code.
2. Name no employer anywhere in it, and no client: describe the kind of system. The overview says what was proposed and built, with a scale that names no one.
3. Give it all three tabs: Overview (role, scale, stack), Architecture (groups placed on the grid with `place`, nodes inside, edges between ids that exist) and Product flow (wireframes and journeys with steps).
4. Keep it within 800px wide, the room a dialog has, and keep the note that it is a glance, not the full design.
5. Run `npx jest __tests__/src/data --watchAll=false`: the data tests check ids, edges, widths and the employer rule.

Verify the drawing on the preview at both widths, including the zoomed in and scaled to fit modes on a phone.
