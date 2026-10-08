---
name: ask-agent
description: Working on Ask Red, the terminal's AI agent: its knowledge, prompt, providers, limits, caching or evals.
---

# Ask Red

The layers are described in "Ask Red" in CLAUDE.md: `http/api-client`, `ai/engine`, `server/kv`, `server/quota` and the `ai/ask` domain, composed in `src/services/ask/`.

- **Changing what it knows**: change the site. The knowledge is built from `portfolioData` by `PortfolioKnowledgeMapper`; a test holds it under `ASK_KNOWLEDGE_TOKEN_BUDGET`, and the answer cache rolls over by itself because its key hashes the knowledge.
- **Changing how it answers**: edit the rules in `src/services/ask/prompt.ts`, then add or update an eval in `src/services/ask/evals.ts`. Every term an eval expects must be on the site; a test checks it.
- **Adding a provider**: add an entry to `ASK_PROVIDERS` in `src/config/ask.ts` with its key variable, models, effort, token limits and prices per million tokens. A provider on Claude's or OpenAI's API needs no code. One on another API gets a provider class extending `StreamingProvider`, with its own request and event mappers and a stream guard.
- **Changing limits, budget or caching**: `src/config/ask.ts`. The hard monthly cap is the spend limit set with each paid provider.
- **Never** put a key in the repo, import `src/services/ask/server.ts` from page code, or let a provider error reach the visitor as anything but the domain's error codes.

Check with `npx jest __tests__/src/packages/ai __tests__/src/services/ask --watchAll=false`, then run the evals against the preview (the eval-ask command) once a provider key is set.
