---
description: Run the Ask Red evals against a deployment
argument-hint: <deployment url, defaults to this branch's preview>
---

Run the Ask Red evals against $ARGUMENTS (or this branch's preview URL if none is given):

```bash
ASK_EVAL_URL=<url> npx jest __tests__/src/services/ask/evals.test.ts --watchAll=false
```

The deployment needs a provider key, or every eval fails with a 503. For each failing eval, show the question, the answer, and which expectation it missed, and say whether the fix belongs in the prompt (`src/services/ask/prompt.ts`), the site's content, or the eval itself.
