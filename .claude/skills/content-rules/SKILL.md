---
name: content-rules
description: The copy rules for anything the site or its agent says. Use before writing or changing text in src/data/, blueprints, terminal copy, the CV document, the Ask Red prompt, CLAUDE.md or these skills.
---

# Content rules

Everything the site says is data in `src/data/portfolio/` (see "Content is data, not markup" in CLAUDE.md). Hold every line to these rules.

1. No em dashes. Use a comma, a full stop or a colon. A test fails on one in the data, and the hooks warn on any in a content file.
2. No emojis.
3. Plain words, short sentences, first person on the site ("I built"), third person in the agent's answers.
4. Figures are floors and carry their measure: "1.5M+ users in 167 countries", never rounded up. A new figure needs the evidence-check skill first.
5. The platform Red works on now is counted in sessions, never users, and is described in the present tense.
6. Never name an employer inside a blueprint or wireframe; describe the kind of system (a test enforces it).
7. Never name a company, client or product that the site does not already name. Some names are banned outright: they are listed in `.claude/private/denylist.txt`, which is gitignored so the rule never names them in this public repo. If that file is missing, ask Red before naming any client.
8. No figure from a confidential letter or contract, and no revenue or margin figures for an employer.

Check before you finish:

```bash
npx jest __tests__/src/data --watchAll=false
```

`contentRules.test.ts` covers emojis, the denylist, the agent's knowledge and the docs; `portfolioData.test.ts` covers em dashes and the employer rule.
