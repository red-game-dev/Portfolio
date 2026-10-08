---
name: section-authoring
description: Building or changing a section of the page: its id, place in the journey, intro copy per view, and tests.
---

# Building a section

1. Add its id to `SECTION_IDS` in `src/config/sections.ts`, lower case, in page order, and render it with the shared `Section` component.
2. Place it inside an existing journey stop's run (`JOURNEY_STOPS` in `src/config/journey.ts`) and in the trail; a test checks the stops cover the trail.
3. Put every word in the data: the intro under a `SectionIntroKey` in `sections.ts`, with `lenses: { recruiter, product }` descriptions where those readers need other wording. Titles never change per view.
4. Compose it in `src/pages/index.tsx` from `portfolioData`; the component stays content free.
5. Heavy parts (canvas, drawings, sheets) load lazily: a dynamic import, `useCanvasEngine`, or a loader like the blueprints'. See Performance in CLAUDE.md, and the performance-budget skill.
6. Accessibility: real buttons and links, labels on icon buttons, readable text kept in the DOM over any canvas, reduced motion respected.
7. Tests: logic in a pure function beside the component with its own test; `pages/index.test.tsx` renders the page in every view and fails on any console error.

Verify with the verify-on-preview skill in all three views.
