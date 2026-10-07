# insights/ai-usage

Domain model and service for presenting how someone uses AI: a headline, prompt counts per kind of work, subject areas, a staged agent workflow, and a timeline.

## Flow

```
ContentSource.read()  ->  isAiUsageContent (guard)  ->  AiUsageContentValidator  ->  AiUsageViewMapper  ->  AiUsageView
     raw data              shape, or a typed error       rules, every error          ranked, floored, scaled
```

`AiUsageService` extends `ContentService` from `core/content`, which owns that order. The service only chooses the guard, validator and mapper.

## Not tied to a host

- Content arrives through the `ContentSource` port as `unknown`, so it can come from a file, a CMS or an API. The guard proves its shape before anything trusts it.
- Stage icons are a type parameter (`AiUsageService<TIcon>`), so the package never imports an icon library.
- Bar length and the rounding step for counts live in `config/` and can be changed per mapper.

## Rules enforced

- Every task count is a whole, positive number and task names are unique. Counts are floors and never sum to a total, because one prompt can fall in more than one row.
- Labels round down, never up: 3,085 shows as "3,050+".
- There is at least one agent stage and at least one headline line.

Breaking a rule throws `AiUsageValidationError` listing every problem, which fails a static build instead of shipping a wrong chart.

## Usage

```ts
import { InMemoryContentSource } from "@/packages/core/content";
import { AiUsageService } from "@/packages/insights/ai-usage";

const view = new AiUsageService<IconDefinition>(new InMemoryContentSource(content)).getView();
```
