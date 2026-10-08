---
description: Scan the site's content and the agent docs for copy rule violations
---

Audit the copy against the content-rules skill.

1. Run `npx jest __tests__/src/data --watchAll=false` and report any failure with its file and line.
2. Run `node scripts/agent/audit.mjs`, which applies the same rules as the hooks to every content file and lists each violation with its file and line.
3. Then read the copy for what no script can catch: figures that are not floors, a missing measure, the current platform counted in users, an employer named in a drawing, a client the site does not already name, tone that sells instead of states.

Report a table of file, line, rule and a suggested fix. Change nothing until Red says which fixes to apply.
