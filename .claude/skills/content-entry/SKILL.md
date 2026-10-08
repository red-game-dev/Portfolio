---
name: content-entry
description: Adding or changing a role, venture, project, case study, skill, recommendation or proof figure in the portfolio data.
---

# Adding to the portfolio data

Run the evidence-check and content-rules skills first. Then put the entry in the file for its part of the page under `src/data/portfolio/`; its type is in `types/`.

- **A role**: `history.ts`, newest first, with `from`, `to` (none while current), `description`, `techStack`, `industries` and a `productOutcome` (a test requires it). A company Red founded sets `isVenture: true` and lands on the gold branch.
- **A venture with a project page**: also a `projects.ts` entry; set `countsForSkills: false` on one of the two so its years count once.
- **A case study**: `caseStudies.ts`, with a unique title, points, an `audiences` list and a `loot` line.
- **A skill**: add the name to its group in `skills.ts`. Its years come only from roles and projects that list or mention it, so add that evidence. A new tool needs its public release month in `SKILL_RELEASES` (`src/config/skills.ts`), and a first use in `SKILL_FIRST_USED` where Red started later. Skills by Area must not repeat a forge skill.
- **A proof figure**: `profile.ts`, with an `id`; anything that shows a figure picks it by id.

Then run `npx jest __tests__/src/data __tests__/src/services --watchAll=false`. The Ask Red knowledge is built from the same data, so check its token budget test still passes.
