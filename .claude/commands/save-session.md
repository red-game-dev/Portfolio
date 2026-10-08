---
description: Write a handoff note so the next session starts where this one stopped
---

Write a handoff note to `.claude/sessions/<YYYY-MM-DD>-<branch>.md` (gitignored), in this order:

1. **Where things are**: branch, open PRs with their state, what is deployed.
2. **Done this session**: one line each, with commit hashes.
3. **In progress**: what is half done and the exact next step.
4. **Waiting on Red**: decisions, keys, merges.
5. **Decisions made**: each with Red's answer, so no one asks again.
6. **Gotchas found**: anything that cost time and is not yet in CLAUDE.md.

Keep it under 60 lines, plain, no em dashes. Then say where it was saved.
